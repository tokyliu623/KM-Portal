import api from './api'

export interface GeneratedSkill {
  id: string
  name: string
  nameOriginal: string
  description: string
  kbId: number
  kbName: string
  permission: 'read' | 'write'
  content: string
  createdAt: string
  updatedAt: string
  /** v1.9.0: 关联 API Key ID */
  apiKeyId?: string
  /** v1.9.0: 创建时返回的明文 API Key */
  apiKey?: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export const skillApi = {
  list: () => api.get<ApiResponse<GeneratedSkill[]>>('/skill'),

  get: (id: string) => api.get<ApiResponse<GeneratedSkill>>(`/skill/${id}`),

  create: (data: {
    name: string
    description?: string
    kbId: number
    kbName: string
    permission?: 'read' | 'write'
  }) => api.post<ApiResponse<GeneratedSkill>>('/skill', data),

  update: (id: string, data: { name?: string; description?: string; permission?: 'read' | 'write' }) =>
    api.put<ApiResponse<GeneratedSkill>>(`/skill/${id}`, data),

  delete: (id: string) => api.delete<ApiResponse<null>>(`/skill/${id}`),

  export: (id: string) => api.get(`/skill/${id}/export`, { responseType: 'blob' }),
}