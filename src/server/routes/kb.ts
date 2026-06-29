import { Router } from 'express'
import type { Request, Response } from 'express'
import { tokenStore } from '../services/tokenStore.js'

const router = Router()

async function verifyToken(req: Request, res: Response, requiredPermission: 'read' | 'write' = 'read') {
  const kbId = req.params.kbId || req.body.kb_id
  if (!kbId || isNaN(Number(kbId)) || Number(kbId) <= 0) {
    res.status(400).json({ success: false, error: 'Invalid KB ID' })
    return null
  }

  const token = await tokenStore.findByKbId(kbId)
  if (!token) {
    res.status(401).json({ success: false, error: 'No token found for this KB' })
    return null
  }

  if (token.status !== 'active') {
    res.status(401).json({ success: false, error: 'Token is not active' })
    return null
  }

  if (token.permission === 'read' && requiredPermission === 'write') {
    res.status(403).json({ success: false, error: 'Insufficient permissions: need write access' })
    return null
  }

  return token
}

router.get('/:kbId', async (req, res) => {
  const token = await verifyToken(req, res, 'read')
  if (!token) return

  res.json({
    success: true,
    kbId: req.params.kbId,
    token: token.token,
    permission: token.permission,
    message: 'KB read access verified',
  })
})

router.post('/:kbId/documents', async (req, res) => {
  const token = await verifyToken(req, res, 'write')
  if (!token) return

  const { title, content, category } = req.body
  if (!title || !content) {
    return res.status(400).json({ success: false, error: 'title and content required' })
  }

  // TODO: Call external KM API to create document
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
  })
})

router.put('/:kbId/documents/:docId', async (req, res) => {
  const token = await verifyToken(req, res, 'write')
  if (!token) return

  const { title, content, category } = req.body
  // TODO: Call external KM API to update document
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
  })
})

router.delete('/:kbId/documents/:docId', async (req, res) => {
  const token = await verifyToken(req, res, 'write')
  if (!token) return

  // TODO: Call external KM API to delete document
  res.json({
    success: true,
    kbId: req.params.kbId,
    docId: req.params.docId,
    message: 'Document deleted successfully',
  })
})

router.get('/:kbId/documents', async (req, res) => {
  const token = await verifyToken(req, res, 'read')
  if (!token) return

  res.json({
    success: true,
    kbId: req.params.kbId,
    documents: [],
    message: 'Documents listed successfully',
  })
})

export default router