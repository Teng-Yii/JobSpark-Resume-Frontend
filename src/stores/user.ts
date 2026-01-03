import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loginApi, logoutApi, getUserInfoApi, registerApi, type LoginRequest, type RegisterRequest, type UserInfoResponse } from '@/api/auth'

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
        // 登录必须返回 token，否则视为服务器异常
        throw new Error('登录失败，服务器未返回身份验证信息')
      }
      return res
    } catch (error) {
      throw error
    }
  }

  const register = async (registerForm: RegisterRequest) => {
    try {
      const res = await registerApi(registerForm)
      // 注册成功后尝试自动登录，获取token
      const tokenStr = (res as any).accessToken || (res as any).token || (res as any).data?.accessToken || (res as any).data?.token
      if (tokenStr) {
        setToken(tokenStr)
        // 注册成功后获取用户信息
        await fetchUserInfo()
      }
      // 如果没有返回token，不抛出错误，由调用方决定是跳转到登录页还是首页
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

  const clearLoginState = () => {
    token.value = null
    userInfo.value = null
    localStorage.removeItem('token')
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
    clearLoginState,
    login,
    register,
    fetchUserInfo
  }
})