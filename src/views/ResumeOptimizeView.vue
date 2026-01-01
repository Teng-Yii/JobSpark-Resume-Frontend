<template>
  <div class="resume-optimize-container">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="resume-preview-card">
          <template #header>
            <div class="card-header">
              <span>简历预览</span>
            </div>
          </template>
          <div class="resume-content">
            <!-- 简历内容展示区域 -->
            <el-skeleton :rows="10" animated v-if="loading" />
            <div v-else class="content-text" v-html="resumeContent"></div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="optimize-control-card">
          <template #header>
            <div class="card-header">
              <span>简历优化</span>
            </div>
          </template>
          
          <el-form label-position="top">
            <el-form-item label="目标职位描述 (JD)">
              <el-input
                v-model="jobDescription"
                type="textarea"
                :rows="6"
                placeholder="请粘贴目标职位的详细描述，以便进行针对性优化..."
              />
            </el-form-item>
            
            <el-button type="primary" @click="handleOptimize" :loading="optimizing" class="optimize-btn">
              开始智能优化
            </el-button>
          </el-form>

          <el-divider v-if="optimizationResult">优化建议</el-divider>

          <div v-if="optimizationResult" class="optimization-result">
            <div class="score-section">
               <span>简历评分: </span>
               <el-rate
                v-model="optimizationResult.score"
                disabled
                show-score
                text-color="#ff9900"
                score-template="{value} 分"
                :max="100"
                :low-threshold="60"
                :high-threshold="80"
              />
            </div>
            
            <div class="suggestions-list">
              <el-collapse>
                <el-collapse-item 
                  v-for="item in optimizationResult.suggestions" 
                  :key="item.id" 
                  :title="item.type + ' - ' + item.reason"
                >
                  <div class="suggestion-detail">
                    <p class="original"><strong>原文:</strong> {{ item.originalText }}</p>
                    <p class="optimized"><strong>建议修改:</strong> {{ item.optimizedText }}</p>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
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
const resumeContent = ref('<p>暂无简历内容</p>')
const jobDescription = ref('')
const optimizationResult = ref<ResumeOptimizedResponse | null>(null)

onMounted(() => {
  // 检查是否有 resumeId
  if (!resumeStore.currentResumeId) {
    ElMessage.warning('请先上传简历')
    router.push('/resume/upload')
    return
  }
  
  // 如果有内容则展示
  if (resumeStore.currentResumeContent) {
    // 简单的 HTML 格式化或者直接展示文本
    // 这里假设内容是纯文本，简单处理换行
    resumeContent.value = resumeStore.currentResumeContent.replace(/\n/g, '<br/>')
  } else {
    // 如果没有内容，可能需要根据 resumeId 去获取详情接口（如果有的话）
    // 这里暂时显示提示
    resumeContent.value = '<p>简历解析完成，内容准备就绪。</p>'
  }
})

const handleOptimize = async () => {
  if (!jobDescription.value) {
    ElMessage.warning('请输入目标职位描述')
    return
  }
  
  if (!resumeStore.currentResumeId) {
     ElMessage.error('简历ID丢失，请重新上传')
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
    ElMessage.error('优化失败，请稍后重试')
  } finally {
    optimizing.value = false
  }
}
</script>

<style scoped lang="scss">
.resume-optimize-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);

  .resume-preview-card, .optimize-control-card {
    height: 100%;
    min-height: 600px;
  }

  .resume-content {
    padding: 10px;
    background: #fff;
    min-height: 500px;
    border: 1px solid #eee;
    overflow-y: auto;
    max-height: 700px;
  }

  .optimize-btn {
    width: 100%;
    margin-top: 10px;
  }

  .optimization-result {
    margin-top: 20px;

    .score-section {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
      font-size: 16px;
      font-weight: bold;
      
      span {
        margin-right: 10px;
      }
    }

    .suggestion-detail {
      .original {
        color: #909399;
        text-decoration: line-through;
        margin-bottom: 5px;
      }
      .optimized {
        color: #67c23a;
        font-weight: bold;
      }
    }
  }
}
</style>