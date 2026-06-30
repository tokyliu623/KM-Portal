import { Request, Response, NextFunction } from 'express'
import { apiKeyStore } from '../services/apiKeyStore.js'
import { tokenStore } from '../services/tokenStore.js'

declare module 'express-serve-static-core' {
  interface Request {
    apiKeyId?: string
    kbId?: string
    skillName?: string
    skillId?: string
    resolvedToken?: { token: string; permission: 'read' | 'write' }
  }
}

export async function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Missing or invalid Authorization header' })
  }
  const apiKey = authHeader.substring(7).trim()
  if (!apiKey) {
    return res.status(401).json({ success: false, error: 'Empty API key' })
  }

  const keyRecord = await apiKeyStore.findByKey(apiKey)
  if (!keyRecord) {
    return res.status(401).json({ success: false, error: 'Invalid API key' })
  }
  if (!keyRecord.kbId || !keyRecord.skillId) {
    return res.status(403).json({ success: false, error: 'API key is not associated with a Skill' })
  }

  const token = await tokenStore.findByKbId(keyRecord.kbId)
  if (!token || token.status !== 'active') {
    return res.status(401).json({ success: false, error: 'No active token for associated KB' })
  }

  req.apiKeyId = keyRecord.id
  req.kbId = String(keyRecord.kbId)
  req.skillId = keyRecord.skillId
  req.skillName = keyRecord.skillName
  req.resolvedToken = { token: token.token, permission: token.permission }

  if (!req.body.kbId && !req.body.kb_id) {
    req.body.kbId = keyRecord.kbId
  }

  apiKeyStore.updateLastUsed(keyRecord.id).catch((err) =>
    console.error('[apiKeyAuth] updateLastUsed failed:', err.message)
  )

  next()
}
