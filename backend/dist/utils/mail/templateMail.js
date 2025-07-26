"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forgot = exports.confirm = void 0;
const config = require('config');
const clientOrigin = config.get('clientOrigin');
const confirm = (id) => ({
    subject: 'Confirmation Link',
    html: `
      <a href='${clientOrigin}/confirm/${id}'>
        Click here to verify your Email!
      </a>
    `,
    text: `Copy and paste this link: ${clientOrigin}/confirm/${id}`,
});
exports.confirm = confirm;
const forgot = (id) => ({
    subject: 'Forgot Password?',
    html: `
    <a href='${clientOrigin}/confirm/${id}'>
      Click here to verify your Email!
    </a>
  `,
    text: `Copy and paste this link: ${clientOrigin}/confirm/${id}`,
});
exports.forgot = forgot;
//# sourceMappingURL=templateMail.js.map