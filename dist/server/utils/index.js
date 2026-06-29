"use strict";
function generateId() {
    const { v4: uuidv4 } = require('uuid');
    return uuidv4();
}
function maskToken(token) {
    if (token.length <= 8)
        return '****';
    return token.substring(0, 4) + '****' + token.substring(token.length - 4);
}
function getClientIp(req) {
    return (req.headers['x-forwarded-for'] || req.ip || 'unknown');
}
function generateRequestId() {
    return `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}
module.exports = { generateId, maskToken, getClientIp, generateRequestId };
//# sourceMappingURL=index.js.map