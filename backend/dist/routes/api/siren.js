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
const express_1 = __importDefault(require("express"));
const Siren_1 = __importDefault(require("../../models/Siren"));
const router = express_1.default.Router();
router.get('/all', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sirens = yield Siren_1.default.find();
        res.json(sirens);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}));
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const siren = yield Siren_1.default.findById(req.params.id);
        if (!siren) {
            return res.status(404).json({ message: 'Siren not found' });
        }
        res.json(siren);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}));
router.post('/create', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, name, location, languagesInRegion, color, labels } = req.body;
    const siren = new Siren_1.default({
        id,
        name,
        location,
        playing: false,
        languagesInRegion,
        color,
        labels,
    });
    try {
        const newSiren = yield siren.save();
        res.status(201).json(newSiren);
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}));
router.patch('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const updates = req.body;
    try {
        const updatedSiren = yield Siren_1.default.findByIdAndUpdate(req.params.id, updates, {
            new: true,
        });
        if (!updatedSiren) {
            return res.status(404).json({ message: 'Siren not found' });
        }
        res.json(updatedSiren);
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}));
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deletedSiren = yield Siren_1.default.findByIdAndDelete(req.params.id);
        if (!deletedSiren) {
            return res.status(404).json({ message: 'Siren not found' });
        }
        res.json({ message: 'Siren deleted', siren: deletedSiren });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}));
exports.default = router;
//# sourceMappingURL=siren.js.map