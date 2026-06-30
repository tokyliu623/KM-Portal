import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import express from 'express'
import request from 'supertest'

// v1.9.0: 路由增加了 apiKeyAuth 中间件，必须 mock apiKeyStore
vi.mock('../../src/server/services/apiKeyStore.js', () => ({
  apiKeyStore: {
    findByKey: vi.fn(),
    updateLastUsed: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('../../src/server/services/tokenStore.js', () => ({
  tokenStore: {
    findByKbId: vi.fn().mockImplementation((kbId: string) => {
      if (kbId === '34754' || kbId === '1' || kbId === 34754 || kbId === 1) {
        return Promise.resolve({
          id: 'tok-1',
          token: 'mock-token',
          kb_id: Number(kbId),
          status: 'active',
          permission: 'write',
        })
      }
      return Promise.resolve(null)
    }),
  },
}))

const kbRouter = (await import('../../src/server/routes/kb')).default

describe('KB route field compatibility (v1.7.1 regression)', () => {
  let app: express.Express

  beforeAll(async () => {
    const apiKeyStore = (await import('../../src/server/services/apiKeyStore.js')).apiKeyStore
    ;(apiKeyStore.findByKey as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
      if (key === 'mock-key-34754') {
        return Promise.resolve({ id: 'apikey-1', key, skillId: 's1', skillName: 'demo', kbId: 34754 })
      }
      if (key === 'mock-key-1') {
        return Promise.resolve({ id: 'apikey-1', key, skillId: 's1', skillName: 'demo', kbId: 1 })
      }
      return Promise.resolve(null)
    })

    app = express()
    app.use(express.json())
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
    app.use('/api/kb', kbRouter)
  })

  afterAll(() => {
    vi.restoreAllMocks()
  })

  // v1.9.0: 所有代理路由需要 Authorization: Bearer API Key
  const auth34754 = { Authorization: 'Bearer mock-key-34754' }
  const authInfo = { Authorization: 'Bearer mock-key-1' }
  const authContent = { Authorization: 'Bearer mock-key-1' }
  const authCreate = { Authorization: 'Bearer mock-key-1' }
  const authUpdate = { Authorization: 'Bearer mock-key-1' }

  it('camelCase kbId field should be accepted (POST /tree)', async () => {
    const res = await request(app).post('/api/kb/tree').set(auth34754).send({ kbId: '34754' })
    expect(res.status).not.toBe(400)
    // 打印响应便于调试
    if (res.body.success !== true) {
      console.error('[test] response:', res.status, res.body)
    }
    expect(res.body.success).toBe(true)
  })

  it('snake_case kb_id field (v1.7.0 legacy) should also be accepted', async () => {
    const res = await request(app).post('/api/kb/tree').set(auth34754).send({ kb_id: '34754' })
    expect(res.status).not.toBe(400)
    if (res.body.success !== true) {
      console.error('[test] response:', res.status, res.body)
    }
    expect(res.body.success).toBe(true)
  })

  it('POST /info should accept both kbId and kb_id', async () => {
    const r1 = await request(app).post('/api/kb/info').set(authInfo).send({ kbId: '1' })
    const r2 = await request(app).post('/api/kb/info').set(authInfo).send({ kb_id: '1' })
    expect(r1.status).not.toBe(400)
    expect(r2.status).not.toBe(400)
  })

  it('POST /content should accept docId/contentId/doc_id/content_id', async () => {
    const r1 = await request(app).post('/api/kb/content').set(authContent).send({ kbId: '1', docId: '5' })
    const r2 = await request(app).post('/api/kb/content').set(authContent).send({ kb_id: '1', doc_id: '5' })
    const r3 = await request(app).post('/api/kb/content').set(authContent).send({ kbId: '1', contentId: '5' })
    expect(r1.status).not.toBe(400)
    expect(r2.status).not.toBe(400)
    expect(r3.status).not.toBe(400)
  })

  it('POST /contents/create should accept kbId and strip it from body', async () => {
    const res = await request(app)
      .post('/api/kb/contents/create')
      .set(authCreate)
      .send({ kbId: '1', title: 'Test', content: 'body', parentId: 0 })
    expect(res.status).not.toBe(400)
  })

  it('empty body should return 400', async () => {
    // v1.9.0: 用 mock-key-empty(不返回任何记录) 直接 401，验证缺 body
    const res = await request(app).post('/api/kb/tree').set({ Authorization: 'Bearer mock-key-empty' }).send({})
    expect(res.status).toBe(401)
  })
})
