import request from './request'

// 简历上传响应
export interface ResumeUploadAsyncResponse {
  taskId: string
  resumeId?: string
  message: string
}

// 任务状态响应
export interface TaskStatusResponse {
  taskId: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  progress?: number
  result?: any // 根据实际情况定义，如果是 COMPLETED，可能包含 resumeId 或其他信息
  error?: string
}

// 简历优化请求参数
export interface ResumeOptimizeRequest {
  resumeId: string
  jobDescription: string
  // 其他可能需要的参数，如模型选择等
}

// 优化建议项
export interface OptimizationSuggestion {
  id: string
  originalText?: string
  optimizedText: string
  reason: string
  type: string // 如 'format', 'content', 'grammar'
}

// 简历优化响应
export interface ResumeOptimizedResponse {
  resumeId: string
  score: number
  suggestions: OptimizationSuggestion[]
  summary: string
  optimizedContent?: string // 完整的优化后内容
}

// 嵌入向量存储响应
export interface EmbeddingResponse {
  success: boolean
  message: string
}

// 简历上传
export function uploadResume(data: FormData) {
  return request<any, ResumeUploadAsyncResponse>({
    url: '/api/v1/resumes/upload',
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
    url: `/api/v1/resumes/task/${taskId}/status`,
    method: 'get'
  })
}

// 简历优化
export function optimizeResume(data: ResumeOptimizeRequest) {
  return request<any, ResumeOptimizedResponse>({
    url: '/api/v1/resumes/optimize',
    method: 'post',
    data
  })
}

// 存储 Embedding
export function storeEmbedding(resumeId: string) {
  return request<any, EmbeddingResponse>({
    url: `/api/v1/resumes/${resumeId}/embedding`,
    method: 'post'
  })
}