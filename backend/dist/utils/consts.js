"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanMap = exports.errorWrapper = exports.ErrorCode = void 0;
/**
 * Enum for error codes
 * @readonly
 * @enum {int}
 */
exports.ErrorCode = Object.freeze({
    DB_CONN_ERR: 1,
    HTTP_BAD_REQ: 400,
    HTTP_NOT_AUTH: 401,
    HTTP_FORBIDDEN: 403,
    HTTP_NOT_FOUND: 404,
    HTTP_SERVER_ERROR: 500,
});
const errorWrapper = (message) => ({ errors: { message } });
exports.errorWrapper = errorWrapper;
const cleanMap = (obj) => Object.keys(obj).forEach(k => (obj[k] === null || obj[k] === undefined) && delete obj[k]);
exports.cleanMap = cleanMap;
//# sourceMappingURL=consts.js.map