<template>
  <div class="resume-upload-container">
    <el-card class="upload-card">
      <template #header>
        <div class="card-header">
          <span>上传简历</span>
        </div>
      </template>
      <div class="upload-content">
        <el-upload
          class="upload-dragger"
          drag
          action="#"
          :auto-upload="false"
          :limit="1"
          :on-change="handleFileChange"
          accept=".pdf,.docx"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            拖拽文件到此处或 <em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              只能上传 pdf/docx 文件，且不超过 5MB
            </div>
          </template>
        </el-upload>
        
        <div v-if="uploadStatus !== 'IDLE'" class="status-container">
          <el-progress 
            :percentage="progress" 
            :status="progressStatus"
          />
          <p class="status-text">{{ statusText }}</p>
        </div>

        <div class="actions">
          <el-button type="primary" @click="handleUpload" :loading="loading" :disabled="!selectedFile">
            开始解析
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { uploadResume, getTaskStatus } from '@/api/resume'
import { useResumeStore } from '@/stores/resume'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const resumeStore = useResumeStore()
const userStore = useUserStore()

const selectedFile = ref<File | null>(null)
const loading = ref(false)
const progress = ref(0)
const uploadStatus = ref<'IDLE' | 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'>('IDLE')
let pollingTimer: ReturnType<typeof setInterval> | null = null

const statusText = computed(() => {
  switch (uploadStatus.value) {
    case 'UPLOADING': return '正在上传...'
    case 'PROCESSING': return '正在智能解析简历内容...'
    case 'COMPLETED': return '解析完成！正在跳转...'
    case 'FAILED': return '处理失败，请重试'
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
    // 简单的类型检查，实际可能需要根据后缀
    const fileName = uploadFile.name.toLowerCase()
    const isExt = fileName.endsWith('.pdf') || fileName.endsWith('.docx')

    if (!isExt) {
      ElMessage.error('上传文件只能是 PDF 或 DOCX 格式!')
      selectedFile.value = null
      return
    }
    if (!isLimit) {
      ElMessage.error('上传文件大小不能超过 5MB!')
      selectedFile.value = null
      return
    }
    selectedFile.value = uploadFile.raw
  }
}

const pollTaskStatus = async (taskId: string) => {
  pollingTimer = setInterval(async () => {
    try {
      const res = await getTaskStatus(taskId)
      const status = res.status
      
      if (status === 'PROCESSING') {
        uploadStatus.value = 'PROCESSING'
        // 模拟进度增加，实际可能后端返回
        if (progress.value < 90) {
          progress.value += 5
        }
      } else if (status === 'COMPLETED') {
        if (pollingTimer) clearInterval(pollingTimer)
        uploadStatus.value = 'COMPLETED'
        progress.value = 100
        
        // 保存 resumeId 并跳转
        if (res.result && res.result.resumeId) {
            resumeStore.setResumeId(res.result.resumeId)
            // 如果有解析内容也可以保存
            if (res.result.content) {
               resumeStore.setResumeContent(res.result.content)
            }
            ElMessage.success('简历解析成功')
            setTimeout(() => {
              router.push('/resume/optimize')
            }, 1000)
        } else {
             // 兜底，如果没有返回 resumeId，可能需要重新获取或报错
             // 这里假设一定有
             ElMessage.warning('解析完成但未获取到简历ID')
        }
      } else if (status === 'FAILED') {
        if (pollingTimer) clearInterval(pollingTimer)
        uploadStatus.value = 'FAILED'
        ElMessage.error(res.error || '解析失败')
        loading.value = false
      }
    } catch (error) {
      console.error('Polling error', error)
      // 轮询出错不一定要立刻停止，可以容错几次，这里简单处理
    }
  }, 2000)
}

const handleUpload = async () => {
  if (!selectedFile.value) return
  
  loading.value = true
  progress.value = 0
  uploadStatus.value = 'UPLOADING'
  
  const formData = new FormData()
  formData.append('file', selectedFile.value)
  // 如果需要 userMessage 或 userId，可以从 store 获取添加
  // formData.append('userId', userStore.userId)
  
  try {
    const res = await uploadResume(formData)
    // 假设上传成功后返回 taskId
    // 如果直接返回了结果（同步处理），则直接完成
    if (res.taskId) {
        uploadStatus.value = 'PROCESSING'
        progress.value = 30
        pollTaskStatus(res.taskId)
    } else if (res.resumeId) {
        // 同步返回的情况
        uploadStatus.value = 'COMPLETED'
        progress.value = 100
        resumeStore.setResumeId(res.resumeId)
        ElMessage.success('简历上传成功')
        router.push('/resume/optimize')
    }
  } catch (error) {
    console.error(error)
    uploadStatus.value = 'FAILED'
    loading.value = false
    ElMessage.error('上传失败')
  }
}
</script>

<style scoped lang="scss">
.resume-upload-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 60px); // Adjust based on layout
  padding: 20px;
  background-color: #f5f7fa;

  .upload-card {
    width: 100%;
    max-width: 600px;
  }

  .upload-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    
    .upload-dragger {
      width: 100%;
    }
  }

  .status-container {
    width: 100%;
    text-align: center;
    margin-top: 10px;
    
    .status-text {
      margin-top: 5px;
      color: #606266;
      font-size: 14px;
    }
  }
  
  .actions {
    width: 100%;
    display: flex;
    justify-content: center;
  }
}
</style>