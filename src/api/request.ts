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
      // 处理特定错误码，如 401 token 失效
      if (code === 401) {
        const userStore = useUserStore()
        // 401 表示 token 失效，此时无需调用后端 logout，直接清除本地状态即可
        userStore.clearLoginState()
        // 避免在登录页重复跳转
        if (router.currentRoute.value.path !== '/login') {
          router.push('/login')
        }
      }
      
      // 将错误消息附加到 Error 对象上，由业务层决定是否显示
      const error: any = new Error(msg || 'Error')
      error.errorMessage = msg || '系统错误'
      error.code = code
      return Promise.reject(error)
    }
    
    // 如果没有 code 包装或 code 为 200，直接返回数据部分
    return data !== undefined ? data : response.data
  },
  (error: any) => {
    // 处理 HTTP 状态码错误
    let message = ''
    const status = error.response?.status
    
    // 优先使用后端返回的错误消息
    const backendMessage = error.response?.data?.message || error.response?.data?.msg
    
    if (backendMessage) {
      message = backendMessage
    } else {
      // 如果后端没有返回具体消息，使用默认消息
      switch (status) {
        case 400:
          message = '请求错误'
          break
        case 401:
          message = '未授权，请登录'
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
    }
    
    // 处理 401 特殊情况
    if (status === 401) {
      const userStore = useUserStore()
      // 401 表示 token 失效，此时无需调用后端 logout，直接清除本地状态即可
      userStore.clearLoginState()
      // 避免在登录页重复跳转
      if (router.currentRoute.value.path !== '/login') {
        router.push('/login')
      }
    }
    
    // 将错误消息附加到 error 对象上，由业务层决定是否显示
    // 不在拦截器中显示错误消息，避免重复提示
    error.errorMessage = message
    return Promise.reject(error)
  }
)

export default service