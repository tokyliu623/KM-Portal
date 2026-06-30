import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import express from 'express'
import diagRouter from '../../src/server/routes/diag'
import { translatorHealthCheck, asciiFallback } from '../../src/server/services/translator'

describe('Translator fallback behavior (v1.7.1)', () => {
  const originalKey = process.env.LLM_API_KEY

  afterAll(() => {
    if (originalKey) process.env.LLM_API_KEY = originalKey
    else delete process.env.LLM_API_KEY
  })

  it('asciiFallback should remove non-ASCII characters', () => {
    const result = asciiFallback('刘荣鑫个人知识库')
    expect(result).not.toMatch(/[\u4e00-\u9fa5]/)
    expect(result.length).toBeGreaterThan(0)
  })

  it('asciiFallback should keep English/numbers', () => {
    const result = asciiFallback('刘荣鑫 QualityFuture 123')
    expect(result).toContain('qualityfuture')
    expect(result).toContain('123')
  })

  it('asciiFallback should convert spaces to hyphens', () => {
    const result = asciiFallback('Test  Name  Here')
    expect(result).not.toContain(' ')
    expect(result).toBe('test-name-here')
  })

  it('asciiFallback empty input should return timestamp-based fallback', () => {
    const result = asciiFallback('   ')
    expect(result).toMatch(/^skill-\d+$/)
  })
})

describe('Translator health check (v1.7.1)', () => {
  let app: express.Express

  beforeAll(() => {
    app = express()
    app.use('/api/diag', diagRouter)
  })

  it('translate-health endpoint should return 200', async () => {
    const res = await request(app).get('/api/diag/translate-health')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toHaveProperty('llm_configured')
    expect(res.body.data).toHaveProperty('llm_url')
    expect(res.body.data).toHaveProperty('bot_id')
    expect(res.body.data).toHaveProperty('reachable')
    expect(res.body.data).toHaveProperty('latency_ms')
  })

  it('translate-health with no LLM_API_KEY should report llm_configured=false', async () => {
    const original = process.env.LLM_API_KEY
    delete process.env.LLM_API_KEY
    try {
      const result = await translatorHealthCheck()
      expect(result.reachable).toBe(false)
      expect(result.error).toContain('LLM_API_KEY')
    } finally {
      if (original) process.env.LLM_API_KEY = original
    }
  }, 10000)
})
