import { v4 as uuidv4 } from 'uuid'
import { Request } from 'express'

export function generateId(): string {
  return uuidv4()
}

export function maskToken(token: string): string {
  if (token.length <= 8) return '****'
  return token.substring(0, 4) + '****' + token.substring(token.length - 4)
}

export function getClientIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'] as string | undefined
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return req.ip || null
}

export function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
}