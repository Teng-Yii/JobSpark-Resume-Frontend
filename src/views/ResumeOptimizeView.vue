<template>
  <div class="page-container">
    <div class="header-section">
      <div class="header-back">
        <el-button text @click="router.push('/resume/list')" class="back-btn">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回简历列表</span>
        </el-button>
      </div>
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
                <el-button
                  v-if="resumeStore.optimizationResult?.optimizedResumeId"
                  type="primary"
                  size="small"
                  @click="handleDownload"
                  :loading="downloading"
                >
                  下载优化简历
                </el-button>
                <el-tag v-else type="info" effect="plain">已解析内容</el-tag>
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
              <div v-if="resumeStore.optimizationResult || processStatus" class="result-container fade-in">

                <!-- 实时状态展示区域 -->
                <div v-if="processStatus || optimizing" class="process-status-container">
                   <div class="status-header">
                      <el-tag :type="processStatus === 'PROCESSING' ? 'primary' : (processStatus === 'COMPLETED' ? 'success' : (processStatus === 'ERROR' ? 'danger' : 'info'))" effect="dark">
                        {{ processStatus === 'PROCESSING' ? '优化进行中' : (processStatus === 'COMPLETED' ? '优化完成' : (processStatus === 'ERROR' ? '发生错误' : processStatus || '准备中')) }}
                      </el-tag>
                      <span class="status-message">{{ processMessage }}</span>
                   </div>
                   <!-- 实时反馈展示 -->
                   <div v-if="latestFeedback && optimizing" class="live-feedback">
                      <div class="feedback-label">AI 实时思考:</div>
                      <div class="feedback-content">{{ latestFeedback }}</div>
                   </div>
                </div>

                <!-- 显示最新评分 -->
                <div v-if="resumeStore.optimizationResult?.optimizationHistory && resumeStore.optimizationResult.optimizationHistory.length > 0" class="score-card">
                  <div class="score-ring-wrapper">
                    <el-progress
                      type="dashboard"
                      :percentage="Math.round(resumeStore.optimizationResult!.optimizationHistory![resumeStore.optimizationResult!.optimizationHistory!.length - 1]!.score)"
                      :color="scoreColors"
                      :width="100"
                      :stroke-width="8"
                    />
                  </div>
                  <div class="score-info">
                    <div class="score-value">{{ resumeStore.optimizationResult!.optimizationHistory![resumeStore.optimizationResult!.optimizationHistory!.length - 1]!.score.toFixed(1) }}</div>
                    <div class="score-label">简历评分</div>
                  </div>
                </div>

                <!-- 显示优化建议文本 -->
                <div class="suggestions-list">
                  <h3 class="subsection-title">📋 优化建议详情</h3>

                  <div class="suggestion-structured-content">
                    <!-- 优势亮点 -->
                    <div v-if="resumeStore.parsedSuggestion.advantages" class="suggestion-section advantage-section">
                      <div class="section-header">
                        <span class="section-icon">✨</span>
                        <h4 class="section-title">优势亮点</h4>
                      </div>
                      <ul class="suggestion-list">
                        <li v-for="(item, idx) in resumeStore.parsedSuggestion.advantages" :key="idx" class="suggestion-item success-item">
                          <span class="item-number">{{ idx + 1 }}</span>
                          <span class="item-text">{{ item }}</span>
                        </li>
                      </ul>
                    </div>

                    <!-- 不足之处 -->
                    <div v-if="resumeStore.parsedSuggestion.weaknesses" class="suggestion-section weakness-section">
                      <div class="section-header">
                        <span class="section-icon">⚠️</span>
                        <h4 class="section-title">不足之处</h4>
                      </div>
                      <ul class="suggestion-list">
                        <li v-for="(item, idx) in resumeStore.parsedSuggestion.weaknesses" :key="idx" class="suggestion-item warning-item">
                          <span class="item-number">{{ idx + 1 }}</span>
                          <span class="item-text">{{ item }}</span>
                        </li>
                      </ul>
                    </div>

                    <!-- 改进建议 -->
                    <div v-if="resumeStore.parsedSuggestion.improvements" class="suggestion-section improvement-section">
                      <div class="section-header">
                        <span class="section-icon">💡</span>
                        <h4 class="section-title">改进建议</h4>
                      </div>
                      <ul class="suggestion-list">
                        <li v-for="(item, idx) in resumeStore.parsedSuggestion.improvements" :key="idx" class="suggestion-item primary-item">
                          <span class="item-number">{{ idx + 1 }}</span>
                          <span class="item-text">{{ item }}</span>
                        </li>
                      </ul>
                    </div>

                    <!-- 如果解析失败，显示原始文本 -->
                    <div v-if="!resumeStore.parsedSuggestion.advantages && !resumeStore.parsedSuggestion.weaknesses && !resumeStore.parsedSuggestion.improvements" class="suggestion-text-fallback">
                      <pre class="suggestion-text">{{ resumeStore.optimizationResult?.suggestionText }}</pre>
                    </div>
                  </div>

                  <!-- 历史评分记录 -->
                  <div v-if="resumeStore.optimizationResult?.optimizationHistory && resumeStore.optimizationResult.optimizationHistory.length > 1" class="history-section">
                    <h4 class="history-section-title">📊 历史评分记录</h4>
                    <div
                      v-for="(record, index) in resumeStore.optimizationResult.optimizationHistory"
                      :key="index"
                      class="history-item"
                    >
                      <div class="history-header">
                        <div class="history-left">
                          <span class="history-badge">{{ index + 1 }}</span>
                          <span class="history-label">第 {{ index + 1 }} 次优化</span>
                        </div>
                        <el-tag size="small" :type="getScoreTagType(record.score)">评分: {{ record.score.toFixed(1) }}</el-tag>
                      </div>
                      <div class="history-feedback">
                        {{ record.feedback }}
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
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { optimizeResume, optimizeResumeStream, generateOptimizedFile } from '@/api/resume'
import { useResumeStore } from '@/stores/resume'
import { useUserStore } from '@/stores/user'
import type { ResumeDetailResponse } from '@/api/resume'

const router = useRouter()
const route = useRoute()
const resumeStore = useResumeStore()
const userStore = useUserStore()

const loading = ref(false)
const optimizing = ref(false)
const downloading = ref(false)
const resumeContent = ref('<div class="empty-state">No resume content loaded</div>')
const jobDescription = ref('')

// 新增：流式处理状态变量
const processStatus = ref('')
const processMessage = ref('')

const latestFeedback = computed(() => {
  const history = resumeStore.optimizationResult?.optimizationHistory
  if (history && history.length > 0) {
    return history[history.length - 1]?.feedback || ''
  }
  return ''
})

const scoreColors = [
  { color: '#f56c6c', percentage: 40 },
  { color: '#e6a23c', percentage: 70 },
  { color: '#67c23a', percentage: 100 },
]

const formatResumeToHtml = (resume: ResumeDetailResponse) => {
  let html = `<div class="resume-preview">`
  html += `<h2>${resume.name || '姓名未知'}</h2>`
  html += `<p><strong>${resume.title || ''}</strong></p>`

  if (resume.contact) {
      const contacts = []
      if (resume.contact.phone) contacts.push(resume.contact.phone)
      if (resume.contact.email) contacts.push(resume.contact.email)
      if (contacts.length > 0) html += `<p>${contacts.join(' | ')}</p>`
  }

  if (resume.summary) {
      html += `<h3>个人简介</h3><p>${resume.summary}</p>`
  }

  if (resume.experiences && resume.experiences.length > 0) {
      html += `<h3>工作经历</h3>`
      resume.experiences.forEach(exp => {
          html += `<div class="exp-item">
            <p><strong>${exp.company || ''}</strong> - ${exp.role || ''}</p>
            <p class="date">${exp.startTime || ''} ~ ${exp.endTime || ''}</p>
            <p>${exp.description || ''}</p>`
          
          // 显示工作经历亮点
          if (exp.highlights && exp.highlights.length > 0) {
            html += `<div class="highlights-section">
              <div class="highlights-title">⭐ 工作亮点</div>
              <ul class="highlights-list">`
            exp.highlights.forEach(h => {
              html += `<li class="highlight-item">${h.highlight || ''}</li>`
            })
            html += `</ul></div>`
          }
          
          html += `</div>`
      })
  }

  if (resume.projects && resume.projects.length > 0) {
      html += `<h3>项目经历</h3>`
      resume.projects.forEach(proj => {
          html += `<div class="proj-item">
            <p><strong>${proj.name || ''}</strong> - ${proj.role || ''}</p>
            <p class="date">${proj.startTime || ''} ~ ${proj.endTime || ''}</p>
            <p>${proj.description || ''}</p>`
          
          // 显示项目经历亮点
          if (proj.highlights && proj.highlights.length > 0) {
            html += `<div class="highlights-section">
              <div class="highlights-title">⭐ 项目亮点</div>
              <ul class="highlights-list">`
            proj.highlights.forEach(h => {
              html += `<li class="highlight-item">${h.highlight || ''}</li>`
            })
            html += `</ul></div>`
          }
          
          html += `</div>`
      })
  }

  if (resume.educations && resume.educations.length > 0) {
      html += `<h3>教育经历</h3>`
      resume.educations.forEach(edu => {
          html += `<div class="edu-item">
            <p><strong>${edu.school || ''}</strong></p>
            <p>${edu.degree || ''} - ${edu.major || ''}</p>
            <p class="date">${edu.startTime || ''} ~ ${edu.endTime || ''}</p>
          </div>`
      })
  }

  // 显示技能
  if (resume.skills && resume.skills.length > 0) {
      html += `<h3>专业技能</h3>`
      resume.skills.forEach(skill => {
          html += `<div class="skill-item">
            <p><strong>${skill.name || ''}</strong>`
          if (skill.level) {
            html += ` - <span class="skill-level">${skill.level}</span>`
          }
          html += `</p>`
          
          // 显示技能亮点
          if (skill.highlights && skill.highlights.length > 0) {
            html += `<div class="highlights-section">
              <ul class="highlights-list">`
            skill.highlights.forEach(h => {
              html += `<li class="highlight-item">${h.highlight || ''}</li>`
            })
            html += `</ul></div>`
          }
          
          html += `</div>`
      })
  }

  html += `</div>`
  return html
}

onMounted(async () => {
  const queryId = route.query.id as string

  // 1. 优先使用 URL 中的 ID
  if (queryId) {
    loading.value = true
    resumeStore.setResumeId(queryId)
    try {
      // 先检查 store 中是否已有当前简历的详情数据
      if (resumeStore.currentResumeDetail && resumeStore.currentResumeDetail.resumeId === queryId) {
        // 直接使用 store 中的数据
        resumeContent.value = formatResumeToHtml(resumeStore.currentResumeDetail)
      } else {
        // 如果 store 中没有，则从列表中查找
        if (!resumeStore.resumeList || resumeStore.resumeList.length === 0) {
          await resumeStore.fetchResumeList()
        }

        const foundResume = resumeStore.resumeList.find(r => r.resumeId === queryId)
        if (foundResume) {
          resumeStore.setCurrentResumeDetail(foundResume)
          resumeContent.value = formatResumeToHtml(foundResume)
        } else {
          ElMessage.warning('未找到指定简历信息')
        }
      }
    } catch (e) {
      ElMessage.error('加载简历信息失败')
    } finally {
      loading.value = false
    }
  }
  // 2. 如果没有 URL ID，但 store 中有 currentResumeId（刚上传完的情况）
  else if (resumeStore.currentResumeId) {
     if (resumeStore.currentResumeContent) {
        resumeContent.value = resumeStore.currentResumeContent
          .split('\n')
          .map(line => `<p>${line}</p>`)
          .join('')
      }
  }
  // 3. 既没有 URL ID 也没有 store ID
  else {
    ElMessage.warning('请先选择或上传一份简历')
    router.push('/resume/list')
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


// 根据评分返回标签类型
const getScoreTagType = (score: number): 'success' | 'warning' | 'danger' | 'info' => {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  if (score >= 40) return 'danger'
  return 'info'
}

const handleOptimize = async () => {
  if (!jobDescription.value.trim()) {
    ElMessage.warning('请输入职位描述')
    return
  }

  if (!resumeStore.currentResumeId) {
     ElMessage.error('简历 ID 丢失,请重新上传简历')
     router.push('/resume/upload')
     return
  }

  optimizing.value = true
  processStatus.value = 'STARTING'
  processMessage.value = '开始初始化优化流程...'

  // 清空旧结果
  resumeStore.setOptimizationResult({
    suggestionText: '',
    optimizedResumeId: 0,
    optimizationHistory: []
  })

  try {
    await optimizeResumeStream({
      resumeId: resumeStore.currentResumeId,
      jobDescription: jobDescription.value
    }, {
      onMessage: (message, event) => {
        // 如果后端返回 result 事件，则直接更新结果
        if (event === 'result') {
          try {
            const res = JSON.parse(message)
            resumeStore.setOptimizationResult(res)
            processStatus.value = 'COMPLETED'
            processMessage.value = '优化已完成'
          } catch (e) {
            console.error('Failed to parse result JSON:', e)
          }
        }
        // 处理进度事件，实时展示评分和反馈
        else if (event === 'progress') {
          try {
            const data = JSON.parse(message)
            // 更新实时状态
            if (data.status) processStatus.value = data.status
            if (data.message) processMessage.value = data.message

            // 确保 optimizationResult 已初始化
            if (!resumeStore.optimizationResult) {
              resumeStore.setOptimizationResult({
                suggestionText: '',
                optimizedResumeId: 0,
                optimizationHistory: []
              })
            }

            const currentHistory = resumeStore.optimizationResult?.optimizationHistory || []
            let score = data.score
            // 如果分数是小数（如 0.78），转换为百分制（78）
            if (score <= 1 && score > 0) {
              score = score * 100
            }

            // 优先使用 feedback，如果没有则使用 message
            const feedbackText = data.feedback || data.message || ''

            const newRecord = {
              score: score,
              feedback: feedbackText
            }

            // 如果没有历史记录，或者我们需要实时更新当前正在进行的这条记录
            // 策略：如果 history 为空，push 一条。如果 history 不为空，我们认为最后一条是当前正在优化的记录（或者上一条已完成），
            // 但由于我们在开始优化时清空了 result (line 230)，所以这里通常 history 是空的或者只有当前这条。
            if (currentHistory.length === 0) {
              currentHistory.push(newRecord)
            } else {
              // 更新最后一条
              currentHistory[currentHistory.length - 1] = newRecord
            }

            // 触发更新
            resumeStore.setOptimizationResult({
              ...resumeStore.optimizationResult!,
              optimizationHistory: currentHistory
            })

          } catch (e) {
            console.error('Failed to parse progress JSON:', e)
          }
        }
        // 默认处理：如果是普通消息或content事件，尝试增量更新文本
        else {
          // 尝试解析JSON看是否有特定结构
          try {
            const res = JSON.parse(message)
            if (res.suggestionText) {
              // 假设是增量或全量，这里简单处理为更新
              // 如果需要更复杂的增量逻辑，需要后端协议支持
              // 暂时覆盖，如果是全量的话
              if (res.isPartial) {
                  // 如果后端有isPartial字段
                  const current = resumeStore.optimizationResult?.suggestionText || ''
                  resumeStore.optimizationResult!.suggestionText = current + res.suggestionText
              } else {
                  // 否则假设是完整对象或部分对象
                  resumeStore.setOptimizationResult({
                      ...resumeStore.optimizationResult!,
                      ...res
                  })
              }
            } else {
                // 如果是其他JSON数据，可能忽略或处理
            }
          } catch (e) {
            // 解析失败，视为纯文本追加 (流式输出常见情况)
            if (!resumeStore.optimizationResult) {
                resumeStore.setOptimizationResult({
                    suggestionText: '',
                    optimizedResumeId: 0,
                    optimizationHistory: []
                })
            }
            const current = resumeStore.optimizationResult!.suggestionText || ''
            resumeStore.optimizationResult!.suggestionText = current + message
          }
        }
      },
      onError: (err) => {
        // 优先显示后端返回的具体错误信息
        const errorMessage = err.errorMessage || err.message || '优化失败,请重试'
        ElMessage.error(errorMessage)
        console.error('优化失败:', err)
        optimizing.value = false
        processStatus.value = 'ERROR'
        processMessage.value = errorMessage
      },
      onClose: () => {
        optimizing.value = false
        if (processStatus.value !== 'ERROR') {
             ElMessage.success('优化完成')
             processStatus.value = 'COMPLETED'
        }
      }
    })
  } catch (error: any) {
    // 这里捕获的是发起请求阶段的错误（如网络不通等），流过程中的错误由 onError 处理
    const errorMessage = error.errorMessage || error.message || '请求失败'
    ElMessage.error(errorMessage)
    optimizing.value = false
    processStatus.value = 'ERROR'
    processMessage.value = errorMessage
  }
}

const handleDownload = async () => {
  const optimizedResultId = resumeStore.optimizationResult?.optimizedResumeId
  if (!optimizedResultId) {
    ElMessage.warning('请先进行简历优化')
    return
  }

  const resumeId = resumeStore.currentResumeId
  if (!resumeId) {
    ElMessage.error('简历 ID 丢失,请重新上传简历')
    return
  }

  downloading.value = true
  try {
    const blob = await generateOptimizedFile({
      optimizedResumeId: resumeId.toString(),
      downloadFileType: 'pdf'
    })

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `optimized_resume_${resumeId}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('下载成功')
  } catch (error) {
    ElMessage.error('下载失败')
    console.error(error)
  } finally {
    downloading.value = false
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
  position: relative;

  .header-back {
    position: absolute;
    left: 0;
    top: 0;
    
    .back-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.95rem;
      color: var(--text-secondary);
      transition: all 0.3s ease;
      
      &:hover {
        color: var(--primary-color);
        transform: translateX(-4px);
      }
      
      .el-icon {
        font-size: 1rem;
      }
    }
  }

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

  // 简历预览样式
  :deep(.resume-preview) {
    h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 0.5rem;
    }

    h3 {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-main);
      margin-top: 1.5rem;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #e2e8f0;
    }

    .date {
      color: var(--text-secondary);
      font-size: 0.9rem;
      font-style: italic;
    }

    .exp-item,
    .proj-item,
    .edu-item,
    .skill-item {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: #fafbfc;
      border-radius: 8px;
      border-left: 3px solid #e2e8f0;
      transition: all 0.3s ease;

      &:hover {
        background: #f1f5f9;
        border-left-color: var(--primary-color);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }
    }

    .skill-level {
      display: inline-block;
      padding: 2px 8px;
      background: #e0f2fe;
      color: #0369a1;
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    // 亮点样式
    .highlights-section {
      margin-top: 0.8rem;
      padding: 0.8rem;
      background: linear-gradient(135deg, #fff7ed 0%, #ffffff 100%);
      border-radius: 6px;
      border: 1px solid #fed7aa;
    }

    .highlights-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #ea580c;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .highlights-list {
      list-style: none;
      padding: 0;
      margin: 0;

      .highlight-item {
        position: relative;
        padding-left: 1.2rem;
        margin-bottom: 0.5rem;
        line-height: 1.6;
        color: var(--text-main);
        font-size: 0.9rem;

        &:before {
          content: '◆';
          position: absolute;
          left: 0;
          color: #fb923c;
          font-size: 0.8rem;
        }

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
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

.process-status-container {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;

  .status-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;

    .status-message {
      font-weight: 500;
      color: var(--text-main);
    }
  }

  .live-feedback {
    background: rgba(255, 255, 255, 0.6);
    padding: 10px;
    border-radius: 6px;
    font-size: 0.9rem;

    .feedback-label {
      font-weight: 600;
      color: var(--primary-color);
      margin-bottom: 4px;
    }

    .feedback-content {
      color: var(--text-regular);
      line-height: 1.5;
    }
  }
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
    font-size: 1.2rem;
    margin-bottom: 25px;
    color: var(--text-main);
    font-weight: 600;
  }
  
  .suggestion-structured-content {
    margin-bottom: 30px;
  }
  
  .suggestion-section {
    margin-bottom: 25px;
    border-radius: 10px;
    padding: 20px;
    background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
    border-left: 4px solid #cbd5e1;
    transition: all 0.3s ease;
    
    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      transform: translateY(-2px);
    }
    
    &.advantage-section {
      border-left-color: #67c23a;
      background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%);
    }
    
    &.weakness-section {
      border-left-color: #e6a23c;
      background: linear-gradient(135deg, #fffbf0 0%, #ffffff 100%);
    }
    
    &.improvement-section {
      border-left-color: #409eff;
      background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%);
    }
    
    .section-header {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
      
      .section-icon {
        font-size: 1.3rem;
        margin-right: 10px;
      }
      
      .section-title {
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-main);
        margin: 0;
      }
    }
  }
  
  .suggestion-list {
    list-style: none;
    padding: 0;
    margin: 0;
    
    .suggestion-item {
      display: flex;
      align-items: flex-start;
      padding: 12px 15px;
      margin-bottom: 10px;
      border-radius: 8px;
      background-color: #ffffff;
      border: 1px solid #e8eaed;
      transition: all 0.2s ease;
      
      &:hover {
        border-color: #cbd5e1;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      }
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .item-number {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 24px;
        height: 24px;
        border-radius: 50%;
        font-size: 0.85rem;
        font-weight: 600;
        margin-right: 12px;
        flex-shrink: 0;
      }
      
      .item-text {
        flex: 1;
        font-size: 0.92rem;
        line-height: 1.7;
        color: var(--text-main);
      }
      
      &.success-item .item-number {
        background-color: #f0f9ff;
        color: #67c23a;
        border: 1px solid #b3e19d;
      }
      
      &.warning-item .item-number {
        background-color: #fef9f0;
        color: #e6a23c;
        border: 1px solid #f3d19e;
      }
      
      &.primary-item .item-number {
        background-color: #ecf5ff;
        color: #409eff;
        border: 1px solid #a0cfff;
      }
    }
  }
  
  .suggestion-text-fallback {
    margin-bottom: 30px;
    
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
  }
  
  .history-section {
    margin-top: 35px;
    padding-top: 25px;
    border-top: 2px solid var(--border-color);
  }
  
  .history-section-title {
    font-size: 1.1rem;
    margin-bottom: 20px;
    color: var(--text-main);
    font-weight: 600;
  }
  
  .history-item {
    border: 1px solid #e8eaed;
    border-radius: 10px;
    padding: 18px;
    margin-bottom: 15px;
    background: linear-gradient(135deg, #fafbfc 0%, #ffffff 100%);
    transition: all 0.3s ease;
    
    &:hover {
      border-color: #409eff;
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
      transform: translateX(5px);
    }
    
    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      
      .history-left {
        display: flex;
        align-items: center;
        gap: 10px;
        
        .history-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #ffffff;
          font-weight: 600;
          font-size: 0.85rem;
          box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
        }
        
        .history-label {
          font-weight: 600;
          color: var(--text-main);
          font-size: 0.95rem;
        }
      }
    }
    
    .history-feedback {
      font-size: 0.9rem;
      color: var(--text-regular);
      line-height: 1.7;
      padding: 12px 15px;
      background-color: #f8fafc;
      border-radius: 6px;
      border-left: 3px solid #cbd5e1;
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