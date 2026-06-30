import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import express from 'express'
import request from 'supertest'

// v1.9.0: 路由使用了 translator + apiKeyStore，需要 mock
vi.mock('../../src/server/services/translator', () => ({
  translateToEnglish: vi.fn().mockImplementation((name: string) => Promise.resolve(name)),
  asciiFallback: vi.fn().mockImplementation((name: string) => name.replace(/[^a-zA-Z0-9_-]/g, 'x')),
}))

vi.mock('../../src/server/services/apiKeyStore', () => ({
  apiKeyStore: {
    createForSkill: vi.fn().mockImplementation((data: { name: string; key: string; skillId: string; skillName: string; kbId: number }) =>
      Promise.resolve({
        id: 'apikey-test-1',
        name: data.name,
        key: data.key,
        createdAt: new Date().toISOString(),
        skillId: data.skillId,
        skillName: data.skillName,
        kbId: data.kbId,
      })
    ),
  },
}))

const skillRouter = (await import('../../src/server/routes/skill')).default

describe('Skill route field compatibility (v1.7.3 regression)', () => {
  let app: express.Express

  beforeAll(() => {
    app = express()
    app.use(express.json())
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
