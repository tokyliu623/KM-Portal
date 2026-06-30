import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

let tmpFile: string
let recordCall: typeof import('../../src/server/services/statsStore').recordCall
let getRawCalls: typeof import('../../src/server/services/statsStore').getRawCalls
let getStats: typeof import('../../src/server/services/statsStore').getStats

describe('statsStore v1.9.0 (skillName dimension)', () => {
  beforeEach(async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'km-stats-'))
    tmpFile = path.join(tmpDir, 'api-logs.json')
    process.env.STATS_FILE = tmpFile
    vi.resetModules()
    const mod = await import('../../src/server/services/statsStore')
    recordCall = mod.recordCall
    getRawCalls = mod.getRawCalls
    getStats = mod.getStats
  })

  afterEach(async () => {
    delete process.env.STATS_FILE
    if (tmpFile) {
      await fs.rm(path.dirname(tmpFile), { recursive: true, force: true })
    }
  })

  it('recordCall persists skillName and skillId', async () => {
    await recordCall({
      apiKeyId: 'k-1',
      kbId: '999',
      endpoint: '/api/kb/tree',
      method: 'POST',
      statusCode: 200,
      latencyMs: 50,
      ip: '127.0.0.1',
      userAgent: 'test',
      skillId: 's-1',
      skillName: 'demo-skill',
    })
    const calls = await getRawCalls(undefined, 7)
    expect(calls.length).toBe(1)
    expect(calls[0].skillName).toBe('demo-skill')
    expect(calls[0].skillId).toBe('s-1')
  })

  it('getRawCalls filters by skillName', async () => {
    await recordCall({ apiKeyId: 'k1', kbId: '1', endpoint: '/a', method: 'POST', statusCode: 200, latencyMs: 1, ip: '', userAgent: '', skillName: 'A' })
    await recordCall({ apiKeyId: 'k1', kbId: '1', endpoint: '/a', method: 'POST', statusCode: 200, latencyMs: 1, ip: '', userAgent: '', skillName: 'B' })
    await recordCall({ apiKeyId: 'k1', kbId: '1', endpoint: '/a', method: 'POST', statusCode: 200, latencyMs: 1, ip: '', userAgent: '' })
    const calls = await getRawCalls(undefined, 7, 'A')
    expect(calls.length).toBe(1)
    expect(calls[0].skillName).toBe('A')
  })

  it('getRawCalls filters by kbId + skillName dual dimension', async () => {
    await recordCall({ apiKeyId: 'k1', kbId: '1', endpoint: '/a', method: 'POST', statusCode: 200, latencyMs: 1, ip: '', userAgent: '', skillName: 'A' })
    await recordCall({ apiKeyId: 'k1', kbId: '2', endpoint: '/a', method: 'POST', statusCode: 200, latencyMs: 1, ip: '', userAgent: '', skillName: 'A' })
    await recordCall({ apiKeyId: 'k1', kbId: '1', endpoint: '/a', method: 'POST', statusCode: 200, latencyMs: 1, ip: '', userAgent: '', skillName: 'B' })
    const calls = await getRawCalls('1', 7, 'A')
    expect(calls.length).toBe(1)
  })

  it('getRawCalls filters by days', async () => {
    await recordCall({ apiKeyId: 'k1', kbId: '1', endpoint: '/a', method: 'POST', statusCode: 200, latencyMs: 1, ip: '', userAgent: '' })
    const calls = await getRawCalls(undefined, 0)
    expect(calls.length).toBe(0)
  })

  it('getStats still works with skillName records (no regression)', async () => {
    await recordCall({ apiKeyId: 'k1', kbId: '1', endpoint: '/a', method: 'POST', statusCode: 200, latencyMs: 100, ip: '', userAgent: '', skillName: 'A' })
    const stats = await getStats('1', 7)
    expect(stats.total).toBe(1)
    expect(stats.avgLatency).toBe(100)
  })
})
