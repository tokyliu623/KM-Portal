import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

let tmpFile: string
let apiKeyStore: typeof import('../../src/server/services/apiKeyStore').apiKeyStore

describe('apiKeyStore v1.9.0 (createForSkill)', () => {
  beforeEach(async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'km-apikey-v190-'))
    tmpFile = path.join(tmpDir, 'api-keys.json')
    process.env.KM_API_KEYS_FILE = tmpFile
    vi.resetModules()
    const mod = await import('../../src/server/services/apiKeyStore')
    apiKeyStore = mod.apiKeyStore
  })

  afterEach(async () => {
    delete process.env.KM_API_KEYS_FILE
    if (tmpFile) {
      await fs.rm(path.dirname(tmpFile), { recursive: true, force: true })
    }
  })

  it('createForSkill persists skillId/skillName/kbId', async () => {
    const key = await apiKeyStore.createForSkill({
      name: 'demo-skill (KB 999)',
      key: 'kmp-skill-abcdef1234567890',
      skillId: 's-001',
      skillName: 'demo-skill',
      kbId: 999,
    })
    expect(key.skillId).toBe('s-001')
    expect(key.skillName).toBe('demo-skill')
    expect(key.kbId).toBe(999)

    const onDisk = JSON.parse(await fs.readFile(tmpFile, 'utf-8'))
    expect(onDisk.keys[0].skillId).toBe('s-001')
    expect(onDisk.keys[0].skillName).toBe('demo-skill')
    expect(onDisk.keys[0].kbId).toBe(999)
  })

  it('createForSkill rejects missing skillId', async () => {
    await expect(
      apiKeyStore.createForSkill({
        name: 'x',
        key: 'kmp-skill-abcdef1234567890',
        skillId: '',
        skillName: 'x',
        kbId: 1,
      })
    ).rejects.toThrow(/skillId/)
  })

  it('createForSkill rejects short key', async () => {
    await expect(
      apiKeyStore.createForSkill({
        name: 'x',
        key: 'short',
        skillId: 's-1',
        skillName: 'x',
        kbId: 1,
      })
    ).rejects.toThrow(/at least 10 characters/)
  })

  it('findByKey returns full record including skill association', async () => {
    await apiKeyStore.createForSkill({
      name: 'demo',
      key: 'kmp-skill-xyzxyz1234567890',
      skillId: 's-002',
      skillName: 'demo2',
      kbId: 12345,
    })
    const found = await apiKeyStore.findByKey('kmp-skill-xyzxyz1234567890')
    expect(found?.skillId).toBe('s-002')
    expect(found?.skillName).toBe('demo2')
    expect(found?.kbId).toBe(12345)
  })

  it('old create() still works (backward compatibility)', async () => {
    const key = await apiKeyStore.create('legacy', 'legacy-key-1234567890')
    expect(key.skillId).toBeUndefined()
    expect(key.kbId).toBeUndefined()
  })
})
