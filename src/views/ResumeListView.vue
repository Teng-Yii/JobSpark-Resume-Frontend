<template>
  <div class="resume-list-container">
    <div class="welcome-banner">
      <div class="welcome-content">
        <h2>欢迎回来，{{ userStore.userInfo?.username || '求职者' }}</h2>
        <p>管理您的简历，开启职业新篇章</p>
      </div>
      <div class="welcome-decoration"></div>
    </div>

    <header class="header">
      <h1 class="page-title">我的简历</h1>
      <el-button type="primary" size="large" @click="handleUpload" class="upload-btn">
        <el-icon class="el-icon--left"><Plus /></el-icon>
        上传新简历
      </el-button>
      <el-button type="danger" plain size="large" @click="handleLogout" class="logout-btn" style="margin-left: 12px">
        <el-icon class="el-icon--left"><SwitchButton /></el-icon>
        退出登录
      </el-button>
    </header>

    <div v-loading="loading" class="list-content">
      <div v-if="resumeList && resumeList.length > 0" class="resume-grid">
        <el-card v-for="resume in resumeList" :key="resume.resumeId" class="resume-card" shadow="hover">
          <div class="card-header">
            <div class="user-info">
              <el-avatar :size="50" :src="resume.avatarUrl || defaultAvatar" icon="UserFilled" />
              <div class="info-text">
                <h3 class="name">{{ resume.name || '未命名简历' }}</h3>
                <p class="title">{{ resume.title || '暂无求职意向' }}</p>
              </div>
            </div>
            <div class="actions">
              <el-button type="primary" plain size="small" @click="handleOptimize(resume.resumeId)">
                优化解析
              </el-button>
            </div>
          </div>
          <div class="card-content">
            <p class="summary">{{ resume.summary || '暂无个人简介...' }}</p>
            <div class="tags">
               <el-tag v-for="skill in (resume.skills || []).slice(0, 3)" :key="skill.name" size="small" class="skill-tag">
                 {{ skill.name }}
               </el-tag>
               <el-tag v-if="(resume.skills || []).length > 3" size="small" type="info" class="skill-tag">
                 +{{ resume.skills.length - 3 }}
               </el-tag>
            </div>
          </div>
        </el-card>
      </div>

      <el-empty v-else description="您还没有上传过简历" :image-size="200">
        <el-button type="primary" @click="handleUpload">立即上传</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useResumeStore } from '@/stores/resume'
import { useUserStore } from '@/stores/user'
import { Plus, UserFilled, SwitchButton } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const resumeStore = useResumeStore()
const userStore = useUserStore()
const loading = ref(false)
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

const resumeList = computed(() => resumeStore.resumeList)

const fetchResumes = async () => {
  if (!userStore.token) {
    router.push('/login')
    return
  }

  loading.value = true
  try {
    await resumeStore.fetchResumeList()
  } catch (error) {
    ElMessage.error('获取简历列表失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const handleUpload = () => {
  router.push('/resume/upload')
}

const handleLogout = () => {
  ElMessageBox.confirm(
    '确定要退出登录吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      await userStore.logout()
      ElMessage.success('已退出登录')
      router.push('/login')
    })
    .catch(() => {
      // 用户取消操作
    })
}

const handleOptimize = (resumeId: string) => {
  // 从列表中找到对应的简历详情
  const resume = resumeList.value.find(r => r.resumeId === resumeId)
  if (resume) {
    // 存储简历ID和完整的简历详情
    resumeStore.setResumeId(resumeId)
    resumeStore.setCurrentResumeDetail(resume)
  }
  router.push(`/resume/optimize?id=${resumeId}`)
}

onMounted(() => {
  fetchResumes()
})
</script>

<style scoped lang="scss">
.resume-list-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;

  .welcome-banner {
    background: linear-gradient(135deg, var(--primary-color) 0%, #3b5bdb 100%);
    border-radius: 16px;
    padding: 2rem 2.5rem;
    margin-bottom: 2.5rem;
    color: #fff;
    position: relative;
    overflow: hidden;
    box-shadow: 0 10px 20px rgba(59, 91, 219, 0.15);

    .welcome-content {
      position: relative;
      z-index: 2;

      h2 {
        font-size: 1.75rem;
        font-weight: 700;
        margin: 0 0 0.5rem 0;
      }

      p {
        font-size: 1rem;
        opacity: 0.9;
        margin: 0;
      }
    }

    .welcome-decoration {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      background-image:
        radial-gradient(circle at 90% 10%, rgba(255, 255, 255, 0.1) 0%, transparent 20%),
        radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 20%);
      z-index: 1;
    }
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;

    .page-title {
      font-size: 2rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }
  }

  .list-content {
    min-height: 400px;
  }

  .resume-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
  }

  .resume-card {
    transition: transform 0.2s, box-shadow 0.2s;
    border-radius: 12px;
    border: 1px solid var(--border-color-light);

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;

      .user-info {
        display: flex;
        align-items: center;
        gap: 1rem;

        .info-text {
          .name {
            font-size: 1.1rem;
            font-weight: 600;
            margin: 0 0 0.25rem 0;
            color: var(--text-primary);
          }
          .title {
            font-size: 0.9rem;
            color: var(--text-secondary);
            margin: 0;
          }
        }
      }
    }

    .card-content {
      .summary {
        font-size: 0.9rem;
        color: var(--text-regular);
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        margin-bottom: 1rem;
        height: 2.7em;
      }

      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
    }
  }
}
</style>