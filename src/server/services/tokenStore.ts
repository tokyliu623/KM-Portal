import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const DATA_DIR = path.join(process.cwd(), 'data')
const TOKENS_FILE = path.join(DATA_DIR, 'tokens.json')

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

export interface KMToken {
  id: string
  kb_id: number
  kb_name: string
  token: string
  owner: string
  permission: 'read' | 'write'
  status: 'active' | 'revoked'
  expiresAt: string
  createdAt: string
  updatedAt: string
}

interface TokenStore {
  tokens: KMToken[]
}

async function readStore(): Promise<TokenStore> {
  try {
    const content = await fs.readFile(TOKENS_FILE, 'utf-8')
    return JSON.parse(content)
  } catch {
    return { tokens: [] }
  }
}

async function writeStore(store: TokenStore): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(TOKENS_FILE, JSON.stringify(store, null, 2), 'utf-8')
}

export const tokenStore = {
  async create(data: Omit<KMToken, 'id' | 'createdAt' | 'updatedAt'>): Promise<KMToken> {
    if (!data.token || typeof data.token !== 'string' || data.token.length < 10) {
      throw new Error('Invalid token: must be a non-empty string of at least 10 characters')
    }
    if (!data.owner || typeof data.owner !== 'string' || data.owner.trim().length === 0) {
      throw new Error('Invalid owner: must be a non-empty string')
    }
    if (data.permission !== 'read' && data.permission !== 'write') {
      throw new Error('Invalid permission: must be "read" or "write"')
    }
    return withLock('token', async () => {
      const store = await readStore()
      const kbIdNum = Number(data.kb_id)
      if (isNaN(kbIdNum) || kbIdNum <= 0) {
        throw new Error('Invalid kb_id: must be a positive number')
      }
      const token: KMToken = {
        ...data,
        id: uuidv4(),
        kb_id: kbIdNum,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      store.tokens.push(token)
      await writeStore(store)
      return token
    })
  },

  async findAll(): Promise<KMToken[]> {
    const store = await readStore()
    return store.tokens
  },

  async findByKbId(kbId: number | string): Promise<KMToken | undefined> {
    const store = await readStore()
    const kbIdNum = Number(kbId)
    return store.tokens.find((t) => t.kb_id === kbIdNum && t.status === 'active')
  },

  async findById(id: string): Promise<KMToken | undefined> {
    const store = await readStore()
    return store.tokens.find((t) => t.id === id)
  },

  async update(id: string, data: Partial<KMToken>): Promise<KMToken | undefined> {
    return withLock('token', async () => {
      const store = await readStore()
      const index = store.tokens.findIndex((t) => t.id === id)
      if (index === -1) return undefined
      store.tokens[index] = {
        ...store.tokens[index],
        ...data,
        updatedAt: new Date().toISOString(),
      }
      await writeStore(store)
      return store.tokens[index]
    })
  },

  async revoke(id: string): Promise<boolean> {
    return withLock('token', async () => {
      const store = await readStore()
      const token = store.tokens.find((t) => t.id === id)
      if (!token) return false
      token.status = 'revoked'
      token.updatedAt = new Date().toISOString()
      await writeStore(store)
      return true
    })
  },

  async delete(id: string): Promise<boolean> {
    return withLock('token', async () => {
      const store = await readStore()
      const index = store.tokens.findIndex((t) => t.id === id)
      if (index === -1) return false
      store.tokens.splice(index, 1)
      await writeStore(store)
      return true
    })
  },
}