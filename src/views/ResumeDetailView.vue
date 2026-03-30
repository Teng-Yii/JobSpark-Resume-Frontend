<template>
  <div class="page-container">
    <div class="header-section">
      <div class="header-back">
        <el-button text @click="router.push('/resume/list')" class="back-btn">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回简历列表</span>
        </el-button>
      </div>
      <h1 class="page-title">简历详情</h1>
      <p class="page-subtitle">查看完整的简历信息</p>
    </div>

    <div class="main-content">
      <el-row :gutter="24" class="full-height-row">
        <el-col :span="24" class="col-item">
          <div class="content-card card-shadow full-height">
            <div class="card-header">
              <h2 class="section-title">简历详情</h2>
            </div>

            <div class="card-body scroll-container">
              <el-skeleton :rows="10" animated v-if="loading" />
              <div v-else class="resume-preview-content" v-html="resumeContent"></div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useResumeStore } from '@/stores/resume'
import { useUserStore } from '@/stores/user'
import type { ResumeDetailResponse } from '@/api/resume'
import { getResume } from '@/api/resume'

const router = useRouter()
const route = useRoute()
const resumeStore = useResumeStore()
const userStore = useUserStore()

const loading = ref(false)
const resumeContent = ref('<div class="empty-state">No resume content loaded</div>')

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

  // 显示证书
  if (resume.certificates && resume.certificates.length > 0) {
      html += `<h3>证书与荣誉</h3>`
      resume.certificates.forEach(cert => {
          html += `<div class="cert-item">
            <p><strong>${cert.name || ''}</strong></p>
            <p class="date">${cert.date || ''}</p>
            ${cert.description ? `<p>${cert.description}</p>` : ''}
          </div>`
      })
  }

  // 显示社交链接
  if (resume.socialLinks && resume.socialLinks.length > 0) {
      html += `<h3>社交链接</h3>`
      html += `<div class="social-links">`
      resume.socialLinks.forEach(link => {
          html += `<p><a href="${link.url}" target="_blank">${link.label}</a></p>`
      })
      html += `</div>`
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
      // 从API获取简历详情
      const resume = await getResume(queryId)
      resumeStore.setCurrentResumeDetail(resume)
      resumeContent.value = formatResumeToHtml(resume)
    } catch (error) {
      ElMessage.error('获取简历详情失败，请稍后重试')
    } finally {
      loading.value = false
    }
  }
  // 2. 如果没有 URL ID，但 store 中有 currentResumeId
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
  max-width: 1200px;
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
    .skill-item,
    .cert-item {
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
    
    .social-links {
      a {
        color: var(--primary-color);
        text-decoration: none;
        
        &:hover {
          text-decoration: underline;
        }
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