<template>
  <div class="page-container">
    <div class="content-wrapper fade-in">
      <div class="page-header">
        <h1 class="page-title">优秀简历模板录入</h1>
        <p class="page-subtitle">上传高质量简历模板，丰富向量数据库以优化用户体验</p>
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
                <h3>点击或拖拽模板文件到此处上传</h3>
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
            :disabled="!selectedFile || uploadStatus === 'PROCESSING' || uploadStatus === 'STORING'"
            class="action-button"
          >
            {{ uploadStatus === 'FAILED' ? '重新上传' : '开始录入模板' }}
          </el-button>
          
          <el-button
            v-else
            type="success"
            size="large"
            @click="resetUpload"
            class="action-button"
          >
            继续录入下一个
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { UploadFilled, DocumentChecked } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { uploadResume, getTaskStatus, storeEmbedding } from '@/api/resume'

const selectedFile = ref<File | null>(null)
const loading = ref(false)
const progress = ref(0)
const targetProgress = ref(0) // 目标进度（后端返回的最新有效进度）
const uploadStatus = ref<'IDLE' | 'UPLOADING' | 'PROCESSING' | 'STORING' | 'COMPLETED' | 'FAILED'>('IDLE')
const currentStatusMessage = ref('')
let pollingTimer: ReturnType<typeof setInterval> | null = null
let animationFrameId: number | null = null

const statusText = computed(() => {
  if ((uploadStatus.value === 'PROCESSING' || uploadStatus.value === 'STORING') && currentStatusMessage.value) {
    return currentStatusMessage.value
  }
  switch (uploadStatus.value) {
    case 'UPLOADING': return '正在上传...'
    case 'PROCESSING': return '正在解析内容...'
    case 'STORING': return '正在存入向量数据库...'
    case 'COMPLETED': return '模板录入成功'
    case 'FAILED': return '录入失败'
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
        resetState()
    }
  }
}

const resetState = () => {
    uploadStatus.value = 'IDLE'
    progress.value = 0
    targetProgress.value = 0
    if (animationFrameId) cancelAnimationFrame(animationFrameId)
    if (pollingTimer) clearInterval(pollingTimer)
    currentStatusMessage.value = ''
    loading.value = false
}

const resetUpload = () => {
    selectedFile.value = null
    resetState()
}

// 缓动动画函数
const updateProgress = () => {
  if (progress.value < targetProgress.value) {
    const diff = targetProgress.value - progress.value
    const step = Math.max(diff * 0.1, 0.1) // 动态步长，接近目标时减速
    progress.value = Math.min(progress.value + step, targetProgress.value)
    
    if (progress.value < targetProgress.value) {
      animationFrameId = requestAnimationFrame(updateProgress)
    }
  }
}

const handleUpload = async () => {
  if (!selectedFile.value) return

  loading.value = true
  uploadStatus.value = 'UPLOADING'
  progress.value = 0
  targetProgress.value = 0
  
  const formData = new FormData()
  formData.append('file', selectedFile.value)

  try {
    const response = await uploadResume(formData)
    
    if (response.success && response.taskId) {
      targetProgress.value = 20 // 上传完成，设置进度为20%
      updateProgress()
      uploadStatus.value = 'PROCESSING'
      pollStatus(response.taskId)
    } else {
      throw new Error(response.message || '上传失败')
    }
  } catch (error: any) {
    console.error('Upload error:', error)
    uploadStatus.value = 'FAILED'
    ElMessage.error(error.message || '上传失败，请重试')
    loading.value = false
  }
}

const pollStatus = (taskId: string) => {
  pollingTimer = setInterval(async () => {
    try {
      const res = await getTaskStatus(taskId)
      
      // 更新进度条（直接使用后端进度 0-100）
      if (res.progress > 0) {
          // 保持至少20%（上传完成时的进度），避免进度倒退
          targetProgress.value = Math.max(targetProgress.value, res.progress)
          updateProgress()
      }

      if (res.status === 'COMPLETED' && res.resumeId) {
        if (pollingTimer) clearInterval(pollingTimer)
        targetProgress.value = 100
        updateProgress()
        
        // 解析完成，开始存入向量库
        await handleStoreEmbedding(res.resumeId)
      } else if (res.status === 'FAILED') {
        if (pollingTimer) clearInterval(pollingTimer)
        uploadStatus.value = 'FAILED'
        ElMessage.error(res.errorMessage || '解析失败')
        loading.value = false
      }
    } catch (error) {
      console.error('Polling error:', error)
      // 轮询出错不立即终止，可能是网络波动
    }
  }, 1000)
}

const handleStoreEmbedding = async (resumeId: string) => {
    uploadStatus.value = 'STORING'
    currentStatusMessage.value = '正在存入向量数据库...'
    try {
        const res = await storeEmbedding(resumeId)
        // 兼容 boolean 直接返回 true，或者对象返回 success: true
        const isSuccess = typeof res === 'boolean' ? res : (res && res.success)
        
        if (isSuccess) {
            uploadStatus.value = 'COMPLETED'
            ElMessage.success('优秀简历模板录入成功！')
        } else {
            // 兼容 res 为 false，或者对象返回 message
            const errorMsg = (typeof res === 'object' && res?.message) ? res.message : '向量存储失败'
            throw new Error(errorMsg)
        }
    } catch (error: any) {
        console.error('Embedding error:', error)
        uploadStatus.value = 'FAILED'
        ElMessage.error(error.message || '录入失败：向量存储错误')
    } finally {
        loading.value = false
    }
}

onUnmounted(() => {
  if (pollingTimer) clearInterval(pollingTimer)
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
})
</script>

<style scoped lang="scss">
.page-container {
  min-height: calc(100vh - 64px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  background-color: var(--bg-color);
}

.content-wrapper {
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.page-header {
  text-align: center;
  
  .page-title {
    font-size: 32px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 12px;
    letter-spacing: -0.5px;
  }
  
  .page-subtitle {
    font-size: 16px;
    color: var(--text-secondary);
    font-weight: 400;
  }
}

.upload-card {
  background: white;
  border-radius: 24px;
  padding: 40px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  }
}

.upload-area-wrapper {
  margin-bottom: 32px;
}

.upload-dragger-custom {
  :deep(.el-upload-dragger) {
    width: 100%;
    height: 320px;
    border: 2px dashed var(--border-color);
    border-radius: 16px;
    background-color: var(--bg-color-light);
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    
    &:hover, &.is-dragover {
      border-color: var(--primary-color);
      background-color: rgba(37, 99, 235, 0.04);
      
      .upload-icon {
        color: var(--primary-color);
        transform: scale(1.1);
      }
    }
  }
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.upload-icon {
  font-size: 64px;
  color: var(--text-secondary);
  transition: all 0.3s ease;
  
  &.has-file {
    color: var(--success-color);
  }
}

.upload-text {
  text-align: center;
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 8px;
  }
  
  p {
    font-size: 14px;
    color: var(--text-secondary);
  }
}

.file-info {
  text-align: center;
  
  .file-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 8px;
    
    .file-name {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .file-size {
      font-size: 14px;
      color: var(--text-secondary);
    }
  }
  
  .file-status {
    font-size: 14px;
    color: var(--success-color);
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    
    &::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: currentColor;
    }
  }
}

.progress-section {
  margin-top: 24px;
  padding: 0 12px;
  
  .progress-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 14px;
    
    .status-text {
      color: var(--text-primary);
      font-weight: 500;
    }
    
    .progress-text {
      color: var(--text-secondary);
    }
  }
}

.card-footer {
  margin-top: 32px;
  display: flex;
  justify-content: center;
  
  .action-button {
    min-width: 200px;
    height: 48px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 12px;
    transition: all 0.2s ease;
    
    &:not(:disabled):hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
    }
  }
}

/* Animations */
.fade-in {
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>