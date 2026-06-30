import { promises as fs } from 'fs'
import path from 'path'

const DEFAULT_DATA_DIR = path.join(process.cwd(), 'data')
const DEFAULT_LOGS_FILE = path.join(DEFAULT_DATA_DIR, 'api-logs.json')
const DEFAULT_STATS_FILE = path.join(DEFAULT_DATA_DIR, 'operation-stats.json')

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

export interface ApiLog {
  timestamp: string
  method: string
  path: string
  statusCode: number
  duration: number
  kbId?: string
}

export interface DailyCallStat {
  date: string
  calls: number
  errors: number
}

export interface ApiLogSummary {
  totalCalls: number
  totalErrors: number
  daily: DailyCallStat[]
}

export interface KpiEntry {
  date: string
  uv: number
  pv: number
  conversionRate?: number
  satisfaction?: number
  customMetrics?: Record<string, number>
}

export interface TrendChartSeries {
  name: string
  data: number[]
}

export interface TrendChartData {
  x: string[]
  series: TrendChartSeries[]
}

export interface HealthScoreBreakdown {
  pv: number
  uv: number
  conversion: number
  satisfaction: number
}

export interface HealthScore {
  total: number
  grade: string
  breakdown: HealthScoreBreakdown
}

interface KpiStoreShape {
  [kbId: string]: KpiEntry[]
}

function resolveLogsFile(): string {
  return process.env.KM_API_LOGS_FILE || DEFAULT_LOGS_FILE
}

function resolveStatsFile(): string {
  return process.env.KM_OPERATION_STATS_FILE || DEFAULT_STATS_FILE
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content) as T
  } catch {
    return fallback
  }
}

async function readLogs(): Promise<ApiLog[]> {
  return readJson<ApiLog[]>(resolveLogsFile(), [])
}

async function readKpiStore(): Promise<KpiStoreShape> {
  return readJson<KpiStoreShape>(resolveStatsFile(), {})
}

async function writeKpiStore(store: KpiStoreShape): Promise<void> {
  const filePath = resolveStatsFile()
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(store, null, 2), 'utf-8')
}

function startOfDay(d: Date): Date {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getGrade(total: number): string {
  if (total >= 85) return 'A'
  if (total >= 70) return 'B'
  if (total >= 55) return 'C'
  if (total >= 40) return 'D'
  return 'E'
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function cap100(value: number): number {
  return clamp(value, 0, 100)
}

export const operationStatsService = {
  async getApiLogStats(days: number = 7): Promise<ApiLogSummary> {
    const logs = await readLogs()
    const today = startOfDay(new Date())
    const cutoff = new Date(today)
    cutoff.setDate(cutoff.getDate() - (days - 1))

    const byDate = new Map<string, DailyCallStat>()
    let totalCalls = 0
    let totalErrors = 0

    for (const log of logs) {
      const t = new Date(log.timestamp)
      if (Number.isNaN(t.getTime())) continue
      if (t < cutoff) continue
      const date = isoDate(t)
      const stat = byDate.get(date) || { date, calls: 0, errors: 0 }
      stat.calls += 1
      if (log.statusCode >= 400) {
        stat.errors += 1
        totalErrors += 1
      }
      byDate.set(date, stat)
      totalCalls += 1
    }

    const daily = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date))
    return { totalCalls, totalErrors, daily }
  },

  async getManualKpis(kbId: string, _days: number = 7): Promise<KpiEntry[]> {
    const store = await readKpiStore()
    const entries = store[kbId] || []
    return [...entries].sort((a, b) => a.date.localeCompare(b.date))
  },

  async saveManualKpi(kbId: string, entry: KpiEntry): Promise<void> {
    if (!entry || !entry.date) {
      throw new Error('KPI entry must include date')
    }
    await withLock(`kpi:${kbId}`, async () => {
      const store = await readKpiStore()
      const list = store[kbId] || []
      const idx = list.findIndex(e => e.date === entry.date)
      if (idx >= 0) {
        list[idx] = entry
      } else {
        list.push(entry)
      }
      store[kbId] = list
      await writeKpiStore(store)
    })
  },

  generateTrendData(entries: KpiEntry[]): TrendChartData {
    if (!entries || entries.length === 0) {
      return { x: [], series: [] }
    }
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
    const x = sorted.map(e => e.date)
    const uv = sorted.map(e => e.uv)
    const pv = sorted.map(e => e.pv)
    const conversionPct = sorted.map(e => Math.round((e.conversionRate ?? 0) * 100))
    const hasConversion = sorted.some(e => typeof e.conversionRate === 'number')
    const hasSatisfaction = sorted.some(e => typeof e.satisfaction === 'number')
    const satisfaction = sorted.map(e => Math.round((e.satisfaction ?? 0) * 20))

    const series: TrendChartSeries[] = [
      { name: 'UV', data: uv },
      { name: 'PV', data: pv },
    ]
    if (hasConversion) series.push({ name: '转化率', data: conversionPct })
    if (hasSatisfaction) series.push({ name: '满意度', data: satisfaction })
    return { x, series }
  },

  calculateHealthScore(entries: KpiEntry[]): HealthScore {
    const empty: HealthScore = { total: 0, grade: 'N/A', breakdown: { pv: 0, uv: 0, conversion: 0, satisfaction: 0 } }
    if (!entries || entries.length === 0) return empty

    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
    const latest = sorted[sorted.length - 1]
    const prev = sorted.length >= 2 ? sorted[sorted.length - 2] : undefined

    const pvScore = cap100(Math.log10(Math.max(latest.pv, 1) + 1) * 25)
    const uvScore = cap100(Math.log10(Math.max(latest.uv, 1) + 1) * 33)
    const convRate = latest.conversionRate ?? 0
    const conversionScore = cap100(convRate * 100)
    const sat = latest.satisfaction ?? 0
    const satisfactionScore = cap100(sat * 20)

    let trendBoost = 0
    if (prev) {
      const pvDelta = latest.pv - prev.pv
      const uvDelta = latest.uv - prev.uv
      if (pvDelta > 0) trendBoost += 2
      if (uvDelta > 0) trendBoost += 2
    }

    const weighted = pvScore * 0.3 + uvScore * 0.2 + conversionScore * 0.3 + satisfactionScore * 0.2
    const total = Math.round(cap100(weighted + trendBoost))
    return {
      total,
      grade: getGrade(total),
      breakdown: {
        pv: Math.round(pvScore),
        uv: Math.round(uvScore),
        conversion: Math.round(conversionScore),
        satisfaction: Math.round(satisfactionScore),
      },
    }
  },
}
