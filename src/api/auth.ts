import request from '@/api/request'

// 类型定义
export interface LoginRequest {
  username?: string
  password?: string
  phone?: string
  code?: string
  loginType?: 'password' | 'sms' // 预留扩展，虽然当前任务只提到用户名密码
}

export interface RegisterRequest {
  username: string
  password: string
  confirmPassword?: string
  email?: string
  phone?: string
  nickname?: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
  confirmPassword?: string
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

/**
 * 用户注册
 * @param data 注册参数
 */
export function registerApi(data: RegisterRequest) {
  return request<SecureLoginResponse>({
    url: '/auth/register',
    method: 'post',
    data
  })
}

/**
 * 忘记密码 - 发送重置密码邮件
 * @param data 包含用户邮箱
 */
export function forgotPasswordApi(data: ForgotPasswordRequest) {
  return request({
    url: '/auth/forgot-password',
    method: 'post',
    data
  })
}

/**
 * 重置密码
 * @param data 包含重置token和新密码
 */
export function resetPasswordApi(data: ResetPasswordRequest) {
  return request({
    url: '/auth/reset-password',
    method: 'post',
    data
  })
}