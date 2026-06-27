import { v4 as uuidv4 } from 'uuid'

export function generateId(): string {
  return uuidv4()
}

export function maskToken(token: string): string {
  if (token.length <= 8) return '****'
  return token.substring(0, 4) + '****' + token.substring(token.length - 4)
}

export function getClientIp(req: Request): string {
  return ((req.headers['x-forwarded-for'] as string) || req.ip || 'unknown')
}

export function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
}

import { Request } from 'express'