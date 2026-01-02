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
            <span class="progress-text">{{ progress }}%</span>
          </div>
          <el-progress 
            :percentage="progress" 
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
import { ref, computed } from 'vue'
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
const uploadStatus = ref<'IDLE' | 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'>('IDLE')
const currentStatusMessage = ref('')
let pollingTimer: ReturnType<typeof setInterval> | null = null

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
        currentStatusMessage.value = ''
    }
  }
}

const pollTaskStatus = async (taskId: string) => {
  if (pollingTimer) clearInterval(pollingTimer)
  
  pollingTimer = setInterval(async () => {
    try {
      const res = await getTaskStatus(taskId)
      const status = res.status

      // 实时更新进度和状态消息
      if (typeof res.progress === 'number') {
        progress.value = res.progress
      }
      if (res.statusMessage) {
        currentStatusMessage.value = res.statusMessage
      }
      
      if (status === 'COMPLETED') {
        if (pollingTimer) clearInterval(pollingTimer)
        uploadStatus.value = 'COMPLETED'
        progress.value = 100
        loading.value = false
        
        if (res.resumeId) {
            resumeStore.setResumeId(res.resumeId)
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
  currentStatusMessage.value = ''
  uploadStatus.value = 'UPLOADING'
  
  const formData = new FormData()
  formData.append('file', selectedFile.value)
  
  try {
    const res = await uploadResume(formData)
    if (res.taskId) {
        uploadStatus.value = 'PROCESSING'
        progress.value = 0
        pollTaskStatus(res.taskId)
    } else if (res.resumeId) {
        uploadStatus.value = 'COMPLETED'
        progress.value = 100
        loading.value = false
        resumeStore.setResumeId(res.resumeId)
        ElMessage.success('上传成功')
    }
  } catch (error) {
    console.error(error)
    uploadStatus.value = 'FAILED'
    loading.value = false
    ElMessage.error('上传失败，请重试。')
  }
}
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