import { Router } from 'express';
import { tokenStore } from '../services/tokenStore.js';
const router = Router();
router.get('/tokens', async (_req, res) => {
    try {
        const tokens = await tokenStore.findAll();
        res.json({ success: true, data: tokens });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch tokens' });
    }
});
router.post('/tokens', async (req, res) => {
    try {
        const { kb_id, kb_name, token, owner, permission, expiresAt } = req.body;
        if (!kb_id || !token || !owner) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }
        const newToken = await tokenStore.create({
            kb_id: Number(kb_id),
            kb_name: kb_name || '',
            token,
            owner,
            permission: permission || 'read',
            status: 'active',
            expiresAt: expiresAt || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        });
        res.json({ success: true, data: newToken });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to create token' });
    }
});
router.put('/tokens/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const allowedFields = ['kb_name', 'token', 'owner', 'permission', 'status', 'expiresAt'];
        const updateData = Object.keys(req.body)
            .filter((key) => allowedFields.includes(key))
            .reduce((acc, key) => ({ ...acc, [key]: req.body[key] }), {});
        const updated = await tokenStore.update(id, updateData);
        if (!updated) {
            return res.status(404).json({ success: false, error: 'Token not found' });
        }
        res.json({ success: true, data: updated });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update token' });
    }
});
router.post('/tokens/:id/revoke', async (req, res) => {
    try {
        const { id } = req.params;
        const success = await tokenStore.revoke(id);
        if (!success) {
            return res.status(404).json({ success: false, error: 'Token not found' });
        }
        res.json({ success: true, message: 'Token revoked' });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to revoke token' });
    }
});
router.delete('/tokens/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const success = await tokenStore.delete(id);
        if (!success) {
            return res.status(404).json({ success: false, error: 'Token not found' });
        }
        res.json({ success: true, message: 'Token deleted' });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete token' });
    }
});
export default router;
//# sourceMappingURL=admin.js.map