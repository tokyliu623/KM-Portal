import axios from 'axios'
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
    const status = error.response?.status
    const serverMsg = error.response?.data?.error || error.response?.data?.msg
    let message = 'Request failed'

    if (status === 401) {
      message = serverMsg || '未授权，请检查 API Key'
    } else if (status === 403) {
      message = serverMsg || '权限不足'
    } else if (status === 404) {
      message = serverMsg || '资源不存在'
    } else if (status === 500) {
      message = serverMsg || '服务器错误'
    } else if (serverMsg) {
      message = serverMsg
    } else if (error.message) {
      message = error.message
    }

    return Promise.reject(new Error(message))
  }
)

export default api