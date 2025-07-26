"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const UserSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    userName: {
        type: String,
    },
    password: {
        type: String,
        required: true,
    },
    emailVerified: {
        type: Boolean,
        default: false,
    },
    avatar: {
        type: String,
    },
    verificationToken: {
        type: String,
    },
    verificationValid: {
        type: Date,
    },
});
/*
 * TODO: Add relevant middleware here to speed up and simplify processes
 * Also look at relevant virtuals!
 */
exports.default = (0, mongoose_1.model)('user', UserSchema);
//# sourceMappingURL=User.js.map