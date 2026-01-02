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
                <div class="score-card">
                  <div class="score-ring-wrapper">
                    <el-progress 
                      type="dashboard" 
                      :percentage="optimizationResult.score" 
                      :color="scoreColors"
                      :width="100"
                      :stroke-width="8"
                    />
                  </div>
                  <div class="score-info">
                    <div class="score-value">{{ optimizationResult.score }}</div>
                    <div class="score-label">简历评分</div>
                  </div>
                </div>
                
                <div class="suggestions-list">
                  <h3 class="subsection-title">优化建议</h3>
                  
                  <div
                    v-for="(item, index) in optimizationResult.suggestions"
                    :key="index"
                    class="suggestion-item"
                  >
                    <div class="suggestion-header">
                      <span class="suggestion-index">#{{ index + 1 }}</span>
                      <el-tag size="small" :type="getTypeColor(item.type)">{{ item.type }}</el-tag>
                    </div>
                    
                    <p class="suggestion-reason">{{ item.reason }}</p>
                    
                    <div class="comparison-box">
                      <div class="compare-row original">
                        <div class="compare-label">原文</div>
                        <div class="compare-content">{{ item.originalText }}</div>
                      </div>
                      <div class="compare-row improved">
                        <div class="compare-label">建议修改</div>
                        <div class="compare-content">{{ item.optimizedText }}</div>
                      </div>
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

const router = useRouter()
const resumeStore = useResumeStore()

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

const getTypeColor = (type: string) => {
  const map: Record<string, string> = {
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
     ElMessage.error('简历 ID 丢失')
     return
  }

  optimizing.value = true
  try {
    const res = await optimizeResume({
      resumeId: resumeStore.currentResumeId,
      jobDescription: jobDescription.value
    })
    
    optimizationResult.value = res
    ElMessage.success('优化完成')
  } catch (error) {
    console.error(error)
    ElMessage.error('优化失败，请重试')
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
}

.suggestion-item {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  transition: all 0.2s;
  
  &:hover {
    border-color: #cbd5e1;
    box-shadow: 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
  
  .suggestion-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    
    .suggestion-index {
      font-weight: 700;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }
  }
  
  .suggestion-reason {
    font-size: 0.95rem;
    color: var(--text-main);
    margin-bottom: 15px;
    font-weight: 500;
  }
  
  .comparison-box {
    background-color: #f8fafc;
    border-radius: 6px;
    overflow: hidden;
    font-size: 0.9rem;
    
    .compare-row {
      display: flex;
      padding: 12px 15px;
      
      &.original {
        border-bottom: 1px solid rgba(0,0,0,0.05);
        background-color: #fff5f5;
        
        .compare-label { color: var(--danger-color); }
        .compare-content { text-decoration: line-through; opacity: 0.7; }
      }
      
      &.improved {
        background-color: #f0f9eb;
        
        .compare-label { color: var(--secondary-color); }
      }
      
      .compare-label {
        width: 80px;
        flex-shrink: 0;
        font-weight: 600;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding-top: 2px;
      }
      
      .compare-content {
        flex: 1;
        line-height: 1.5;
        color: var(--text-regular);
      }
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