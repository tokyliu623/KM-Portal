import { describe, it, expect } from 'vitest'
import { maskToken, generateId, getClientIp, generateRequestId } from '../../src/server/utils'

describe('utils', () => {
  describe('maskToken', () => {
    it('masks middle of long token', () => {
      expect(maskToken('abcdefghijklmnop')).toBe('abcd****mnop')
    })

    it('returns **** for short tokens', () => {
      expect(maskToken('short')).toBe('****')
    })

    it('handles exactly 8-char tokens', () => {
      expect(maskToken('12345678')).toBe('****')
    })
  })

  describe('generateId', () => {
    it('returns a valid UUID v4 string', () => {
      const id = generateId()
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })

    it('returns unique ids', () => {
      const a = generateId()
      const b = generateId()
      expect(a).not.toBe(b)
    })
  })

  describe('getClientIp', () => {
    it('returns first IP from x-forwarded-for', () => {
      const req = { headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }, ip: '127.0.0.1' }
      expect(getClientIp(req as never)).toBe('1.2.3.4')
    })

    it('returns req.ip when no forwarded header', () => {
      const req = { headers: {}, ip: '10.0.0.1' }
      expect(getClientIp(req as never)).toBe('10.0.0.1')
    })

    it('returns null when no IP info', () => {
      const req = { headers: {}, ip: undefined }
      expect(getClientIp(req as never)).toBeNull()
    })
  })

  describe('generateRequestId', () => {
    it('starts with "req-"', () => {
      expect(generateRequestId().startsWith('req-')).toBe(true)
    })
  })
})
