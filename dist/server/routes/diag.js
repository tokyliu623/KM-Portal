"use strict";
const { Router } = require('express');
const { tokenStore } = require('../services/tokenStore');
const router = Router();
router.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'KM-Portal',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});
router.get('/token/:kbId', async (req, res) => {
    try {
        const { kbId } = req.params;
        const token = await tokenStore.findByKbId(kbId);
        if (!token) {
            return res.json({
                kbId,
                status: 'not_found',
                message: 'No active token found for this KB',
            });
        }
        const expiresAt = new Date(token.expiresAt);
        const now = new Date();
        const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return res.json({
            kbId,
            status: token.status,
            permission: token.permission,
            expiresAt: token.expiresAt,
            daysUntilExpiry,
            isExpiringSoon: daysUntilExpiry <= 7 && daysUntilExpiry > 0,
            isExpired: daysUntilExpiry <= 0,
            owner: token.owner,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Diagnosis failed' });
    }
});
router.post('/verify', async (req, res) => {
    try {
        const { kbId, token } = req.body;
        if (!kbId || !token) {
            return res.status(400).json({ error: 'kbId and token required' });
        }
        const storedToken = await tokenStore.findByKbId(kbId);
        if (!storedToken) {
            return res.json({ valid: false, reason: 'Token not found' });
        }
        if (storedToken.token !== token) {
            return res.json({ valid: false, reason: 'Token mismatch' });
        }
        if (storedToken.status !== 'active') {
            return res.json({ valid: false, reason: 'Token is revoked' });
        }
        const expiresAt = new Date(storedToken.expiresAt);
        if (expiresAt < new Date()) {
            return res.json({ valid: false, reason: 'Token expired' });
        }
        res.json({ valid: true, permission: storedToken.permission });
    }
    catch (error) {
        res.status(500).json({ error: 'Verification failed' });
    }
});
module.exports = router;
//# sourceMappingURL=diag.js.map