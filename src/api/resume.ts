import request from './request'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useUserStore } from '@/stores/user'

// 简历上传响应
export interface ResumeUploadAsyncResponse {
  success: boolean
  taskId: string
  fileName: string
  originalFileName: string;
  errorMessage: string;
  message: string;
  timestamp: number // int64
}

// 任务状态响应
export interface TaskStatusResponse {
  taskId: string
  status: string
  statusMessage: string
  progress: number // int32
  startTime: string // date-time
  completeTime: string // date-time
  resumeId: string
  errorMessage: string
  fileName: string
  originalFileName: string
  estimatedRemainingSeconds: number // int64
}

// 简历优化请求参数
export interface ResumeOptimizeRequest {
  resumeId: string
  jobDescription: string
}

// 优化记录
export interface OptimizationRecord {
  feedback: string
  score: number // double
}

// 简历优化响应
export interface ResumeOptimizedResponse {
  suggestionText: string
  optimizedResumeId: number // int64
  optimizationHistory: OptimizationRecord[]
}

// 简历优化下载请求
export interface ResumeOptimizedDownloadRequest {
  optimizedResumeId: string
  downloadFileType: string
}

// 嵌入向量存储响应
export type EmbeddingResponse = boolean | {
  success: boolean
  message: string
}

export interface HighlightBO {
  id?: number
  type?: number // 1: 工作经历, 2: 项目经历, 3: 技能
  relatedId?: number
  highlight?: string
  sortOrder?: number
}

export interface ContactBO {
  phone?: string
  email?: string
  wechat?: string
}

export interface EducationBO {
  school?: string
  degree?: string
  major?: string
  startTime?: string
  endTime?: string
  description?: string
}

export interface ExperienceBO {
  company?: string
  role?: string
  startTime?: string
  endTime?: string
  description?: string
  highlights?: HighlightBO[] // 工作经历亮点
}

export interface ProjectBO {
  name?: string
  role?: string
  startTime?: string
  endTime?: string
  description?: string
  highlights?: HighlightBO[] // 项目经历亮点
}

export interface SkillBO {
  name?: string
  level?: string
  category?: string
  highlights?: HighlightBO[] // 技能亮点
}

export interface ResumeDetailResponse {
  resumeId: string // 简历ID
  name: string // 姓名
  title: string // 求职标题/岗位意向
  avatarUrl: string // 头像URL
  summary: string // 个人简介
  contact: ContactBO
  educations: EducationBO[]
  experiences: ExperienceBO[]
  projects: ProjectBO[]
  skills: SkillBO[]
}

// 简历上传
export function uploadResume(data: FormData) {
  return request<any, ResumeUploadAsyncResponse>({
    url: '/resumes/upload',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 获取任务状态
export function getTaskStatus(taskId: string) {
  return request<any, TaskStatusResponse>({
    url: `/resumes/task/${taskId}/status`,
    method: 'get'
  })
}

// 简历优化
export function optimizeResume(data: ResumeOptimizeRequest) {
  return request<any, ResumeOptimizedResponse>({
    url: '/resumes/optimize',
    method: 'post',
    data,
    timeout: 200000 // 200秒超时（AI分析耗时较长）
  })
}

// 简历优化 SSE 流式传输
export async function optimizeResumeStream(
  data: ResumeOptimizeRequest,
  callbacks: {
    onMessage: (message: string, event?: string) => void
    onError?: (error: any) => void
    onClose?: () => void
  }
) {
  const userStore = useUserStore()
  const token = userStore.token
  const baseURL = import.meta.env.VITE_API_URL || '/api/v1'
  const url = `${baseURL.replace(/\/$/, '')}/resumes/optimize/stream`

  try {
    await fetchEventSource(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data),
      onmessage(msg) {
        // 根据 msg.event 区分消息类型，如 'progress' 或 'result'
        // 将消息内容和事件类型都传给回调
        callbacks.onMessage(msg.data, msg.event)

        // 如果收到 error 事件，也可以作为一种特殊消息处理，或者调用 onError
        // 这里我们选择通过事件类型区分，由调用者决定
        if (msg.event === 'error' && callbacks.onError) {
            callbacks.onError(new Error(msg.data));
        }
      },
      onerror(err) {
        if (callbacks.onError) {
          callbacks.onError(err)
        }
        // fetchEventSource 的 onerror 如果不抛出异常，默认会重试。
        // 如果想终止重试，需要抛出异常。这里我们抛出异常来终止。
        throw err
      },
      onclose() {
        if (callbacks.onClose) {
          callbacks.onClose()
        }
      },
      openWhenHidden: true // 即使页面在后台也保持连接
    })
  } catch (err) {
    if (callbacks.onError) {
      callbacks.onError(err)
    }
  }
}

// 存储 Embedding
export function storeEmbedding(resumeId: string) {
  return request<any, EmbeddingResponse>({
    url: `/resumes/${resumeId}/embedding`,
    method: 'post'
  })
}

// 生成优化后的简历文件
export function generateOptimizedFile(data: ResumeOptimizedDownloadRequest) {
  return request<any, Blob>({
    url: '/resumes/generateOptimizedFile',
    method: 'post',
    data,
    responseType: 'blob'
  })
}

// 获取简历列表
export function getResumeList() {
  return request<any, ResumeDetailResponse[]>({
    url: '/resumes/list',
    method: 'get'
  })
}