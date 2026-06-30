import axios from 'axios'
import { message } from 'antd'
import { useAuthStore } from '../stores/useAuthStore'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const apiKey = useAuthStore.getState().apiKey
  if (apiKey) {
    config.headers.Authorization = `Bearer ${apiKey}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      const isAuthed = Boolean(useAuthStore.getState().apiKey)
      const errorText = (data && typeof data === 'object' && 'error' in data
        ? String((data as { error?: unknown }).error || '')
        : ''
      ).trim()
      switch (status) {
        case 401:
          message.error(isAuthed ? `Token 无效或已过期：${errorText || '请重新登录'}` : '未登录或会话已过期')
          break
        case 403:
          message.error(errorText || '权限不足，无法访问该资源')
          break
        case 404:
          message.error(errorText || '请求的资源不存在')
          break
        case 408:
          message.error('请求超时，请稍后重试')
          break
        case 429:
          message.error('请求过于频繁，请稍后再试')
          break
        case 500:
          message.error('服务器内部错误，请稍后重试')
          break
        case 502:
        case 503:
        case 504:
          message.error('服务暂不可用，请稍后重试')
          break
        default:
          message.error(errorText || `请求失败 (${status})`)
      }
    } else if (error.code === 'ECONNABORTED') {
      message.error('请求超时，请检查网络')
    } else {
      message.error('网络连接失败，请检查网络状态')
    }
    return Promise.reject(error)
  }
)

export default api
