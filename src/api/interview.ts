import request from './request'

// 面试模拟请求参数
export interface InterviewSimulationRequest {
  userId?: number
  resumeId: string
  jobDescription?: string
  userMessage?: string
}

// 面试继续请求参数
export interface InterviewContinueRequest {
  userAnswer: string
}

// 面试响应基础类型
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  error?: string
}

// 面试会话信息
export interface InterviewSessionBO {
  sessionId: string
  currentStageIndex: number
  currentStageName: string
  currentQuestionIndex: number
  currentQuestion: string
  totalPlannedQuestions: number
  stageInfos: StageInfo[]
  welcomeMessage?: string
}

// 阶段信息
export interface StageInfo {
  stageIndex: number
  stageName: string
  plannedQuestionCount: number
  finished: boolean
}

// 面试进度信息
export interface InterviewProgressBO {
  sessionId: string
  currentQuestionIndex: number
  currentStageIndex: number
  currentStageName: string
  currentQuestion: string
  progress: ProgressInfo
  finished: boolean
}

// 进度信息
export interface ProgressInfo {
  completedQuestions: number
  totalQuestions: number
  currentStageCompleted: number
  currentStageTotal: number
  completedStages: number
  totalStages: number
}

// 面试完成信息
export interface InterviewCompleteBO {
  sessionId: string
  finished: boolean
  totalScore: number
  finalFeedback: string
  improvementAreas: string[]
  strongAreas: string[]
  statistics: Statistics
  qaHistory: QARecord[]
}

// 统计信息
export interface Statistics {
  totalQuestions: number
  totalProbes: number
  durationMinutes: number
}

// 问答记录
export interface QARecord {
  stageName: string
  question: string
  answer: string
}

// 面试响应
export interface InterviewResponseBO {
  responseType: 'SESSION' | 'PROGRESS' | 'COMPLETE' | 'ERROR'
  sessionId: string
  interviewState: 'INITIALIZING' | 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED' | 'ERROR'
  session?: InterviewSessionBO
  progress?: InterviewProgressBO
  complete?: InterviewCompleteBO
  finished: boolean
}

// 开始面试
export function startInterview(data: InterviewSimulationRequest) {
  return request<any, InterviewResponseBO>({
    url: '/interviews/sessions',
    method: 'post',
    data
  })
}

// 结束面试
export function finishInterview(sessionId: string) {
  return request<any, InterviewResponseBO>({
    url: `/interviews/sessions/${sessionId}/finish`,
    method: 'post'
  })
}

// 继续面试
export function continueInterview(sessionId: string, data: InterviewContinueRequest) {
  return request<any, InterviewResponseBO>({
    url: `/interviews/sessions/${sessionId}/continue`,
    method: 'post',
    data
  })
}

// 获取面试状态
export function getSessionStatus(sessionId: string) {
  return request<any, InterviewResponseBO>({
    url: `/interviews/sessions/${sessionId}/status`,
    method: 'get'
  })
}