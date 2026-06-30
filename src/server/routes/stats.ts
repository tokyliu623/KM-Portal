import { Router } from 'express'
import { promises as fs } from 'fs'
import path from 'path'
import { operationStatsService } from '../services/operationStatsService.js'
import type { KpiEntry } from '../services/operationStatsService.js'
import { apiKeyStore } from '../services/apiKeyStore.js'

const router = Router()
const DATA_DIR = path.join(process.cwd(), 'data')
const LOGS_FILE = path.join(DATA_DIR, 'api-logs.json')

interface ApiLog {
  id?: string
  timestamp: string
  method: string
  path: string
  statusCode: number
  duration: number
  latencyMs?: number
  kbId?: string
  apiKeyId?: string
  skillId?: string
  skillName?: string
}

interface StatsData {
  totalCalls: number
  callsByEndpoint: Record<string, number>
  callsByStatus: Record<string, number>
  recentCalls: ApiLog[]
  dateRange: { start: string; end: string }
}

interface LogsStore {
  calls: ApiLog[]
}

async function readLogsStore(): Promise<LogsStore> {
  try {
    const content = await fs.readFile(LOGS_FILE, 'utf-8')
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed)) return { calls: parsed as ApiLog[] }
    if (parsed && Array.isArray(parsed.calls)) return parsed as LogsStore
    return { calls: [] }
  } catch {
    return { calls: [] }
  }
}

async function readLogs(): Promise<ApiLog[]> {
  const store = await readLogsStore()
  return store.calls
}

router.get('/overview', async (_req, res) => {
  try {
    const logs = await readLogs()
    const stats: StatsData = {
      totalCalls: logs.length,
      callsByEndpoint: {},
      callsByStatus: {},
      recentCalls: logs.slice(-100),
      dateRange: logs.length > 0
        ? { start: logs[0].timestamp, end: logs[logs.length - 1].timestamp }
        : { start: new Date().toISOString(), end: new Date().toISOString() },
    }

    logs.forEach((log) => {
      stats.callsByEndpoint[log.path] = (stats.callsByEndpoint[log.path] || 0) + 1
      stats.callsByStatus[log.statusCode.toString()] = (stats.callsByStatus[log.statusCode.toString()] || 0) + 1
    })

    res.json({ success: true, data: stats })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch stats' })
  }
})

router.get('/daily', async (req, res) => {
  try {
    const daysNum = parseInt(req.query.days as string)
    if (isNaN(daysNum) || daysNum <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid days parameter' })
    }
    const days = daysNum
    const logs = await readLogs()
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    const filteredLogs = logs.filter((log) => new Date(log.timestamp) >= cutoff)

    const dailyStats: Record<string, { date: string; calls: number; errors: number }> = {}
    filteredLogs.forEach((log) => {
      const date = log.timestamp.split('T')[0]
      if (!dailyStats[date]) {
        dailyStats[date] = { date, calls: 0, errors: 0 }
      }
      dailyStats[date].calls++
      if (log.statusCode >= 400) {
        dailyStats[date].errors++
      }
    })

    res.json({
      success: true,
      data: Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date)),
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch daily stats' })
  }
})

router.get('/endpoints', async (_req, res) => {
  try {
    const logs = await readLogs()
    const endpointStats: Record<string, { path: string; calls: number; avgDuration: number; errorRate: number }> = {}

    logs.forEach((log) => {
      if (!endpointStats[log.path]) {
        endpointStats[log.path] = { path: log.path, calls: 0, avgDuration: 0, errorRate: 0 }
      }
      endpointStats[log.path].calls++
      endpointStats[log.path].avgDuration += log.duration
      if (log.statusCode >= 400) {
        endpointStats[log.path].errorRate++
      }
    })

    Object.values(endpointStats).forEach((stat) => {
      stat.avgDuration = Math.round(stat.avgDuration / stat.calls)
      stat.errorRate = Math.round((stat.errorRate / stat.calls) * 100)
    })

    res.json({
      success: true,
      data: Object.values(endpointStats).sort((a, b) => b.calls - a.calls),
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch endpoint stats' })
  }
})

router.get('/operation/:kbId', async (req, res) => {
  try {
    const { kbId } = req.params
    const days = parseInt(req.query.days as string) || 7
    const [apiSummary, kpis] = await Promise.all([
      operationStatsService.getApiLogStats(days),
      operationStatsService.getManualKpis(kbId, days),
    ])
    const trend = operationStatsService.generateTrendData(kpis)
    res.json({
      success: true,
      data: {
        kbId,
        days,
        apiLog: apiSummary,
        kpis,
        trend,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch operation stats' })
  }
})

router.post('/operation/:kbId', async (req, res) => {
  try {
    const { kbId } = req.params
    const body = req.body as Partial<KpiEntry>
    if (!body || !body.date) {
      return res.status(400).json({ success: false, error: 'date is required' })
    }
    const entry: KpiEntry = {
      date: body.date,
      uv: Number(body.uv) || 0,
      pv: Number(body.pv) || 0,
      conversionRate: body.conversionRate !== undefined ? Number(body.conversionRate) : undefined,
      satisfaction: body.satisfaction !== undefined ? Number(body.satisfaction) : undefined,
      customMetrics: body.customMetrics,
    }
    await operationStatsService.saveManualKpi(kbId, entry)
    res.json({ success: true, data: entry })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to save KPI' })
  }
})

router.get('/health/:kbId', async (req, res) => {
  try {
    const { kbId } = req.params
    const days = parseInt(req.query.days as string) || 7
    const kpis = await operationStatsService.getManualKpis(kbId, days)
    const score = operationStatsService.calculateHealthScore(kpis)
    res.json({ success: true, data: { kbId, days, ...score } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to compute health score' })
  }
})

// v1.9.0 双维度统计:按 Skill 名称 + KB ID
// 前端 Stats 页面 + 验证脚本 verify-all-v190.py 都依赖此端点
router.get('/by-skill', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7
    const skillNameFilter = (req.query.skillName as string) || undefined
    const kbIdFilter = (req.query.kbId as string) || undefined

    const logs = await readLogs()
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000

    const filtered = logs.filter((log) => {
      const ts = new Date(log.timestamp).getTime()
      if (ts < cutoff) return false
      if (kbIdFilter && String(log.kbId) !== String(kbIdFilter)) return false
      if (skillNameFilter && log.skillName !== skillNameFilter) return false
      return true
    })

    // 兜底:用 apiKeyId 关联到 apiKeyStore 拿到 skillName
    const apiKeyCache = new Map<string, { skillId?: string; skillName?: string; kbId?: string }>()
    const resolveApiKey = async (apiKeyId: string | undefined): Promise<void> => {
      if (!apiKeyId || apiKeyCache.has(apiKeyId)) return
      try {
        const keys = await apiKeyStore.findAll()
        const k = keys.find((kk) => kk.id === apiKeyId)
        if (k) {
          apiKeyCache.set(apiKeyId, { skillId: k.skillId, skillName: k.skillName, kbId: k.kbId != null ? String(k.kbId) : undefined })
        }
      } catch {
        // ignore
      }
    }

    const bySkillMap = new Map<string, {
      skillId: string
      skillName: string
      kbId: string
      calls: number
      totalLatency: number
      errors: number
    }>()
    const byEndpointMap = new Map<string, number>()

    for (const log of filtered) {
      let skillId = log.skillId
      let skillName = log.skillName
      let kbId = log.kbId
      if ((!skillId || !skillName) && log.apiKeyId) {
        await resolveApiKey(log.apiKeyId)
        const meta = apiKeyCache.get(log.apiKeyId)
        if (meta) {
          skillId = skillId || meta.skillId
          skillName = skillName || meta.skillName
          kbId = kbId || meta.kbId
        }
      }
      // 始终输出,即使没有 skillName (unknown 也统计,便于诊断)
      const key = `${skillName || 'unknown'}|${kbId || 'unknown'}`
      const latency = log.latencyMs ?? log.duration ?? 0
      if (!bySkillMap.has(key)) {
        bySkillMap.set(key, {
          skillId: skillId || 'unknown',
          skillName: skillName || 'unknown',
          kbId: kbId || 'unknown',
          calls: 0,
          totalLatency: 0,
          errors: 0,
        })
      }
      const s = bySkillMap.get(key)!
      s.calls++
      s.totalLatency += latency
      if (log.statusCode >= 400) s.errors++
      byEndpointMap.set(log.path, (byEndpointMap.get(log.path) || 0) + 1)
    }

    const skills = Array.from(bySkillMap.values())
      .map((s) => ({
        skillId: s.skillId,
        skillName: s.skillName,
        kbId: s.kbId,
        calls: s.calls,
        totalLatency: s.totalLatency,
        errors: s.errors,
        avgLatency: s.calls > 0 ? Math.round(s.totalLatency / s.calls) : 0,
        errorRate: s.calls > 0 ? Math.round((s.errors / s.calls) * 100) : 0,
      }))
      .sort((a, b) => b.calls - a.calls)

    const total = skills.reduce((sum, s) => sum + s.calls, 0)
    const totalLatency = skills.reduce((sum, s) => sum + s.totalLatency, 0)
    const totalErrors = skills.reduce((sum, s) => sum + s.errors, 0)

    res.json({
      success: true,
      data: {
        total,
        avgLatency: total > 0 ? Math.round(totalLatency / total) : 0,
        errorRate: total > 0 ? Math.round((totalErrors / total) * 100) : 0,
        days,
        skills: skills.map(({ totalLatency: _tl, errors: _er, ...rest }) => {
          void _tl; void _er
          return rest
        }),
        byEndpoint: Object.fromEntries(byEndpointMap),
      },
    })
  } catch (error) {
    console.error('[by-skill] error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch by-skill stats' })
  }
})

export default router