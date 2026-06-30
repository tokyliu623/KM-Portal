import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import express from 'express'
import request from 'supertest'
import skillRouter from '../../src/server/routes/skill'

describe('Skill route field compatibility (v1.7.3 regression)', () => {
  let app: express.Express

  beforeAll(() => {
    app = express()
    app.use(express.json())

    // Mock translator to avoid network calls
    vi.mock('../../src/server/services/translator', () => ({
      translateToEnglish: vi.fn().mockImplementation((name: string) => Promise.resolve(name)),
      asciiFallback: vi.fn().mockImplementation((name: string) =>
        // eslint-disable-next-line no-control-regex
        name.replace(/[^\x00-\x7F]/g, 'x')
      ),
    }))

    // Mount router like in production
    app.use('/api/skill', skillRouter)
  })

  afterAll(() => {
    vi.restoreAllMocks()
  })

  it('camelCase kbId/kbName should be accepted (POST /api/skill)', async () => {
    const res = await request(app)
      .post('/api/skill')
      .send({
        name: '测试 Skill v1.7.3',
        description: 'field compat test',
        kbId: 34754,
        kbName: 'Test KB',
        permission: 'read',
      })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.kbId).toBe(34754)
    expect(res.body.data.kbName).toBe('Test KB')
  })

  it('snake_case kb_id/kb_name (v1.7.0 legacy) should also be accepted (v1.7.3 fix)', async () => {
    const res = await request(app)
      .post('/api/skill')
      .send({
        name: '测试 Skill v1.7.3 snake',
        description: 'field compat test snake',
        kb_id: 34754,
        kb_name: 'Test KB Snake',
        permission: 'read',
      })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.kbId).toBe(34754)
    expect(res.body.data.kbName).toBe('Test KB Snake')
  })

  it('missing both kbId and kb_id should return 400', async () => {
    const res = await request(app)
      .post('/api/skill')
      .send({ name: 'no kb' })
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('kbId')
  })

  it('missing both kbName and kb_name should return 400', async () => {
    const res = await request(app)
      .post('/api/skill')
      .send({ name: 'no kb name', kbId: 34754 })
    expect(res.status).toBe(400)
  })

  it('camelCase takes priority when both are provided', async () => {
    const res = await request(app)
      .post('/api/skill')
      .send({
        name: 'priority test',
        kbId: 34754,
        kb_id: 99999,
        kbName: 'Camel Wins',
        kb_name: 'Snake Loses',
        permission: 'read',
      })
    expect(res.status).toBe(200)
    expect(res.body.data.kbId).toBe(34754)
    expect(res.body.data.kbName).toBe('Camel Wins')
  })
})
