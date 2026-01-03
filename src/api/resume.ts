import request from './request'

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
  userId: number // int64
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
  userId: number // int64
  optimizedResumeId: number // int64
  downloadFileType: string
}

// 嵌入向量存储响应
export interface EmbeddingResponse {
  success: boolean
  message: string
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
    data
  })
}

// 存储 Embedding
export function storeEmbedding(resumeId: string) {
  return request<any, EmbeddingResponse>({
    url: `/resumes/${resumeId}/embedding`,
    method: 'post'
  })
}