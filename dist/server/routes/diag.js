import { Router } from 'express';
import { tokenStore } from '../services/tokenStore.js';
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
        if (!kbId || isNaN(Number(kbId)) || Number(kbId) <= 0) {
            return res.status(400).json({ success: false, error: 'Invalid KB ID' });
        }
        const token = await tokenStore.findByKbId(kbId);
        if (!token) {
            return res.status(404).json({
                success: false,
                error: 'No active token found for this KB',
                kbId,
                status: 'not_found',
            });
        }
        const expiresAt = new Date(token.expiresAt);
        const now = new Date();
        const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return res.json({
            success: true,
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
        res.status(500).json({ success: false, error: 'Diagnosis failed' });
    }
});
router.post('/verify', async (req, res) => {
    try {
        const { kbId, token } = req.body;
        if (!kbId || !token) {
            return res.status(400).json({ success: false, error: 'kbId and token required' });
        }
        const storedToken = await tokenStore.findByKbId(kbId);
        if (!storedToken) {
            return res.status(404).json({ success: false, valid: false, reason: 'Token not found' });
        }
        if (storedToken.token !== token) {
            return res.status(401).json({ success: false, valid: false, reason: 'Token mismatch' });
        }
        if (storedToken.status !== 'active') {
            return res.status(401).json({ success: false, valid: false, reason: 'Token is revoked' });
        }
        const expiresAt = new Date(storedToken.expiresAt);
        if (expiresAt < new Date()) {
            return res.status(401).json({ success: false, valid: false, reason: 'Token expired' });
        }
        res.json({ success: true, valid: true, permission: storedToken.permission });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Verification failed' });
    }
});
export default router;
