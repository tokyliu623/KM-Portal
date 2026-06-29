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
      switch (status) {
        case 401:
          message.error('未授权，请重新登录')
          break
        case 403:
          message.error('无权限访问')
          break
        case 404:
          message.error('资源不存在')
          break
        case 500:
          message.error('服务器错误')
          break
        default:
          message.error(data?.error || '请求失败')
      }
    } else {
      message.error('网络错误，请检查连接')
    }
    return Promise.reject(error)
  }
)

export default api