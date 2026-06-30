import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import type { ApiKey } from '../types'

const DEFAULT_DATA_DIR = path.join(process.cwd(), 'data')
const DEFAULT_API_KEYS_FILE = path.join(DEFAULT_DATA_DIR, 'api-keys.json')

const locks: Set<string> = new Set()

async function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  while (locks.has(key)) {
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  locks.add(key)
  try {
    return await fn()
  } finally {
    locks.delete(key)
  }
}

interface ApiKeysStore {
  keys: ApiKey[]
}

function resolveFilePath(): string {
  if (process.env.KM_API_KEYS_FILE) {
    return process.env.KM_API_KEYS_FILE
  }
  return DEFAULT_API_KEYS_FILE
}

async function readStore(filePath: string): Promise<ApiKeysStore> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return { keys: [] }
  }
}

async function writeStore(filePath: string, store: ApiKeysStore): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(store, null, 2), 'utf-8')
}

export const apiKeyStore = {
  async create(name: string, key: string, options?: { kbId?: string; skillId?: string; skillName?: string }): Promise<ApiKey> {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Invalid name: name is required and must be a non-empty string')
    }
    if (!key || typeof key !== 'string' || key.length < 10) {
      throw new Error('Invalid API key: key must be at least 10 characters')
    }
    return withLock('apikey', async () => {
      const filePath = resolveFilePath()
      const store = await readStore(filePath)
      const apiKey: ApiKey = {
        id: uuidv4(),
        name: name.trim(),
        key,
        kbId: options?.kbId,
        skillId: options?.skillId,
        skillName: options?.skillName,
        createdAt: new Date().toISOString(),
      }
      store.keys.push(apiKey)
      await writeStore(filePath, store)
      return apiKey
    })
  },

  async createForSkill(params: {
    name: string
    key: string
    skillId: string
    skillName: string
    kbId: string | number
  }): Promise<ApiKey> {
    if (!params.skillId || typeof params.skillId !== 'string' || params.skillId.trim().length === 0) {
      throw new Error('Invalid skillId: skillId is required')
    }
    if (!params.key || typeof params.key !== 'string' || params.key.length < 10) {
      throw new Error('Invalid API key: key must be at least 10 characters')
    }
    return withLock('apikey', async () => {
      const filePath = resolveFilePath()
      const store = await readStore(filePath)
      const apiKey: ApiKey = {
        id: uuidv4(),
        name: params.name.trim(),
        key: params.key,
        kbId: params.kbId,
        skillId: params.skillId,
        skillName: params.skillName,
        createdAt: new Date().toISOString(),
      }
      store.keys.push(apiKey)
      await writeStore(filePath, store)
      return apiKey
    })
  },

  async findAll(): Promise<ApiKey[]> {
    const filePath = resolveFilePath()
    const store = await readStore(filePath)
    return store.keys
  },

  async findById(id: string): Promise<ApiKey | undefined> {
    const filePath = resolveFilePath()
    const store = await readStore(filePath)
    return store.keys.find((k) => k.id === id)
  },

  async findByKey(key: string): Promise<ApiKey | undefined> {
    const filePath = resolveFilePath()
    const store = await readStore(filePath)
    return store.keys.find((k) => k.key === key)
  },

  async delete(id: string): Promise<boolean> {
    return withLock('apikey', async () => {
      const filePath = resolveFilePath()
      const store = await readStore(filePath)
      const index = store.keys.findIndex((k) => k.id === id)
      if (index === -1) return false
      store.keys.splice(index, 1)
      await writeStore(filePath, store)
      return true
    })
  },

  async updateLastUsed(id: string): Promise<void> {
    return withLock('apikey', async () => {
      const filePath = resolveFilePath()
      const store = await readStore(filePath)
      const key = store.keys.find((k) => k.id === id)
      if (key) {
        key.lastUsed = new Date().toISOString()
        await writeStore(filePath, store)
      }
    })
  },
}
