<template>
  <div class="interview-container">
    <div class="interview-header">
      <h1>模拟面试</h1>
      <el-button type="primary" @click="goBack" icon="ArrowLeft" plain>返回简历列表</el-button>
    </div>

    <div v-loading="loading" class="interview-content">
      <!-- 初始状态 -->
      <div v-if="!interviewStarted" class="interview-setup">
        <el-card class="setup-card">
          <template #header>
            <div class="card-header">
              <span>面试设置</span>
            </div>
          </template>
          
          <div class="setup-content">
            <div class="resume-info" v-if="currentResume">
              <h3>当前简历: {{ currentResume.name }}</h3>
              <p>{{ currentResume.title }}</p>
            </div>
            
            <el-form :model="setupForm" label-width="120px">
              <el-form-item label="职位描述">
                <el-input
                  v-model="setupForm.jobDescription"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入职位描述，以便AI更好地模拟面试"
                />
              </el-form-item>
              
              <el-form-item label="初始消息">
                <el-input
                  v-model="setupForm.userMessage"
                  type="textarea"
                  :rows="2"
                  placeholder="输入您想对面试官说的初始消息"
                />
              </el-form-item>
            </el-form>
            
            <div class="setup-actions">
              <el-button type="primary" size="large" @click="startInterview" :loading="loading">
                开始面试
              </el-button>
            </div>
          </div>
        </el-card>
      </div>
      
      <!-- 面试进行中 -->
      <div v-else class="interview-in-progress">
        <el-card class="interview-card">
          <template #header>
            <div class="card-header">
              <span>面试进行中</span>
              <el-tag :type="getStateTagType(interviewState)" size="small">
                {{ getStateDisplayName(interviewState) }}
              </el-tag>
            </div>
          </template>
          
          <div class="interview-content-inner">
            <!-- 面试会话信息 -->
            <div v-if="currentSession" class="session-info">
              <p class="welcome-message">{{ currentSession.welcomeMessage }}</p>
              <div class="progress-info">
                <el-progress 
                  :percentage="getProgressPercentage()" 
                  :format="progressFormat"
                  :stroke-width="20"
                />
                <div class="progress-details">
                  <span>阶段: {{ currentSession.currentStageName }}</span>
                  <span>问题: {{ currentSession.currentQuestionIndex + 1 }}/{{ currentSession.totalPlannedQuestions }}</span>
                </div>
              </div>
            </div>
            
            <!-- 当前问题 -->
            <div v-if="currentQuestion" class="current-question">
              <h3>面试官提问:</h3>
              <div class="question-content">
                {{ currentQuestion }}
              </div>
            </div>
            
            <!-- 用户回答 -->
            <div class="user-answer">
              <h3>您的回答:</h3>
              <el-input
                v-model="userAnswer"
                type="textarea"
                :rows="6"
                placeholder="请在此输入您的回答..."
                :disabled="interviewFinished"
              />
            </div>
            
            <!-- 操作按钮 -->
            <div class="interview-actions">
              <el-button 
                type="primary" 
                @click="submitAnswer" 
                :disabled="!userAnswer.trim() || waitingForResponse || interviewFinished"
                :loading="waitingForResponse"
              >
                提交回答
              </el-button>
              <el-button 
                type="warning" 
                @click="skipQuestion" 
                :disabled="waitingForResponse || interviewFinished"
              >
                跳过此题
              </el-button>
              <el-button 
                type="danger" 
                @click="finishInterview" 
                :disabled="waitingForResponse"
              >
                结束面试
              </el-button>
            </div>
          </div>
        </el-card>
        
        <!-- 面试历史记录 -->
        <el-card class="history-card" v-if="qaHistory.length > 0">
          <template #header>
            <div class="card-header">
              <span>面试历史</span>
            </div>
          </template>
          
          <div class="history-content">
            <div 
              v-for="(qa, index) in qaHistory" 
              :key="index" 
              class="qa-item"
            >
              <div class="question">
                <strong>Q:</strong> {{ qa.question }}
              </div>
              <div class="answer">
                <strong>A:</strong> {{ qa.answer }}
              </div>
            </div>
          </div>
        </el-card>
      </div>
      
      <!-- 面试完成 -->
      <div v-if="interviewFinished" class="interview-complete">
        <el-card class="complete-card">
          <template #header>
            <div class="card-header">
              <span>面试完成</span>
              <el-tag type="success">已完成</el-tag>
            </div>
          </template>
          
          <div v-if="interviewResult" class="complete-content">
            <div class="score-section">
              <h3>总评分: {{ interviewResult.totalScore }}/100</h3>
              <el-progress 
                type="circle" 
                :percentage="interviewResult.totalScore" 
                :status="getScoreStatus(interviewResult.totalScore)"
              />
            </div>
            
            <div class="feedback-section">
              <h3>最终反馈</h3>
              <p>{{ interviewResult.finalFeedback }}</p>
            </div>
            
            <div class="strengths-section">
              <h3>优势领域</h3>
              <el-tag 
                v-for="(area, index) in interviewResult.strongAreas" 
                :key="index" 
                type="success" 
                class="area-tag"
              >
                {{ area }}
              </el-tag>
            </div>
            
            <div class="improvements-section">
              <h3>改进建议</h3>
              <el-tag 
                v-for="(area, index) in interviewResult.improvementAreas" 
                :key="index" 
                type="warning" 
                class="area-tag"
              >
                {{ area }}
              </el-tag>
            </div>
            
            <div class="statistics-section">
              <h3>面试统计</h3>
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-label">总问题数:</span>
                  <span class="stat-value">{{ interviewResult.statistics.totalQuestions }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">追问次数:</span>
                  <span class="stat-value">{{ interviewResult.statistics.totalProbes }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">面试时长:</span>
                  <span class="stat-value">{{ interviewResult.statistics.durationMinutes }}分钟</span>
                </div>
              </div>
            </div>
            
            <div class="complete-actions">
              <el-button type="primary" @click="startNewInterview">开始新面试</el-button>
              <el-button @click="goBack">返回简历列表</el-button>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useResumeStore } from '@/stores/resume'
import { useUserStore } from '@/stores/user'
import {
  startInterview as startInterviewApi,
  continueInterview as continueInterviewApi,
  finishInterview as finishInterviewApi,
  getSessionStatus,
  type InterviewSimulationRequest,
  type InterviewContinueRequest,
  type InterviewResponseBO,
  type InterviewSessionBO,
  type InterviewCompleteBO
} from '@/api/interview'
import type { ResumeDetailResponse } from '@/api/resume'

const router = useRouter()
const route = useRoute()
const resumeStore = useResumeStore()
const userStore = useUserStore()

const loading = ref(false)
const interviewStarted = ref(false)
const interviewFinished = ref(false)
const waitingForResponse = ref(false)
const sessionId = ref<string | null>(null)
const userAnswer = ref('')
const currentSession = ref<InterviewSessionBO | null>(null)
const currentQuestion = ref('')
const interviewState = ref('')
const interviewResult = ref<InterviewCompleteBO | null>(null)
const qaHistory = ref<Array<{ question: string; answer: string }>>([])

const resumeId = computed(() => route.query.resumeId as string)
const currentResume = computed(() => resumeStore.currentResumeDetail)

const setupForm = ref({
  jobDescription: '',
  userMessage: ''
})

// 获取面试状态显示名称
const getStateDisplayName = (state: string) => {
  switch (state) {
    case 'INITIALIZING': return '初始化中'
    case 'IN_PROGRESS': return '进行中'
    case 'COMPLETED': return '已完成'
    case 'PAUSED': return '已暂停'
    case 'ERROR': return '错误'
    default: return state
  }
}

// 获取状态标签类型
const getStateTagType = (state: string) => {
  switch (state) {
    case 'INITIALIZING': return 'info'
    case 'IN_PROGRESS': return 'primary'
    case 'COMPLETED': return 'success'
    case 'PAUSED': return 'warning'
    case 'ERROR': return 'danger'
    default: return 'info'
  }
}

// 获取进度百分比
const getProgressPercentage = () => {
  if (!currentSession.value) return 0
  return Math.round(((currentSession.value.currentQuestionIndex + 1) / currentSession.value.totalPlannedQuestions) * 100)
}

// 进度格式化
const progressFormat = (percentage: number) => {
  return `${percentage}%`
}

// 获取评分状态
const getScoreStatus = (score: number) => {
  if (score >= 90) return 'success'
  if (score >= 70) return 'warning'
  return 'exception'
}

// 处理面试响应数据
const handleInterviewResponse = (interviewData: InterviewResponseBO) => {
  console.log('处理面试响应:', interviewData)

  interviewState.value = interviewData.interviewState

  if (interviewData.responseType === 'SESSION' && interviewData.session) {
    // 初始化会话
    console.log('初始化会话:', interviewData.session)
    currentSession.value = interviewData.session
    currentQuestion.value = interviewData.session.currentQuestion
    sessionId.value = interviewData.session.sessionId
    console.log('会话已设置, sessionId:', sessionId.value)
  } else if (interviewData.responseType === 'PROGRESS' && interviewData.progress) {
    // 继续面试 - 更新会话信息
    console.log('继续面试:', interviewData.progress)
    if (currentSession.value) {
      currentSession.value = {
        ...currentSession.value,
        sessionId: interviewData.progress.sessionId,
        currentStageIndex: interviewData.progress.currentStageIndex,
        currentStageName: interviewData.progress.currentStageName,
        currentQuestionIndex: interviewData.progress.currentQuestionIndex,
        currentQuestion: interviewData.progress.currentQuestion,
        totalPlannedQuestions: interviewData.progress.progress?.totalQuestions || currentSession.value.totalPlannedQuestions
      }
    }
    currentQuestion.value = interviewData.progress.currentQuestion

    // 清空用户回答
    userAnswer.value = ''
  } else if (interviewData.responseType === 'COMPLETE' && interviewData.complete) {
    // 面试完成
    console.log('面试完成:', interviewData.complete)
    interviewFinished.value = true
    interviewResult.value = interviewData.complete
    interviewState.value = 'COMPLETED'

    // 如果有问答历史，同步更新
    if (interviewData.complete.qaHistory && interviewData.complete.qaHistory.length > 0) {
      qaHistory.value = interviewData.complete.qaHistory.map(qa => ({
        question: qa.question,
        answer: qa.answer
      }))
    }
  }
}

// 开始面试
const startInterview = async () => {
  if (!resumeId.value) {
    ElMessage.error('缺少简历ID，无法开始面试')
    return
  }

  loading.value = true
  console.log('开始面试, resumeId:', resumeId.value)
  try {
    const requestData: InterviewSimulationRequest = {
      resumeId: resumeId.value,
      jobDescription: setupForm.value.jobDescription || undefined,
      userMessage: setupForm.value.userMessage || undefined
    }
    console.log('请求数据:', requestData)

    const interviewData = await startInterviewApi(requestData)
    console.log('API响应:', interviewData)

    // 直接处理返回的 InterviewResponseBO 数据
    if (interviewData && interviewData.responseType) {
      console.log('响应成功, data:', interviewData)
      handleInterviewResponse(interviewData)
      interviewStarted.value = true
      console.log('interviewStarted 设置为 true')
      ElMessage.success('面试已开始！')
    } else {
      console.error('响应数据格式不正确:', interviewData)
      ElMessage.error('开始面试失败：响应数据格式不正确')
    }
  } catch (error: any) {
    console.error('请求异常:', error)
    ElMessage.error(error.message || '开始面试失败')
  } finally {
    loading.value = false
  }
}

// 提交回答
const submitAnswer = async () => {
  if (!sessionId.value || !userAnswer.value.trim()) return

  waitingForResponse.value = true
  console.log('提交回答, sessionId:', sessionId.value, '类型:', typeof sessionId.value)
  try {
    // 记录问答历史
    qaHistory.value.push({
      question: currentQuestion.value,
      answer: userAnswer.value
    })

    const requestData: InterviewContinueRequest = {
      userAnswer: userAnswer.value
    }

    console.log('调用 continueInterviewApi, sessionId:', sessionId.value)
    const interviewData = await continueInterviewApi(sessionId.value, requestData)
    console.log('continueInterviewApi 响应:', interviewData)

    if (interviewData && interviewData.responseType) {
      handleInterviewResponse(interviewData)
    } else {
      ElMessage.error('提交回答失败：响应数据格式不正确')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '提交回答失败')
  } finally {
    waitingForResponse.value = false
  }
}

// 跳过问题
const skipQuestion = async () => {
  if (!sessionId.value) return

  waitingForResponse.value = true
  try {
    const requestData: InterviewContinueRequest = {
      userAnswer: '我跳过这个问题，请继续下一个问题。'
    }

    const interviewData = await continueInterviewApi(sessionId.value, requestData)

    if (interviewData && interviewData.responseType) {
      handleInterviewResponse(interviewData)
    } else {
      ElMessage.error('跳过问题失败：响应数据格式不正确')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '跳过问题失败')
  } finally {
    waitingForResponse.value = false
  }
}

// 结束面试
const finishInterview = async () => {
  if (!sessionId.value) return

  waitingForResponse.value = true
  try {
    const interviewData = await finishInterviewApi(sessionId.value)

    if (interviewData && interviewData.responseType) {
      handleInterviewResponse(interviewData)
      ElMessage.success('面试已结束')
    } else {
      ElMessage.error('结束面试失败：响应数据格式不正确')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '结束面试失败')
  } finally {
    waitingForResponse.value = false
  }
}

// 开始新面试
const startNewInterview = () => {
  interviewStarted.value = false
  interviewFinished.value = false
  sessionId.value = null
  userAnswer.value = ''
  currentSession.value = null
  currentQuestion.value = ''
  interviewState.value = ''
  interviewResult.value = null
  qaHistory.value = []
  setupForm.value.jobDescription = ''
  setupForm.value.userMessage = ''
}

// 返回
const goBack = () => {
  router.push('/resume/list')
}

// 页面加载时获取简历详情
onMounted(async () => {
  if (resumeId.value) {
    // 如果store中没有当前简历详情，则从API获取
    if (!currentResume.value || currentResume.value.resumeId !== resumeId.value) {
      try {
        const { getResume } = await import('@/api/resume')
        const resume = await getResume(resumeId.value)
        resumeStore.setCurrentResumeDetail(resume)
      } catch (error) {
        ElMessage.error('获取简历详情失败')
      }
    }
  } else {
    ElMessage.error('缺少简历ID，无法开始面试')
    router.push('/resume/list')
  }
})
</script>

<style scoped lang="scss">
.interview-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  
  .interview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    
    h1 {
      margin: 0;
      color: var(--text-primary);
    }
  }
  
  .interview-content {
    .setup-card, .interview-card, .complete-card, .history-card {
      margin-bottom: 2rem;
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
    }
    
    .setup-content {
      .resume-info {
        margin-bottom: 2rem;
        padding: 1rem;
        background-color: var(--bg-secondary);
        border-radius: 8px;
        
        h3 {
          margin: 0 0 0.5rem 0;
        }
        
        p {
          margin: 0;
          color: var(--text-secondary);
        }
      }
      
      .setup-actions {
        text-align: center;
        margin-top: 2rem;
      }
    }
    
    .interview-content-inner {
      .session-info {
        margin-bottom: 2rem;
        
        .welcome-message {
          font-size: 1.1rem;
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }
        
        .progress-info {
          .progress-details {
            display: flex;
            justify-content: space-between;
            margin-top: 0.5rem;
            font-size: 0.9rem;
            color: var(--text-secondary);
          }
        }
      }
      
      .current-question, .user-answer {
        margin-bottom: 2rem;
        
        h3 {
          margin-bottom: 1rem;
          color: var(--text-primary);
        }
        
        .question-content {
          padding: 1rem;
          background-color: var(--bg-secondary);
          border-radius: 8px;
          border-left: 4px solid var(--primary-color);
          line-height: 1.6;
        }
      }
      
      .interview-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
      }
    }
    
    .history-content {
      .qa-item {
        margin-bottom: 1.5rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid var(--border-color);
        
        &:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }
        
        .question, .answer {
          margin-bottom: 0.5rem;
          line-height: 1.6;
        }
        
        .question {
          color: var(--primary-color);
        }
      }
    }
    
    .complete-content {
      .score-section {
        text-align: center;
        margin-bottom: 2rem;
        
        h3 {
          margin-bottom: 1rem;
        }
      }
      
      .feedback-section, .strengths-section, .improvements-section {
        margin-bottom: 2rem;
        
        h3 {
          margin-bottom: 1rem;
        }
        
        p {
          line-height: 1.6;
        }
      }
      
      .area-tag {
        margin-right: 0.5rem;
        margin-bottom: 0.5rem;
      }
      
      .statistics-section {
        margin-bottom: 2rem;
        
        h3 {
          margin-bottom: 1rem;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          
          .stat-item {
            display: flex;
            justify-content: space-between;
            padding: 0.5rem;
            background-color: var(--bg-secondary);
            border-radius: 4px;
            
            .stat-label {
              font-weight: 500;
            }
            
            .stat-value {
              color: var(--primary-color);
              font-weight: 600;
            }
          }
        }
      }
      
      .complete-actions {
        text-align: center;
        margin-top: 2rem;
      }
    }
  }
}
</style>