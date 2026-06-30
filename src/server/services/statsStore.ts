import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const DEFAULT_DATA_DIR = path.join(process.cwd(), 'data')
const DEFAULT_STATS_FILE = path.join(DEFAULT_DATA_DIR, 'api-logs.json')

const locks: Set<string> = new Set()

async function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  while (locks.has(key)) {
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
  locks.add(key)
  try {
    return await fn()
  } finally {
    locks.delete(key)
  }
}

interface ApiCallRecord {
  id: string
  apiKeyId: string
  kbId: string
  endpoint: string
  method: string
  statusCode: number
  latencyMs: number
  ip: string
  userAgent: string
  createdAt: string
  /** v1.9.0: Skill 关联（按 Skill 维度统计） */
  skillId?: string
  skillName?: string
}

interface StatsStore {
  calls: ApiCallRecord[]
}

function resolveFilePath(): string {
  if (process.env.STATS_FILE) return process.env.STATS_FILE
  if (process.env.KM_API_LOGS_FILE) return process.env.KM_API_LOGS_FILE
  return DEFAULT_STATS_FILE
}

async function readStore(): Promise<StatsStore> {
  const filePath = resolveFilePath()
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return { calls: [] }
  }
}

async function writeStore(store: StatsStore): Promise<void> {
  const filePath = resolveFilePath()
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(store, null, 2), 'utf-8')
}

export async function recordCall(data: Omit<ApiCallRecord, 'id' | 'createdAt'>): Promise<void> {
  return withLock('stats', async () => {
    const store = await readStore()
    store.calls.push({
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    })
    // Retention policy: keep most recent 5000 records after exceeding 10000 limit.
    // For long-term archival, consider rotating logs to a daily file.
    if (store.calls.length > 10000) {
      store.calls = store.calls.slice(-5000)
    }
    await writeStore(store)
  })
}

export async function getStats(kbId?: string, days: number = 7): Promise<{
  total: number
  byDay: Record<string, number>
  byEndpoint: Record<string, number>
  avgLatency: number
}> {
  const store = await readStore()
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  const calls = store.calls.filter((c) => new Date(c.createdAt).getTime() > cutoff && (!kbId || c.kbId === kbId))

  const byDay: Record<string, number> = {}
  const byEndpoint: Record<string, number> = {}
  let totalLatency = 0

  for (const call of calls) {
    const day = call.createdAt.substring(0, 10)
    byDay[day] = (byDay[day] || 0) + 1
    byEndpoint[call.endpoint] = (byEndpoint[call.endpoint] || 0) + 1
    totalLatency += call.latencyMs
  }

  return {
    total: calls.length,
    byDay,
    byEndpoint,
    avgLatency: calls.length > 0 ? Math.round(totalLatency / calls.length) : 0,
  }
}

/** v1.9.0: 原始调用记录查询（支持 skillName/kbId 多维过滤） */
export async function getRawCalls(
  kbId?: string,
  days: number = 7,
  skillName?: string,
  skillId?: string,
): Promise<ApiCallRecord[]> {
  const store = await readStore()
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return store.calls.filter((c) =>
    new Date(c.createdAt).getTime() > cutoff
    && (!kbId || c.kbId === kbId)
    && (!skillName || c.skillName === skillName)
    && (!skillId || c.skillId === skillId)
  )
}