import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const DATA_DIR = path.join(process.cwd(), 'data')
const STATS_FILE = path.join(DATA_DIR, 'api-logs.json')

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
}

interface StatsStore {
  calls: ApiCallRecord[]
}

async function readStore(): Promise<StatsStore> {
  try {
    const content = await fs.readFile(STATS_FILE, 'utf-8')
    return JSON.parse(content)
  } catch {
    return { calls: [] }
  }
}

async function writeStore(store: StatsStore): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(STATS_FILE, JSON.stringify(store, null, 2), 'utf-8')
}

export async function recordCall(data: Omit<ApiCallRecord, 'id' | 'createdAt'>): Promise<void> {
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