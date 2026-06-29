"use strict";
const { recordCall } = require('../services/statsStore');
const { getClientIp } = require('../utils/index');
function requestLogger(req, res, next) {
    const start = Date.now();
    const originalSend = res.send;
    res.send = function (body) {
        const latency = Date.now() - start;
        if (req.apiKeyId) {
            recordCall({
                apiKeyId: req.apiKeyId,
                kbId: req.kbId || '',
                endpoint: req.path,
                method: req.method,
                statusCode: res.statusCode,
                latencyMs: latency,
                ip: getClientIp(req),
                userAgent: req.headers['user-agent'] || '',
            });
        }
        return originalSend.call(this, body);
    };
    next();
}
module.exports = { requestLogger };
//# sourceMappingURL=logger.js.map