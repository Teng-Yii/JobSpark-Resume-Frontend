<template>
  <div class="page-container">
    <div class="content-wrapper fade-in">
      <div class="page-header">
        <h1 class="page-title">上传简历</h1>
        <p class="page-subtitle">上传您的 PDF 或 DOCX 格式简历进行解析</p>
      </div>
      
      <div class="upload-card card-shadow">
        <div class="upload-area-wrapper">
          <el-upload
            class="upload-dragger-custom"
            drag
            action="#"
            :auto-upload="false"
            :limit="1"
            :on-change="handleFileChange"
            :show-file-list="false"
            accept=".pdf,.docx"
          >
            <div class="upload-placeholder">
              <el-icon class="upload-icon" :class="{ 'has-file': selectedFile }">
                <component :is="selectedFile ? 'DocumentChecked' : 'UploadFilled'" />
              </el-icon>
              
              <div class="upload-text" v-if="!selectedFile">
                <h3>点击或拖拽文件到此处上传</h3>
                <p>支持 PDF / DOCX 格式 (最大 5MB)</p>
              </div>
              
              <div class="file-info" v-else>
                <div class="file-details">
                  <span class="file-name">{{ selectedFile.name }}</span>
                  <span class="file-size">{{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</span>
                </div>
                <div class="file-status">文件已就绪</div>
              </div>
            </div>
          </el-upload>
        </div>
        
        <!-- Progress Bar -->
        <div v-if="uploadStatus !== 'IDLE'" class="progress-section">
          <div class="progress-info">
            <span class="status-text">系统状态: {{ statusText }}</span>
            <span class="progress-text">{{ Math.floor(progress) }}%</span>
          </div>
          <el-progress
            :percentage="Number(progress.toFixed(1))"
            :status="progressStatus"
            :stroke-width="8"
            :show-text="false"
          />
        </div>

        <div class="card-footer">
          <el-button
            v-if="uploadStatus !== 'COMPLETED'"
            type="primary"
            size="large"
            @click="handleUpload"
            :loading="loading"
            :disabled="!selectedFile || uploadStatus === 'PROCESSING'"
            class="action-button"
          >
            {{ uploadStatus === 'FAILED' ? '重新上传' : '开始智能解析' }}
          </el-button>
          
          <el-button
            v-else
            type="success"
            size="large"
            @click="router.push('/resume/optimize')"
            class="action-button"
          >
            开始智能优化
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { UploadFilled, DocumentChecked } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { uploadResume, getTaskStatus } from '@/api/resume'
import { useResumeStore } from '@/stores/resume'

const router = useRouter()
const resumeStore = useResumeStore()

const selectedFile = ref<File | null>(null)
const loading = ref(false)
const progress = ref(0)
const targetProgress = ref(0) // 目标进度（后端返回的最新有效进度）
const uploadStatus = ref<'IDLE' | 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'>('IDLE')
const currentStatusMessage = ref('')
let pollingTimer: ReturnType<typeof setInterval> | null = null
let animationFrameId: number | null = null

const statusText = computed(() => {
  if (uploadStatus.value === 'PROCESSING' && currentStatusMessage.value) {
    return currentStatusMessage.value
  }
  switch (uploadStatus.value) {
    case 'UPLOADING': return '正在上传...'
    case 'PROCESSING': return '正在智能解析...'
    case 'COMPLETED': return '解析完成'
    case 'FAILED': return '上传失败'
    default: return ''
  }
})

const progressStatus = computed(() => {
  if (uploadStatus.value === 'COMPLETED') return 'success'
  if (uploadStatus.value === 'FAILED') return 'exception'
  return ''
})

const handleFileChange = (uploadFile: UploadFile) => {
  if (uploadFile.raw) {
    const isLimit = uploadFile.raw.size / 1024 / 1024 < 5
    const fileName = uploadFile.name.toLowerCase()
    const isExt = fileName.endsWith('.pdf') || fileName.endsWith('.docx')

    if (!isExt) {
      ElMessage.error('格式无效，仅支持 PDF 或 DOCX。')
      selectedFile.value = null
      return
    }
    if (!isLimit) {
      ElMessage.error('文件过大，最大支持 5MB。')
      selectedFile.value = null
      return
    }
    selectedFile.value = uploadFile.raw
    if (uploadStatus.value === 'FAILED' || uploadStatus.value === 'COMPLETED') {
        uploadStatus.value = 'IDLE'
        progress.value = 0
        targetProgress.value = 0
        if (animationFrameId) cancelAnimationFrame(animationFrameId)
        currentStatusMessage.value = ''
    }
  }
}

// 启动平滑进度动画
const startProgressAnimation = () => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  
  const animate = () => {
    // 如果已完成，快速逼近 100%
    if (uploadStatus.value === 'COMPLETED') {
      if (progress.value < 100) {
        const step = (100 - progress.value) * 0.2
        progress.value += Math.max(step, 0.5) // 最小增量确保能到达
        if (progress.value > 99.5) progress.value = 100
      }
    } else if (uploadStatus.value === 'PROCESSING' || uploadStatus.value === 'UPLOADING') {
      // 1. 追赶后端返回的目标进度 (Catch up)
      if (progress.value < targetProgress.value) {
        const dist = targetProgress.value - progress.value
        const speed = Math.max(dist * 0.05, 0.1) // 调整速度系数，使其更平滑
        progress.value = Math.min(progress.value + speed, targetProgress.value)
      }
      // 2. 伪进度 (Pseudo progress): 如果当前已达到目标，但还没完成，缓慢增加给用户反馈
      // 增加到 99% 的阈值，给予用户持续的反馈，但速度极慢
      else if (progress.value < 99) {
        progress.value += 0.01 // 约每秒增加 0.6% (60fps)，非常缓慢
      }
    }
    
    // 边界检查，非完成状态下不超过 99%
    if (uploadStatus.value !== 'COMPLETED' && progress.value >= 99) {
      progress.value = 99
    }

    if (uploadStatus.value !== 'FAILED' && (uploadStatus.value !== 'COMPLETED' || progress.value < 100)) {
      animationFrameId = requestAnimationFrame(animate)
    }
  }
  
  animationFrameId = requestAnimationFrame(animate)
}

const pollTaskStatus = async (taskId: string) => {
  if (pollingTimer) clearInterval(pollingTimer)
  
  pollingTimer = setInterval(async () => {
    try {
      const res = await getTaskStatus(taskId)
      const status = res.status

      // 实时更新进度和状态消息
      if (typeof res.progress === 'number') {
        // 单调性保证：只取较大值，避免进度回退
        // 只有当新进度大于当前目标进度时才更新
        if (res.progress > targetProgress.value) {
            targetProgress.value = res.progress
        }
      }
      
      if (res.statusMessage) {
        currentStatusMessage.value = res.statusMessage
      }
      
      if (status === 'COMPLETED') {
        if (pollingTimer) clearInterval(pollingTimer)
        uploadStatus.value = 'COMPLETED'
        targetProgress.value = 100 // 确保目标进度设为 100
        loading.value = false
        
        if (res.resumeId) {
            resumeStore.setResumeId(String(res.resumeId))
            ElMessage.success('解析成功')
        } else {
             ElMessage.warning('解析完成但 ID 丢失')
        }
      } else if (status === 'FAILED') {
        if (pollingTimer) clearInterval(pollingTimer)
        uploadStatus.value = 'FAILED'
        ElMessage.error(res.errorMessage || '解析失败')
        loading.value = false
      } else {
        // 其他状态（ANALYZING, PENDING, PROCESSING 等）继续轮询
        // 只要不是完成或失败，都视为处理中
        uploadStatus.value = 'PROCESSING'
      }
    } catch (error) {
      console.error('Polling error', error)
    }
  }, 2000)
}

const handleUpload = async () => {
  if (!selectedFile.value) return
  
  loading.value = true
  progress.value = 0
  targetProgress.value = 0
  currentStatusMessage.value = ''
  uploadStatus.value = 'UPLOADING'
  startProgressAnimation() // 启动动画循环
  
  const formData = new FormData()
  formData.append('file', selectedFile.value)
  
  try {
    const res = await uploadResume(formData)
    
    // 根据 success 字段判断接口是否成功
    if (!res.success) {
      // 接口返回失败
      // 停止进度动画
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = null
      }
      // 重置状态
      uploadStatus.value = 'IDLE'
      progress.value = 0
      targetProgress.value = 0
      currentStatusMessage.value = ''
      loading.value = false
      
      // 显示后端返回的错误信息
      const errorMessage = res.errorMessage || res.message || '上传失败，请重试。'
      ElMessage.error(errorMessage)
      return
    }
    
    // 接口返回成功
    if (res.taskId) {
        uploadStatus.value = 'PROCESSING'
        pollTaskStatus(res.taskId)
    } else {
        // 如果后端直接返回成功（同步处理），但这种情况不太可能
        uploadStatus.value = 'COMPLETED'
        targetProgress.value = 100
        progress.value = 100
        loading.value = false
        ElMessage.success('上传成功')
    }
  } catch (error: any) {
    console.error(error)
    // 停止进度动画
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
    // 重置状态
    uploadStatus.value = 'IDLE'
    progress.value = 0
    targetProgress.value = 0
    currentStatusMessage.value = ''
    loading.value = false
    
    // 显示错误信息（网络错误或其他异常）
    const errorMessage = error?.response?.data?.errorMessage || error?.response?.data?.message || error?.message || '上传失败，请重试。'
    ElMessage.error(errorMessage)
  }
}

onUnmounted(() => {
  if (pollingTimer) clearInterval(pollingTimer)
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
})
</script>

<style scoped lang="scss">
.page-container {
  min-height: 100vh;
  background-color: var(--bg-color);
  padding: 40px 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.content-wrapper {
  width: 100%;
  max-width: 800px;
  margin-top: 40px;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
  
  .page-title {
    font-size: 2rem;
    color: var(--text-main);
    margin-bottom: 10px;
  }
  
  .page-subtitle {
    color: var(--text-secondary);
    font-size: 1.1rem;
  }
}

.upload-card {
  background: #fff;
  padding: 40px;
}

.upload-area-wrapper {
  margin-bottom: 30px;
  
  :deep(.el-upload) {
    width: 100%;
    
    .el-upload-dragger {
      width: 100%;
      height: 280px;
      border: 2px dashed var(--border-color);
      border-radius: 12px;
      background-color: #fafafa;
      transition: all 0.3s ease;
      display: flex;
      justify-content: center;
      align-items: center;
      
      &:hover, &.is-dragover {
        border-color: var(--primary-color);
        background-color: rgba(74, 108, 247, 0.02);
        
        .upload-icon {
          color: var(--primary-color);
          transform: translateY(-5px);
        }
      }
    }
  }
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  
  .upload-icon {
    font-size: 64px;
    color: #cbd5e1;
    margin-bottom: 20px;
    transition: all 0.3s ease;
    
    &.has-file {
      color: var(--secondary-color);
    }
  }
  
  .upload-text {
    h3 {
      font-size: 1.1rem;
      color: var(--text-main);
      margin-bottom: 8px;
      font-weight: 600;
    }
    
    p {
      color: var(--text-secondary);
      font-size: 0.9rem;
    }
  }
  
  .file-info {
    text-align: center;
    
    .file-details {
      margin-bottom: 8px;
    }
    
    .file-name {
      font-weight: 600;
      color: var(--text-main);
      margin-right: 10px;
      font-size: 1.1rem;
    }
    
    .file-size {
      color: var(--text-secondary);
      font-size: 0.9rem;
      background: #f1f5f9;
      padding: 2px 8px;
      border-radius: 4px;
    }
    
    .file-status {
      color: var(--secondary-color);
      font-weight: 500;
    }
  }
}

.progress-section {
  margin-bottom: 30px;
  background: #f8fafc;
  padding: 20px;
  border-radius: 8px;
  
  .progress-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    font-size: 0.9rem;
    font-weight: 500;
    
    .status-text {
      color: var(--text-main);
    }
    
    .progress-text {
      color: var(--primary-color);
    }
  }
}

.card-footer {
  display: flex;
  justify-content: center;
  
  .action-button {
    min-width: 200px;
    font-weight: 600;
  }
}
</style>