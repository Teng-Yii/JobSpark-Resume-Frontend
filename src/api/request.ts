import axios, { type InternalAxiosRequestConfig, type AxiosResponse } from 'axios'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import router from '@/router'

// 创建 axios 实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json;charset=utf-8' }
})

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (error: any) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const { code, msg, data } = response.data
    // 根据实际后端约定的状态码判断，这里假设 200 为成功
    // 如果后端直接返回数据没有 code 包装，则直接返回 response.data
    // 这里使用通用模式：如果存在 code 且不为 200，则视为业务错误
    if (code !== undefined && code !== 200) {
      ElMessage.error(msg || '系统错误')
      
      // 处理特定错误码，如 401 token 失效
      if (code === 401) {
        const userStore = useUserStore()
        userStore.logout()
        router.push('/login')
      }
      return Promise.reject(new Error(msg || 'Error'))
    }
    
    // 如果没有 code 包装或 code 为 200，直接返回数据部分
    return data !== undefined ? data : response.data
  },
  (error: any) => {
    // 处理 HTTP 状态码错误
    let message = ''
    const status = error.response?.status
    switch (status) {
      case 400:
        message = '请求错误'
        break
      case 401:
        message = '未授权，请登录'
        // Token 过期或未登录，强制登出
        const userStore = useUserStore()
        userStore.logout()
        router.push('/login')
        break
      case 403:
        message = '拒绝访问'
        break
      case 404:
        message = '请求地址出错'
        break
      case 408:
        message = '请求超时'
        break
      case 500:
        message = '服务器内部错误'
        break
      default:
        message = error.message || '网络连接故障'
    }
    
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

export default service