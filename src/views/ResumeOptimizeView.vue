<template>
  <div class="page-container">
    <div class="header-section">
      <h1 class="page-title">AI 优化控制台</h1>
      <p class="page-subtitle">为特定职位量身定制您的简历</p>
    </div>

    <div class="main-content">
      <el-row :gutter="24" class="full-height-row">
        <!-- Left: Resume Preview -->
        <el-col :span="12" :xs="24" class="col-item">
          <div class="content-card card-shadow full-height">
            <div class="card-header">
              <h2 class="section-title">简历预览</h2>
              <div class="header-action">
                <el-tag type="info" effect="plain">已解析内容</el-tag>
              </div>
            </div>
            
            <div class="card-body scroll-container">
              <el-skeleton :rows="10" animated v-if="loading" />
              <div v-else class="resume-preview-content" v-html="resumeContent"></div>
            </div>
          </div>
        </el-col>
        
        <!-- Right: Optimization Control -->
        <el-col :span="12" :xs="24" class="col-item">
          <div class="content-card card-shadow full-height">
            <div class="card-header">
              <h2 class="section-title">AI 优化控制台</h2>
            </div>
            
            <div class="card-body scroll-container">
              <!-- Input Section -->
              <div class="input-group">
                <label class="input-label">目标职位描述 (JD)</label>
                <el-input
                  v-model="jobDescription"
                  type="textarea"
                  :rows="6"
                  placeholder="在此粘贴目标职位的详细描述，以便 AI 进行针对性优化..."
                  class="custom-textarea"
                />
                
                <el-button
                  type="primary"
                  @click="handleOptimize"
                  :loading="optimizing"
                  class="optimize-btn"
                >
                  {{ optimizing ? '正在智能解析...' : '开始智能优化' }}
                </el-button>
              </div>

              <!-- Result Section -->
              <div v-if="optimizationResult" class="result-container fade-in">
                <!-- 显示最新评分 -->
                <div v-if="optimizationResult.optimizationHistory && optimizationResult.optimizationHistory.length > 0" class="score-card">
                  <div class="score-ring-wrapper">
                    <el-progress 
                      type="dashboard" 
                      :percentage="Math.round(optimizationResult.optimizationHistory[optimizationResult.optimizationHistory.length - 1].score)" 
                      :color="scoreColors"
                      :width="100"
                      :stroke-width="8"
                    />
                  </div>
                  <div class="score-info">
                    <div class="score-value">{{ optimizationResult.optimizationHistory[optimizationResult.optimizationHistory.length - 1].score.toFixed(1) }}</div>
                    <div class="score-label">简历评分</div>
                  </div>
                </div>
                
                <!-- 显示优化建议文本 -->
                <div class="suggestions-list">
                  <h3 class="subsection-title">优化建议</h3>
                  
                  <div class="suggestion-text-content">
                    <pre class="suggestion-text">{{ optimizationResult.suggestionText }}</pre>
                  </div>
                  
                  <!-- 历史评分记录 -->
                  <div v-if="optimizationResult.optimizationHistory && optimizationResult.optimizationHistory.length > 1" class="history-section">
                    <h4 class="history-title">历史评分</h4>
                    <div
                      v-for="(record, index) in optimizationResult.optimizationHistory"
                      :key="index"
                      class="history-item"
                    >
                      <div class="history-header">
                        <span class="history-index">第 {{ index + 1 }} 次</span>
                        <el-tag size="small" type="info">评分: {{ record.score.toFixed(1) }}</el-tag>
                      </div>
                      <p class="history-feedback">{{ record.feedback }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { ResumeOptimizedResponse } from '@/api/resume'
import { optimizeResume } from '@/api/resume'
import { useResumeStore } from '@/stores/resume'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const resumeStore = useResumeStore()
const userStore = useUserStore()

const loading = ref(false)
const optimizing = ref(false)
const resumeContent = ref('<div class="empty-state">No resume content loaded</div>')
const jobDescription = ref('')
const optimizationResult = ref<ResumeOptimizedResponse | null>(null)

const scoreColors = [
  { color: '#f56c6c', percentage: 40 },
  { color: '#e6a23c', percentage: 70 },
  { color: '#67c23a', percentage: 100 },
]

onMounted(() => {
  if (!resumeStore.currentResumeId) {
    ElMessage.warning('请先上传简历')
    router.push('/resume/upload')
    return
  }
  
  if (resumeStore.currentResumeContent) {
    // Simple formatting for display
    resumeContent.value = resumeStore.currentResumeContent
      .split('\n')
      .map(line => `<p>${line}</p>`)
      .join('')
  }
})

const getTypeColor = (type: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' => {
  const map: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
    'content': 'primary',
    'format': 'warning',
    'keyword': 'success',
    'grammar': 'danger'
  }
  return map[type.toLowerCase()] || 'info'
}

const handleOptimize = async () => {
  if (!jobDescription.value.trim()) {
    ElMessage.warning('请输入职位描述')
    return
  }
  
  if (!resumeStore.currentResumeId) {
     ElMessage.error('简历 ID 丢失，请重新上传简历')
     router.push('/resume/upload')
     return
  }
  
  if (!userStore.userInfo?.id) {
    ElMessage.error('用户信息丢失，请重新登录')
    router.push('/login')
    return
  }

  optimizing.value = true
  try {
    const res = await optimizeResume({
      userId: Number(userStore.userInfo.id),
      resumeId: resumeStore.currentResumeId,
      jobDescription: jobDescription.value
    })
    
    optimizationResult.value = res
    ElMessage.success('优化完成')
  } catch (error: any) {
    // 优先显示后端返回的具体错误信息
    const errorMessage = error.errorMessage || error.response?.data?.message || error.response?.data?.msg || error.message || '优化失败，请重试'
    ElMessage.error(errorMessage)
    console.error('优化失败:', error)
  } finally {
    optimizing.value = false
  }
}
</script>

<style scoped lang="scss">
.page-container {
  min-height: 100vh;
  background-color: var(--bg-color);
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.header-section {
  text-align: center;
  margin-bottom: 30px;
  
  .page-title {
    font-size: 1.75rem;
    color: var(--text-main);
    margin-bottom: 5px;
  }
  
  .page-subtitle {
    color: var(--text-secondary);
    font-size: 1rem;
  }
}

.main-content {
  flex: 1;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

.full-height-row {
  height: calc(100vh - 140px);
  min-height: 600px;
}

.col-item {
  height: 100%;
  margin-bottom: 20px;
}

.content-card {
  background: #fff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border: 1px solid var(--border-color);
  
  .card-header {
    padding: 20px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #fcfcfc;
    
    .section-title {
      font-size: 1.1rem;
      margin: 0;
      color: var(--text-main);
    }
  }
  
  .card-body {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }
}

.scroll-container {
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #e2e8f0;
    border-radius: 3px;
  }
}

.resume-preview-content {
  font-family: 'Lato', sans-serif;
  color: var(--text-regular);
  line-height: 1.6;
  font-size: 0.95rem;
  
  :deep(p) {
    margin-bottom: 0.8em;
  }
}

.input-group {
  margin-bottom: 30px;
  
  .input-label {
    display: block;
    margin-bottom: 10px;
    font-weight: 600;
    color: var(--text-main);
    font-size: 0.95rem;
  }
  
  .custom-textarea {
    margin-bottom: 15px;
    
    :deep(.el-textarea__inner) {
      padding: 15px;
      font-family: inherit;
      border-color: var(--border-color);
      
      &:focus {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 1px var(--primary-color);
      }
    }
  }
  
  .optimize-btn {
    width: 100%;
    height: 44px;
    font-weight: 600;
  }
}

.result-container {
  border-top: 1px solid var(--border-color);
  padding-top: 20px;
}

.score-card {
  display: flex;
  align-items: center;
  background: #f8fafc;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 25px;
  
  .score-ring-wrapper {
    margin-right: 20px;
  }
  
  .score-info {
    .score-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-main);
      line-height: 1;
      margin-bottom: 5px;
    }
    .score-label {
      color: var(--text-secondary);
      font-size: 0.9rem;
    }
  }
}

.suggestions-list {
  .subsection-title {
    font-size: 1.1rem;
    margin-bottom: 20px;
    color: var(--text-main);
  }
  
  .suggestion-text-content {
    margin-bottom: 30px;
  }
  
  .suggestion-text {
    background-color: #f8fafc;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    white-space: pre-wrap;
    word-wrap: break-word;
    font-family: inherit;
    font-size: 0.95rem;
    line-height: 1.6;
    color: var(--text-main);
    margin: 0;
  }
  
  .history-section {
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid var(--border-color);
  }
  
  .history-title {
    font-size: 1rem;
    margin-bottom: 15px;
    color: var(--text-main);
  }
  
  .history-item {
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 15px;
    background-color: #fafafa;
    transition: all 0.2s;
    
    &:hover {
      border-color: #cbd5e1;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    
    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      
      .history-index {
        font-weight: 600;
        color: var(--text-secondary);
        font-size: 0.9rem;
      }
    }
    
    .history-feedback {
      font-size: 0.9rem;
      color: var(--text-main);
      margin: 0;
      line-height: 1.5;
    }
  }
}

@media (max-width: 900px) {
  .full-height-row {
    height: auto;
  }
  
  .content-card {
    height: 600px;
  }
}
</style>