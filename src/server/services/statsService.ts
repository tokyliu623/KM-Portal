import { getStats, getRawCalls } from './statsStore.js'

export interface SkillAggregate {
  skillId?: string
  skillName?: string
  calls: number
  avgLatency: number
  errorRate: number
}

export interface StatsBySkill {
  total: number
  byDay: Record<string, number>
  byEndpoint: Record<string, number>
  avgLatency: number
  errorRate: number
  skills: SkillAggregate[]
}

export const statsService = {
  /** v1.9.0: 按 Skill 名称 + KB ID 双维度聚合 */
  async getStatsBySkill(opts: {
    skillName?: string
    skillId?: string
    kbId?: number | string
    days?: number
  }): Promise<StatsBySkill> {
    const days = opts.days || 7
    const kbId = opts.kbId !== undefined ? String(opts.kbId) : undefined

    const [stats, rawCalls] = await Promise.all([
      getStats(kbId, days),
      getRawCalls(kbId, days, opts.skillName, opts.skillId),
    ])

    const bySkill = new Map<string, { skillId?: string; calls: number; totalLatency: number; errors: number }>()
    for (const call of rawCalls) {
      const name = call.skillName || '(unassigned)'
      const existing = bySkill.get(name) || { skillId: call.skillId, calls: 0, totalLatency: 0, errors: 0 }
      existing.calls++
      existing.totalLatency += call.latencyMs
      if (call.statusCode >= 400) existing.errors++
      bySkill.set(name, existing)
    }

    const skills: SkillAggregate[] = Array.from(bySkill.entries())
      .map(([name, v]) => ({
        skillId: v.skillId,
        skillName: name,
        calls: v.calls,
        avgLatency: v.calls > 0 ? Math.round(v.totalLatency / v.calls) : 0,
        errorRate: v.calls > 0 ? Math.round((v.errors / v.calls) * 100) : 0,
      }))
      .sort((a, b) => b.calls - a.calls)

    const errorCount = rawCalls.filter((c) => c.statusCode >= 400).length

    return {
      total: stats.total,
      byDay: stats.byDay,
      byEndpoint: stats.byEndpoint,
      avgLatency: stats.avgLatency,
      errorRate: rawCalls.length > 0 ? Math.round((errorCount / rawCalls.length) * 100) : 0,
      skills,
    }
  },
}
