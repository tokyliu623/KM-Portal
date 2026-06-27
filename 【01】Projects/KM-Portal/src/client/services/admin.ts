import api from './api'

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

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export const adminApi = {
  listTokens: () => api.get<ApiResponse<KMToken[]>>('/admin/tokens'),

  createToken: (data: {
    kb_id: number
    kb_name: string
    token: string
    owner: string
    permission?: 'read' | 'write'
    expiresAt?: string
  }) => api.post<ApiResponse<KMToken>>('/admin/tokens', data),

  updateToken: (id: string, data: Partial<KMToken>) =>
    api.put<ApiResponse<KMToken>>(`/admin/tokens/${id}`, data),

  revokeToken: (id: string) => api.post<ApiResponse<null>>(`/admin/tokens/${id}/revoke`),

  deleteToken: (id: string) => api.delete<ApiResponse<null>>(`/admin/tokens/${id}`),
}