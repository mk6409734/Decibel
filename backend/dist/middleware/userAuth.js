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
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = require("jsonwebtoken");
const consts_1 = require("../utils/consts");
const config = require('config');
let userAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.header('x-auth-token');
    if (!token) {
        return res
            .status(consts_1.ErrorCode.HTTP_NOT_AUTH)
            .json((0, consts_1.errorWrapper)('Token Not Found'));
    }
    try {
        (0, jsonwebtoken_1.verify)(token, config.get('jwtSecret'), (error, decoded) => {
            if (error) {
                res
                    .status(consts_1.ErrorCode.HTTP_NOT_AUTH)
                    .json((0, consts_1.errorWrapper)('Token is not valid'));
            }
            else {
                req.user = decoded.user;
                next();
            }
        });
    }
    catch (err) {
        console.error('Token Error ' + err.message);
        res.status(consts_1.ErrorCode.HTTP_SERVER_ERROR).json((0, consts_1.errorWrapper)('Server Error'));
    }
});
exports.default = userAuth;
//# sourceMappingURL=userAuth.js.map