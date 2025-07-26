"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.controllerRouter = void 0;
const socket_io_1 = require("socket.io");
const express_1 = require("express");
const turf_1 = require("@turf/turf");
const Siren_1 = __importDefault(require("../models/Siren"));
const bodyParser = require('body-parser');
require('body-parser-xml')(bodyParser);
var io;
var socketManager = {
    init: (server) => console.log('not initialized'),
};
socketManager.init = (server) => {
    io = new socket_io_1.Server(server, {
        pingInterval: 4000,
        pingTimeout: 8000,
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });
    io.sockets.on('connection', socket => {
        io.on('connection', socket => {
            socket.on('siren-control', data => {
                let { sirenId, action, alertType, gapAudio, language } = data;
                if (!gapAudio)
                    gapAudio = 0;
                if (!language)
                    language = 'hi';
                console.log(`Siren ${sirenId} - ${action} - ${alertType} - ${gapAudio} - ${language}`);
                io.emit(`siren-control-siren`, { sirenId, action, alertType, gapAudio, language });
            });
            socket.on('siren-control-multi', data => {
                let { sirenIds, action, alertType, gapAudio, language } = data;
                if (!gapAudio)
                    gapAudio = 0;
                if (!language)
                    language = 'hi';
                console.log(`Sirens ${sirenIds} - ${action} - ${alertType} - ${gapAudio} - ${language}`);
                io.emit(`siren-control-multi-siren`, { sirenIds, action, alertType, gapAudio, language });
            });
            socket.on('siren-ack-on', data => {
                console.log(data);
                const sirenId = data;
                console.log(`Siren ${sirenId} on`);
                io.emit(`siren-acked`, { sirenId, running: true });
            });
            socket.on('siren-ack-off', data => {
                const sirenId = data;
                console.log(`Siren ${sirenId} off`);
                io.emit(`siren-acked`, { sirenId, running: false });
            });
            socket.on('disconnect', () => {
                console.log('User disconnected:', socket.id);
            });
            socket.on('connection-manager', data => {
                const { sirenId, isOnline } = data;
                io.emit(`connection-manager-push`, { sirenId, isOnline });
            });
        });
    });
};
const controllerRouter = (0, express_1.Router)();
exports.controllerRouter = controllerRouter;
const isMarkerInsidePolygon = (sirenPoint, polygon) => {
    console.log(sirenPoint);
    const isInside = (0, turf_1.booleanPointInPolygon)(sirenPoint, polygon.geometry);
    return isInside;
};
controllerRouter.post('/platform', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = req.body;
        let { polygonData, message, sirenControl, alertType, gapAudio, language, frequency } = data;
        const listOfItems = [];
        if (!frequency)
            frequency = 1;
        const sirenData = yield Siren_1.default.find();
        polygonData.map((polygonString) => {
            const coordinates = polygonString.split(' ').map((coord) => {
                const [lat, lng] = coord.split(',').map(parseFloat);
                return [lat, lng];
            });
            sirenData.map(siren => {
                if (isMarkerInsidePolygon({ coordinates: [siren.location.lat, siren.location.lng], type: 'Point' }, (0, turf_1.polygon)([coordinates]))) {
                    io.emit('siren-control-siren', {
                        sirenId: siren.id,
                        action: sirenControl === 'on' ? (message.length > 0 ? message : 'on') : 'off',
                        alertType,
                        gapAudio,
                        frequency,
                        language: language ? language : 'hi',
                    });
                    listOfItems.push(siren);
                }
            });
        });
        res.status(200).json({ success: true, sirensActivated: listOfItems });
    }
    catch (err) {
        res.status(500).json({ success: false });
    }
}));
controllerRouter.post('/cap', bodyParser.xml(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = req.body;
        const polygonData = data.alert.info[0].area[0].polygon;
        console.log(polygonData);
        const listOfItems = [];
        const sirenData = yield Siren_1.default.find();
        let message = '';
        let sirenControl = '';
        let alertType = '';
        let gapAudio = 0;
        let language = 'hi';
        let frequency = 1;
        console.log(data.alert.info[0].parameter);
        for (let param of data.alert.info[0].parameter) {
            if (param.valueName[0] === 'message') {
                message = param.value[0];
            }
            else if (param.valueName[0] === 'sirenControl') {
                sirenControl = param.value[0];
            }
            else if (param.valueName[0] === 'alertType') {
                alertType = param.value[0];
            }
            else if (param.valueName[0] === 'gapAudio') {
                gapAudio = param.value[0];
            }
            else if (param.valueName[0] === 'frequency') {
                frequency = param.value[0];
            }
        }
        console.log(frequency);
        if (data.alert.info[0].language && data.alert.info[0].language.length > 0) {
            language = data.alert.info[0].language[0];
        }
        if (data.alert.info[0].headline && data.alert.info[0].headline.length > 0) {
            message = data.alert.info[0].headline[0];
        }
        polygonData.map((polygonString) => {
            const coordinates = polygonString.split(' ').map((coord) => {
                const [lat, lng] = coord.split(',').map(parseFloat);
                return [lat, lng];
            });
            sirenData.map(siren => {
                if (isMarkerInsidePolygon({ coordinates: [siren.location.lat, siren.location.lng], type: 'Point' }, (0, turf_1.polygon)([coordinates]))) {
                    io.emit('siren-control-siren', {
                        sirenId: siren.id,
                        action: sirenControl === 'on' ? (message.length > 0 ? message : 'on') : 'off',
                        alertType,
                        gapAudio,
                        language,
                        frequency,
                    });
                    listOfItems.push(siren);
                }
            });
        });
        res.status(200).json({ success: 'true', sirensActivated: listOfItems });
    }
    catch (err) {
        res.status(500).json({ success: false });
    }
}));
exports.default = socketManager;
//# sourceMappingURL=socketManager.js.map