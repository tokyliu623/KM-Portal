import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

let tmpFile: string
let apiKeyStore: typeof import('../../src/server/services/apiKeyStore').apiKeyStore

describe('apiKeyStore', () => {
  beforeEach(async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'km-apikey-'))
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

  it('creates and persists an API key', async () => {
    const key = await apiKeyStore.create('test-key', 'secret-key-12345')
    expect(key.id).toBeDefined()
    expect(key.name).toBe('test-key')
    expect(key.key).toBe('secret-key-12345')
    const onDisk = await fs.readFile(tmpFile, 'utf-8')
    expect(onDisk).toContain('secret-key-12345')
  })

  it('rejects empty name', async () => {
    await expect(apiKeyStore.create('', 'secret-key-12345')).rejects.toThrow(/Invalid name/)
  })

  it('rejects short key', async () => {
    await expect(apiKeyStore.create('name', 'short')).rejects.toThrow(/at least 10 characters/)
  })

  it('lists all keys', async () => {
    await apiKeyStore.create('a', 'key-a-12345678')
    await apiKeyStore.create('b', 'key-b-12345678')
    const all = await apiKeyStore.findAll()
    expect(all.length).toBe(2)
  })

  it('finds by id', async () => {
    const created = await apiKeyStore.create('find-by-id', 'find-id-key-1234')
    const found = await apiKeyStore.findById(created.id)
    expect(found?.name).toBe('find-by-id')
  })

  it('finds by key value', async () => {
    await apiKeyStore.create('by-key', 'lookup-key-1234')
    const found = await apiKeyStore.findByKey('lookup-key-1234')
    expect(found?.name).toBe('by-key')
  })

  it('deletes a key', async () => {
    const created = await apiKeyStore.create('to-delete', 'del-key-123456')
    expect(await apiKeyStore.delete(created.id)).toBe(true)
    expect(await apiKeyStore.findById(created.id)).toBeUndefined()
  })

  it('returns false for non-existent id', async () => {
    expect(await apiKeyStore.delete('non-existent')).toBe(false)
  })

  it('updates lastUsed timestamp', async () => {
    const created = await apiKeyStore.create('last-used', 'used-key-1234567')
    expect(created.lastUsed).toBeUndefined()
    await apiKeyStore.updateLastUsed(created.id)
    const updated = await apiKeyStore.findById(created.id)
    expect(updated?.lastUsed).toBeDefined()
  })
})
