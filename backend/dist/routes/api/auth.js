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
const express_1 = require("express");
const router = (0, express_1.Router)();
const express_validator_1 = require("express-validator");
const config = require('config');
const crypto_1 = __importDefault(require("crypto"));
const User_1 = __importDefault(require("../../models/User"));
const jsonwebtoken_1 = require("jsonwebtoken");
const bcryptjs_1 = require("bcryptjs");
const userAuth_1 = __importDefault(require("../../middleware/userAuth"));
const mongoose_1 = require("mongoose");
const sendMail_1 = __importDefault(require("../../utils/mail/sendMail"));
const templateMail_1 = require("../../utils/mail/templateMail");
const consts_1 = require("../../utils/consts");
// @route       POST api/user/register
// @desc        Create/Add a new user
// @access      Public
router.post('/register', 
//**********************************Validations**********************************/
[
    (0, express_validator_1.check)('name', 'Name is required').not().isEmpty(),
    (0, express_validator_1.check)('email', 'Please input valid email').isEmail(),
    (0, express_validator_1.check)('password', 'Please enter a password with 6 or more characters').isLength({
        min: 6,
    }),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(consts_1.ErrorCode.HTTP_BAD_REQ).json({ errors: errors.array() });
    }
    try {
        //**********************************Handler Code**********************************/
        const { email, name, password } = req.body;
        let user = yield User_1.default.findOne({ email });
        const salt = yield (0, bcryptjs_1.genSalt)(10);
        if (user) {
            return res.status(consts_1.ErrorCode.HTTP_BAD_REQ).json((0, consts_1.errorWrapper)('User Already Exists'));
        }
        const avatar = config.get('avatarBaseURI') + name.replace(' ', '+');
        const verificationToken = crypto_1.default.randomBytes(128).toString('hex');
        user = new User_1.default({
            name,
            email,
            password,
            avatar,
            verificationToken,
            verificationValid: Date.now() + 43200000,
        });
        user.password = yield (0, bcryptjs_1.hash)(password, salt);
        yield user.save();
        (0, sendMail_1.default)(email, (0, templateMail_1.confirm)(verificationToken));
        const payload = {
            user: {
                id: user.id,
                verified: false,
            },
        };
        (0, jsonwebtoken_1.sign)(payload, config.get('jwtSecret'), { expiresIn: 36000 }, (err, token) => {
            if (err)
                throw err;
            res.json({ token });
        });
    }
    catch (err) {
        console.error(`Err register:`, err);
        res.status(consts_1.ErrorCode.HTTP_SERVER_ERROR).json((0, consts_1.errorWrapper)('Server Error'));
    }
}));
// @route       POST api/user/login
// @desc        Login/ Get auth token
// @access      Public
router.post('/login', 
//**********************************Validations**********************************/
[
    (0, express_validator_1.check)('email', 'Please input valid email').isEmail(),
    (0, express_validator_1.check)('password', 'Password is required').exists(),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(consts_1.ErrorCode.HTTP_BAD_REQ).json((0, consts_1.errorWrapper)(errors.array()[0].msg));
    }
    //**********************************Handler Code**********************************/
    try {
        const { email, password } = req.body;
        let user = yield User_1.default.findOne({ email });
        if (!user) {
            return res.status(consts_1.ErrorCode.HTTP_BAD_REQ).json((0, consts_1.errorWrapper)('Invalid Credentials'));
        }
        const cresentialCheck = yield (0, bcryptjs_1.compare)(password, user.password);
        if (!cresentialCheck) {
            return res.status(consts_1.ErrorCode.HTTP_BAD_REQ).json((0, consts_1.errorWrapper)('Invalid Credentials'));
        }
        const payload = {
            user: {
                id: user.id,
            },
        };
        (0, jsonwebtoken_1.sign)(payload, config.get('jwtSecret'), { expiresIn: 36000 }, (err, token) => {
            if (err)
                throw err;
            res.json({ token, emailVerified: user === null || user === void 0 ? void 0 : user.emailVerified });
        });
    }
    catch (err) {
        console.error(`Err login:`, err);
        res.status(consts_1.ErrorCode.HTTP_SERVER_ERROR).json((0, consts_1.errorWrapper)('Server Error'));
    }
}));
// @route       POST api/user/forgot
// @desc        Forgot password mail trigger
// @access      Public
router.post('/forgot', 
//**********************************Validations**********************************/
[(0, express_validator_1.check)('email', 'Please input valid email').isEmail()], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(consts_1.ErrorCode.HTTP_BAD_REQ).json((0, consts_1.errorWrapper)(errors.array()[0].msg));
    }
    //**********************************Handler Code**********************************/
    try {
        const { email } = req.body;
        let user = yield User_1.default.findOne({ email });
        if (!user) {
            return res.status(consts_1.ErrorCode.HTTP_BAD_REQ).json((0, consts_1.errorWrapper)('Email Not Found'));
        }
        const verificationToken = crypto_1.default.randomBytes(128).toString('hex');
        user.verificationToken = verificationToken;
        user.verificationValid = new Date(new Date().getTime() + 43200000);
        yield (0, sendMail_1.default)(email, (0, templateMail_1.forgot)(verificationToken));
        yield user.save();
        res.json({ success: 'Email Sent!' });
    }
    catch (err) {
        console.error(`Err forgot:`, err);
        res.status(consts_1.ErrorCode.HTTP_SERVER_ERROR).json((0, consts_1.errorWrapper)('Server Error'));
    }
}));
// @route       GET api/user/confirm/:verificationToken
// @desc        Confirmation for verification and reset password
// @access      Public
router.get('/confirm/:verificationToken', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { verificationToken } = req.params;
        let user = yield User_1.default.findOne({ verificationToken });
        if (!user) {
            return res.status(consts_1.ErrorCode.HTTP_BAD_REQ).json((0, consts_1.errorWrapper)('Token Invalid'));
        }
        if (!user.verificationValid) {
            return res
                .status(consts_1.ErrorCode.HTTP_BAD_REQ)
                .json((0, consts_1.errorWrapper)('User Validation Completed Already!'));
        }
        let timeLeft = Date.now() - ((_a = user.verificationValid) === null || _a === void 0 ? void 0 : _a.getTime());
        if (timeLeft > 0) {
            user.verificationToken = '';
            user.verificationValid = undefined;
            yield user.save();
            return res.status(consts_1.ErrorCode.HTTP_FORBIDDEN).json((0, consts_1.errorWrapper)('Token Expired'));
        }
        user.verificationToken = '';
        user.verificationValid = undefined;
        user.emailVerified = true;
        yield user.save();
        return res.json({ emailVerification: !user.emailVerified });
    }
    catch (err) {
        console.error(`Err confirm:`, err);
        res.status(consts_1.ErrorCode.HTTP_SERVER_ERROR).json((0, consts_1.errorWrapper)('Server Error'));
    }
}));
// @route       POST api/user/
// @desc        Get user details
// @access      Public
router.get('/', userAuth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let user;
        if (req.user && req.user.id !== undefined && req.user.id !== null)
            user = yield User_1.default.findOne(new mongoose_1.Types.ObjectId(req.user.id));
        res.json(user);
    }
    catch (err) {
        console.error(`Err loadUser:`, err);
        res.status(consts_1.ErrorCode.HTTP_SERVER_ERROR).json((0, consts_1.errorWrapper)('Server Error'));
    }
}));
// @route       POST api/auth/update
// @desc        Update user details
// @access      Private
router.post('/update', userAuth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, avatar, userName } = req.body;
        let updateObject = {
            name,
            avatar,
            userName,
        };
        (0, consts_1.cleanMap)(updateObject);
        if (updateObject.name) {
            updateObject.avatar = config.get('avatarBaseURI') + name.replace(' ', '+');
        }
        if (!req.user || req.user.id === undefined || req.user.id === null) {
            return res.status(consts_1.ErrorCode.HTTP_BAD_REQ).json((0, consts_1.errorWrapper)('Invalid Token'));
        }
        else {
            const user = yield User_1.default.findByIdAndUpdate(new mongoose_1.Types.ObjectId(req.user.id), {
                $set: Object.assign({}, updateObject),
            }, { new: true });
            if (!user) {
                return res.status(consts_1.ErrorCode.HTTP_NOT_FOUND).json((0, consts_1.errorWrapper)('User Not Found'));
            }
            res.json(user);
        }
    }
    catch (err) {
        console.error(`Err updateUser:`, err);
        res.status(consts_1.ErrorCode.HTTP_SERVER_ERROR).json((0, consts_1.errorWrapper)('Server Error'));
    }
}));
exports.default = router;
//# sourceMappingURL=auth.js.map