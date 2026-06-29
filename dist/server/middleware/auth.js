"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = auth;
function auth(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    next();
}
//# sourceMappingURL=auth.js.map