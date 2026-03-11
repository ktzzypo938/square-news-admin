import axios, { AxiosInstance, AxiosError } from 'axios'
import { useAuthStore } from '@/stores/auth'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

// Create public API client (no authentication)
export const publicApi: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Create admin API client (with API key authentication)
// 超時時間設為 5 分鐘，因為重新聚合等操作採用同步處理，每篇文章需要數秒
export const adminApi: AxiosInstance = axios.create({
  baseURL,
  timeout: 300000, // 5 分鐘
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add request interceptor to adminApi to include Admin JWT
adminApi.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers['Authorization'] = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Error response handler
function handleError(error: AxiosError): never {
  if (error.response) {
    const status = error.response.status
    const data = error.response.data as any

    switch (status) {
      case 401:
        throw new Error('API Key 無效或缺失')
      case 404:
        throw new Error('查無資料')
      case 400:
        throw new Error(data?.message || '請求參數錯誤')
      case 500:
        throw new Error('伺服器錯誤，請稍後再試')
      default:
        throw new Error(data?.message || `請求失敗 (${status})`)
    }
  } else if (error.request) {
    throw new Error('連線失敗，請檢查網路連線')
  } else {
    throw new Error(error.message || '未知錯誤')
  }
}

// Add response interceptor for error handling
publicApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => handleError(error)
)

adminApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => handleError(error)
)
