import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

let tmpFile: string
let statsService: typeof import('../../src/server/services/statsService').statsService
let recordCall: typeof import('../../src/server/services/statsStore').recordCall

async function seedCalls(records: Array<{
  skillName?: string
  kbId: string
  statusCode?: number
  latencyMs?: number
}>) {
  for (const r of records) {
    await recordCall({
      apiKeyId: 'k-1',
      kbId: r.kbId,
      endpoint: '/api/kb/tree',
      method: 'POST',
      statusCode: r.statusCode ?? 200,
      latencyMs: r.latencyMs ?? 50,
      ip: '127.0.0.1',
      userAgent: 'test',
      skillName: r.skillName,
    })
  }
}

describe('statsService v1.9.0 (getStatsBySkill)', () => {
  beforeEach(async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'km-stats-svc-'))
    tmpFile = path.join(tmpDir, 'api-logs.json')
    process.env.STATS_FILE = tmpFile
    vi.resetModules()
    const svcMod = await import('../../src/server/services/statsService')
    const storeMod = await import('../../src/server/services/statsStore')
    statsService = svcMod.statsService
    recordCall = storeMod.recordCall
  })

  afterEach(async () => {
    delete process.env.STATS_FILE
    if (tmpFile) {
      await fs.rm(path.dirname(tmpFile), { recursive: true, force: true })
    }
  })

  it('aggregates by skillName', async () => {
    await seedCalls([
      { skillName: 'A', kbId: '1' },
      { skillName: 'A', kbId: '1' },
      { skillName: 'B', kbId: '1' },
    ])
    const result = await statsService.getStatsBySkill({ days: 7 })
    expect(result.skills.length).toBe(2)
    const a = result.skills.find((s) => s.skillName === 'A')
    expect(a?.calls).toBe(2)
  })

  it('filters by kbId', async () => {
    await seedCalls([
      { skillName: 'A', kbId: '1' },
      { skillName: 'A', kbId: '2' },
    ])
    const result = await statsService.getStatsBySkill({ kbId: '1', days: 7 })
    const a = result.skills.find((s) => s.skillName === 'A')
    expect(a?.calls).toBe(1)
  })

  it('computes errorRate correctly', async () => {
    await seedCalls([
      { skillName: 'A', kbId: '1', statusCode: 200 },
      { skillName: 'A', kbId: '1', statusCode: 500 },
    ])
    const result = await statsService.getStatsBySkill({ skillName: 'A', days: 7 })
    const a = result.skills[0]
    expect(a.errorRate).toBe(50)
  })

  it('computes avgLatency correctly', async () => {
    await seedCalls([
      { skillName: 'A', kbId: '1', latencyMs: 100 },
      { skillName: 'A', kbId: '1', latencyMs: 200 },
    ])
    const result = await statsService.getStatsBySkill({ skillName: 'A', days: 7 })
    expect(result.skills[0].avgLatency).toBe(150)
  })

  it('returns empty skills array for no data', async () => {
    const result = await statsService.getStatsBySkill({ days: 7 })
    expect(result.skills.length).toBe(0)
    expect(result.total).toBe(0)
  })

  it('sorts skills by calls desc', async () => {
    await seedCalls([
      { skillName: 'A', kbId: '1' },
      { skillName: 'B', kbId: '1' },
      { skillName: 'B', kbId: '1' },
      { skillName: 'B', kbId: '1' },
    ])
    const result = await statsService.getStatsBySkill({ days: 7 })
    expect(result.skills[0].skillName).toBe('B')
    expect(result.skills[1].skillName).toBe('A')
  })
})
