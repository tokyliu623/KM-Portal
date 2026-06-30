import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

let tmpDir: string
let logsFile: string
let statsFile: string
let service: typeof import('../../src/server/services/operationStatsService').operationStatsService

function writeLogs(logs: unknown[]): Promise<void> {
  return fs.writeFile(logsFile, JSON.stringify(logs, null, 2), 'utf-8')
}

function makeLog(timestamp: string, statusCode = 200, duration = 50, kbId?: string) {
  return { timestamp, method: 'GET', path: '/api/kb/test', statusCode, duration, kbId }
}

describe('operationStatsService', () => {
  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'km-opstats-'))
    logsFile = path.join(tmpDir, 'api-logs.json')
    statsFile = path.join(tmpDir, 'operation-stats.json')
    process.env.KM_API_LOGS_FILE = logsFile
    process.env.KM_OPERATION_STATS_FILE = statsFile
    vi.resetModules()
    const mod = await import('../../src/server/services/operationStatsService')
    service = mod.operationStatsService
  })

  afterEach(async () => {
    delete process.env.KM_API_LOGS_FILE
    delete process.env.KM_OPERATION_STATS_FILE
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true })
    }
  })

  describe('getApiLogStats', () => {
    it('aggregates daily call volume from api-logs.json', async () => {
      await writeLogs([
        makeLog('2026-06-28T08:00:00Z', 200),
        makeLog('2026-06-28T09:00:00Z', 200),
        makeLog('2026-06-29T10:00:00Z', 500),
        makeLog('2026-06-30T11:00:00Z', 200),
      ])

      const summary = await service.getApiLogStats(7)

      const byDate = Object.fromEntries(summary.daily.map(d => [d.date, d]))
      expect(byDate['2026-06-28'].calls).toBe(2)
      expect(byDate['2026-06-29'].calls).toBe(1)
      expect(byDate['2026-06-29'].errors).toBe(1)
      expect(byDate['2026-06-30'].calls).toBe(1)
      expect(summary.totalCalls).toBe(4)
      expect(summary.totalErrors).toBe(1)
    })

    it('returns empty summary when no logs exist', async () => {
      const summary = await service.getApiLogStats(7)
      expect(summary.totalCalls).toBe(0)
      expect(summary.daily).toEqual([])
    })
  })

  describe('manual KPI CRUD', () => {
    it('saves and reads KPI entries per KB', async () => {
      await service.saveManualKpi('34754', { date: '2026-06-30', uv: 100, pv: 350, conversionRate: 0.45, satisfaction: 4.2 })
      await service.saveManualKpi('34754', { date: '2026-06-29', uv: 80, pv: 300, conversionRate: 0.4 })

      const entries = await service.getManualKpis('34754', 7)
      expect(entries).toHaveLength(2)
      const byDate = Object.fromEntries(entries.map(e => [e.date, e]))
      expect(byDate['2026-06-30'].uv).toBe(100)
      expect(byDate['2026-06-30'].satisfaction).toBe(4.2)
      expect(byDate['2026-06-29'].pv).toBe(300)
    })

    it('upserts by date (same date replaces)', async () => {
      await service.saveManualKpi('kb1', { date: '2026-06-30', uv: 100, pv: 200 })
      await service.saveManualKpi('kb1', { date: '2026-06-30', uv: 150, pv: 500 })

      const entries = await service.getManualKpis('kb1', 30)
      expect(entries).toHaveLength(1)
      expect(entries[0].uv).toBe(150)
      expect(entries[0].pv).toBe(500)
    })

    it('isolates KPI by KB id', async () => {
      await service.saveManualKpi('kb1', { date: '2026-06-30', uv: 10, pv: 20 })
      await service.saveManualKpi('kb2', { date: '2026-06-30', uv: 999, pv: 9999 })

      const k1 = await service.getManualKpis('kb1', 7)
      const k2 = await service.getManualKpis('kb2', 7)
      expect(k1[0].uv).toBe(10)
      expect(k2[0].uv).toBe(999)
    })
  })

  describe('generateTrendData', () => {
    it('returns x dates and aligned series', () => {
      const entries = [
        { date: '2026-06-28', uv: 50, pv: 100, conversionRate: 0.3 },
        { date: '2026-06-29', uv: 70, pv: 200, conversionRate: 0.4 },
        { date: '2026-06-30', uv: 100, pv: 350, conversionRate: 0.45 },
      ]
      const chart = service.generateTrendData(entries)

      expect(chart.x).toEqual(['2026-06-28', '2026-06-29', '2026-06-30'])
      const uvSeries = chart.series.find(s => s.name === 'UV')
      const pvSeries = chart.series.find(s => s.name === 'PV')
      const convSeries = chart.series.find(s => s.name === '转化率')
      expect(uvSeries?.data).toEqual([50, 70, 100])
      expect(pvSeries?.data).toEqual([100, 200, 350])
      expect(convSeries?.data).toEqual([30, 40, 45])
    })

    it('handles empty entries', () => {
      const chart = service.generateTrendData([])
      expect(chart.x).toEqual([])
      expect(chart.series).toEqual([])
    })
  })

  describe('calculateHealthScore', () => {
    it('returns 0 total for empty entries', () => {
      const score = service.calculateHealthScore([])
      expect(score.total).toBe(0)
      expect(score.grade).toBe('N/A')
    })

    it('computes weighted score across PV/UV/conversion/satisfaction', () => {
      const entries = [
        { date: '2026-06-30', uv: 100, pv: 1000, conversionRate: 0.5, satisfaction: 5 },
      ]
      const score = service.calculateHealthScore(entries)
      expect(score.total).toBeGreaterThan(0)
      expect(score.total).toBeLessThanOrEqual(100)
      expect(score.breakdown.pv).toBeGreaterThan(0)
      expect(score.breakdown.uv).toBeGreaterThan(0)
      expect(score.breakdown.conversion).toBeGreaterThan(0)
      expect(score.breakdown.satisfaction).toBeGreaterThan(0)
    })

    it('caps each dimension at 100 even with extreme values', () => {
      const entries = [
        { date: '2026-06-30', uv: 999999, pv: 999999, conversionRate: 9, satisfaction: 99 },
      ]
      const score = service.calculateHealthScore(entries)
      expect(score.breakdown.pv).toBeLessThanOrEqual(100)
      expect(score.breakdown.uv).toBeLessThanOrEqual(100)
      expect(score.breakdown.conversion).toBeLessThanOrEqual(100)
      expect(score.breakdown.satisfaction).toBeLessThanOrEqual(100)
    })
  })
})
