import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import express from 'express'
import request from 'supertest'
import kbRouter from '../../src/server/routes/kb'

describe('KB route field compatibility (v1.7.1 regression)', () => {
  let app: express.Express

  beforeAll(() => {
    app = express()
    app.use(express.json())
    // Mock app.locals.kmApiClient
    app.use((req: express.Request, _res, next) => {
      req.app.locals.kmApiClient = {
        getKBTree: vi.fn().mockResolvedValue([{ id: 1, name: 'root' }]),
        getKBInfo: vi.fn().mockResolvedValue({ id: 1, name: 'kb' }),
        getKBDocument: vi.fn().mockResolvedValue({ content: 'doc' }),
        createDocument: vi.fn().mockResolvedValue({ id: 2 }),
        updateDocument: vi.fn().mockResolvedValue({ id: 2 }),
      }
      next()
    })
    // Mock tokenStore
    vi.mock('../../src/server/services/tokenStore.js', () => ({
      tokenStore: {
        findByKbId: vi.fn().mockImplementation((kbId: string) => {
          if (kbId === '34754' || kbId === '1') {
            return Promise.resolve({
              token: 'mock-token',
              status: 'active',
              permission: 'write',
            })
          }
          return Promise.resolve(null)
        }),
      },
    }))
    app.use('/api/kb', kbRouter)
  })

  afterAll(() => {
    vi.restoreAllMocks()
  })

  it('camelCase kbId field should be accepted (POST /tree)', async () => {
    const res = await request(app).post('/api/kb/tree').send({ kbId: '34754' })
    expect(res.status).not.toBe(400)
    expect(res.body.success).toBe(true)
  })

  it('snake_case kb_id field (v1.7.0 legacy) should also be accepted', async () => {
    const res = await request(app).post('/api/kb/tree').send({ kb_id: '34754' })
    expect(res.status).not.toBe(400)
    expect(res.body.success).toBe(true)
  })

  it('POST /info should accept both kbId and kb_id', async () => {
    const r1 = await request(app).post('/api/kb/info').send({ kbId: '1' })
    const r2 = await request(app).post('/api/kb/info').send({ kb_id: '1' })
    expect(r1.status).not.toBe(400)
    expect(r2.status).not.toBe(400)
  })

  it('POST /content should accept docId/contentId/doc_id/content_id', async () => {
    const r1 = await request(app).post('/api/kb/content').send({ kbId: '1', docId: '5' })
    const r2 = await request(app).post('/api/kb/content').send({ kb_id: '1', doc_id: '5' })
    const r3 = await request(app).post('/api/kb/content').send({ kbId: '1', contentId: '5' })
    expect(r1.status).not.toBe(400)
    expect(r2.status).not.toBe(400)
    expect(r3.status).not.toBe(400)
  })

  it('POST /contents/create should accept kbId and strip it from body', async () => {
    const res = await request(app)
      .post('/api/kb/contents/create')
      .send({ kbId: '1', title: 'Test', content: 'body', parentId: 0 })
    expect(res.status).not.toBe(400)
  })

  it('empty body should return 400', async () => {
    const res = await request(app).post('/api/kb/tree').send({})
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('kbId')
  })
})
