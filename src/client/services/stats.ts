import api from './api'

export interface ApiLog {
  timestamp: string
  method: string
  path: string
  statusCode: number
  duration: number
  kbId?: string
}

export interface StatsOverview {
  totalCalls: number
  callsByEndpoint: Record<string, number>
  callsByStatus: Record<string, number>
  recentCalls: ApiLog[]
  dateRange: { start: string; end: string }
}

export interface DailyStats {
  date: string
  calls: number
  errors: number
}

export interface EndpointStats {
  path: string
  calls: number
  avgDuration: number
  errorRate: number
}

/** v1.9.0: 按 Skill 维度统计 */
export interface BySkillStats {
  total: number
  byDay: Record<string, number>
  byEndpoint: Record<string, number>
  avgLatency: number
  errorRate: number
  skills: Array<{
    skillId?: string
    skillName?: string
    calls: number
    avgLatency: number
    errorRate: number
  }>
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export const statsApi = {
  getOverview: () => api.get<ApiResponse<StatsOverview>>('/stats/overview'),

  getDaily: (days?: number) =>
    api.get<ApiResponse<DailyStats[]>>('/stats/daily', { params: { days } }),

  getEndpoints: () => api.get<ApiResponse<EndpointStats[]>>('/stats/endpoints'),

  getBySkill: (params: { skillName?: string; skillId?: string; kbId?: string; days?: number } = {}) =>
    api.get<ApiResponse<BySkillStats>>('/stats/by-skill', { params }),
}