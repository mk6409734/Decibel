"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const dbConnector_1 = __importDefault(require("./config/dbConnector"));
const auth_1 = __importDefault(require("./routes/api/auth"));
const siren_1 = __importDefault(require("./routes/api/siren"));
const config_1 = __importDefault(require("config"));
const cors_1 = __importDefault(require("cors"));
const socketManager_1 = __importStar(require("./sockets/socketManager"));
const http = __importStar(require("http"));
const PORT = config_1.default.get('serverPort');
//TODO: Integrate testing!
//**********************************Inits**********************************/
const app = (0, express_1.default)();
const server = http.createServer(app);
app.use(express_1.default.json());
(0, dbConnector_1.default)();
app.use((0, cors_1.default)());
//**********************************Routes**********************************/
app.use('/api/auth', auth_1.default);
app.use('/api/siren', siren_1.default);
app.use('/api/controller', socketManager_1.controllerRouter);
socketManager_1.default.init(server);
server.listen(PORT, () => {
    console.log('Go!');
});
//# sourceMappingURL=app.js.map