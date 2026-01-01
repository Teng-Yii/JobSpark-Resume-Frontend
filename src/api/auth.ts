import request from '@/api/request'

// 类型定义
export interface LoginRequest {
  username?: string
  password?: string
  phone?: string
  code?: string
  loginType?: 'password' | 'sms' // 预留扩展，虽然当前任务只提到用户名密码
}

export interface SecureLoginResponse {
  token: string
  expireAt?: number
  refreshToken?: string // 预留
}

export interface UserInfoResponse {
  id: number | string
  username: string
  avatar?: string
  roles?: string[]
  permissions?: string[]
  email?: string
  phone?: string
  nickname?: string
}

// API 函数

/**
 * 用户登录
 * @param data 登录参数
 */
export function loginApi(data: LoginRequest) {
  return request<SecureLoginResponse>({
    url: '/auth/login',
    method: 'post',
    data
  })
}

/**
 * 用户登出
 */
export function logoutApi() {
  return request({
    url: '/auth/logout',
    method: 'post'
  })
}

/**
 * 获取当前用户信息
 */
export function getUserInfoApi() {
  return request<UserInfoResponse>({
    url: '/auth/me',
    method: 'get'
  })
}

/**
 * 验证 Token 是否有效 (可选，根据需求看是否需要独立接口，通常 getUserInfo 失败即失效)
 * 这里假设后端有这个接口，如果没有可以去掉
 */
export function validateTokenApi() {
  return request<boolean>({
    url: '/auth/validate',
    method: 'post'
  })
}