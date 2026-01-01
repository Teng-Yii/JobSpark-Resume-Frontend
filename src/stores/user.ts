import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loginApi, logoutApi, getUserInfoApi, type LoginRequest, type UserInfoResponse } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem('token') || null)
  const userInfo = ref<UserInfoResponse | null>(null)

  const setToken = (newToken: string | null) => {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('token', newToken)
    } else {
      localStorage.removeItem('token')
    }
  }

  const setUserInfo = (info: UserInfoResponse | null) => {
    userInfo.value = info
  }

  const login = async (loginForm: LoginRequest) => {
    try {
      const res = await loginApi(loginForm)
      // 根据 request.ts 的拦截器，res 可能是解包后的 data
      // 后端返回字段为 accessToken
      const tokenStr = (res as any).accessToken || (res as any).token || (res as any).data?.accessToken || (res as any).data?.token
      if (tokenStr) {
        setToken(tokenStr)
        // 登录成功后获取用户信息
        await fetchUserInfo()
      } else {
        throw new Error('Token not found in response')
      }
      return res
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await logoutApi()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      // 无论后端登出是否成功，前端都要清理状态
      token.value = null
      userInfo.value = null
      localStorage.removeItem('token')
    }
  }

  const fetchUserInfo = async () => {
    try {
      const res = await getUserInfoApi()
      // 同样假设直接返回了 UserInfoResponse 对象
      setUserInfo(res as unknown as UserInfoResponse)
    } catch (error) {
      console.error('Fetch user info failed:', error)
      // 如果获取用户信息失败（如token失效），可能需要清理状态
      // 这里暂不自动登出，由 request.ts 拦截器处理 401
    }
  }

  return {
    token,
    userInfo,
    setToken,
    setUserInfo,
    logout,
    login,
    fetchUserInfo
  }
})