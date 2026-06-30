import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

let tmpFile: string
let recordCall: typeof import('../../src/server/services/statsStore').recordCall
let getStats: typeof import('../../src/server/services/statsStore').getStats

beforeAll(async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'stats-concurrency-'))
  tmpFile = path.join(tmpDir, 'api-logs.json')
  process.env.STATS_FILE = tmpFile
  const mod = await import('../../src/server/services/statsStore')
  recordCall = mod.recordCall
  getStats = mod.getStats
})

afterAll(async () => {
  delete process.env.STATS_FILE
  if (tmpFile) {
    await fs.rm(path.dirname(tmpFile), { recursive: true, force: true })
  }
})

describe('statsStore 并发安全 (v1.9.0 Bug A fix)', () => {
  it('50 个并发 recordCall 写后 JSON 仍可解析,total=50', async () => {
    const promises = Array.from({ length: 50 }, (_, i) =>
      recordCall({
        apiKeyId: `k-${i}`,
        kbId: '1',
        endpoint: '/api/test',
        method: 'POST',
        statusCode: 200,
        latencyMs: 10,
        ip: '127.0.0.1',
        userAgent: 'vitest',
        skillName: `skill-${i % 3}`,
      })
    )
    await Promise.all(promises)

    const content = await fs.readFile(tmpFile, 'utf-8')
    expect(() => JSON.parse(content)).not.toThrow()
    const stats = await getStats()
    expect(stats.total).toBe(50)
  })

  it('100 个并发 recordCall 写后 JSON 仍可解析,total=100', async () => {
    const promises = Array.from({ length: 100 }, (_, i) =>
      recordCall({
        apiKeyId: `k-${i}`,
        kbId: '2',
        endpoint: '/api/test2',
        method: 'POST',
        statusCode: 200,
        latencyMs: 20,
        ip: '127.0.0.1',
        userAgent: 'vitest',
        skillName: 'concurrent',
      })
    )
    await Promise.all(promises)

    const content = await fs.readFile(tmpFile, 'utf-8')
    expect(() => JSON.parse(content)).not.toThrow()
    const stats = await getStats()
    expect(stats.total).toBe(150)
  })
})
