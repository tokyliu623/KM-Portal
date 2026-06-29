import { Router } from 'express';
import { tokenStore } from '../services/tokenStore.js';
const router = Router();
async function verifyToken(req, res, requiredPermission = 'read') {
    const kbId = req.params.kbId || req.body.kb_id;
    if (!kbId) {
        res.status(400).json({ error: 'kbId required' });
        return null;
    }
    const token = await tokenStore.findByKbId(kbId);
    if (!token) {
        res.status(401).json({ error: 'No token found for this KB' });
        return null;
    }
    if (token.status !== 'active') {
        res.status(401).json({ error: 'Token is not active' });
        return null;
    }
    if (token.permission === 'read' && requiredPermission === 'write') {
        res.status(403).json({ error: 'Insufficient permissions: need write access' });
        return null;
    }
    return token;
}
router.get('/:kbId', async (req, res) => {
    const token = await verifyToken(req, res, 'read');
    if (!token)
        return;
    res.json({
        success: true,
        kbId: req.params.kbId,
        token: token.token,
        permission: token.permission,
        message: 'KB read access verified',
    });
});
router.post('/:kbId/documents', async (req, res) => {
    const token = await verifyToken(req, res, 'write');
    if (!token)
        return;
    const { title, content, category } = req.body;
    if (!title || !content) {
        return res.status(400).json({ error: 'title and content required' });
    }
    res.json({
        success: true,
        kbId: req.params.kbId,
        document: {
            id: Date.now().toString(),
            title,
            content,
            category: category || 'general',
            createdAt: new Date().toISOString(),
        },
        message: 'Document created successfully',
    });
});
router.put('/:kbId/documents/:docId', async (req, res) => {
    const token = await verifyToken(req, res, 'write');
    if (!token)
        return;
    const { title, content, category } = req.body;
    res.json({
        success: true,
        kbId: req.params.kbId,
        docId: req.params.docId,
        document: {
            id: req.params.docId,
            title: title || 'Untitled',
            content: content || '',
            category: category || 'general',
            updatedAt: new Date().toISOString(),
        },
        message: 'Document updated successfully',
    });
});
router.delete('/:kbId/documents/:docId', async (req, res) => {
    const token = await verifyToken(req, res, 'write');
    if (!token)
        return;
    res.json({
        success: true,
        kbId: req.params.kbId,
        docId: req.params.docId,
        message: 'Document deleted successfully',
    });
});
router.get('/:kbId/documents', async (req, res) => {
    const token = await verifyToken(req, res, 'read');
    if (!token)
        return;
    res.json({
        success: true,
        kbId: req.params.kbId,
        documents: [],
        message: 'Documents listed successfully',
    });
});
export default router;
