import { describe, it, expect } from 'vitest'
import { errorHandler } from '../../src/server/middleware/errorHandler'
import type { Request, Response } from 'express'

function makeRes() {
  const res = {
    statusCode: 200,
    body: null as unknown,
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(payload: unknown) {
      this.body = payload
      return this
    },
  }
  return res as unknown as Response & { statusCode: number; body: unknown }
}

describe('errorHandler', () => {
  it('returns 500 for plain Error', () => {
    const res = makeRes()
    errorHandler(new Error('boom'), {} as Request, res, (() => {}) as never)
    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({ success: false, error: 'boom' })
  })

  it('respects custom statusCode', () => {
    const res = makeRes()
    const err = Object.assign(new Error('forbidden'), { statusCode: 403 })
    errorHandler(err, {} as Request, res, (() => {}) as never)
    expect(res.statusCode).toBe(403)
    expect(res.body).toEqual({ success: false, error: 'forbidden' })
  })

  it('hides details in production', () => {
    const prev = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    const res = makeRes()
    errorHandler(new Error('internal-secret'), {} as Request, res, (() => {}) as never)
    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({ success: false, error: 'Internal server error' })
    process.env.NODE_ENV = prev
  })
})
