<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { DocumentAdd, DataLine, SwitchButton, Star } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const showContent = ref(false)

onMounted(() => {
  setTimeout(() => {
    showContent.value = true
  }, 100)
})

const navigateTo = (path: string) => {
  router.push(path)
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要登出当前账户吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  } catch (error) {
    // 用户取消登出
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}
</script>

<template>
  <div class="home-container">
    <div class="content-wrapper" :class="{ 'show': showContent }">
      <header class="dashboard-header">
        <div class="header-content">
          <div class="header-left">
            <h1 class="main-title">JobSpark 智能简历平台</h1>
            <p class="sub-title">高效管理和优化您的职业资产</p>
          </div>
          <div class="header-right">
            <div class="user-info" v-if="userStore.userInfo">
              <span class="username">{{ userStore.userInfo.username }}</span>
              <el-button
                type="danger"
                :icon="SwitchButton"
                @click="handleLogout"
                plain
              >
                登出
              </el-button>
            </div>
          </div>
        </div>
      </header>
      
      <div class="cards-grid">
        <!-- 上传简历卡片 -->
        <div class="dashboard-card" @click="navigateTo('/resume/upload')">
          <div class="icon-box primary">
            <el-icon><DocumentAdd /></el-icon>
          </div>
          <div class="card-content">
            <h3 class="card-title">上传简历</h3>
            <p class="card-desc">快速上传并智能解析您的简历</p>
            <div class="card-action">
              <span>开始上传</span>
              <span class="arrow">→</span>
            </div>
          </div>
        </div>
        
        <!-- 简历优化卡片 -->
        <div class="dashboard-card" @click="navigateTo('/resume/optimize')">
          <div class="icon-box success">
            <el-icon><DataLine /></el-icon>
          </div>
          <div class="card-content">
            <h3 class="card-title">简历优化</h3>
            <p class="card-desc">AI 驱动的简历深度优化</p>
            <div class="card-action">
              <span>开始优化</span>
              <span class="arrow">→</span>
            </div>
          </div>
        </div>
        
        <!-- 优秀简历模板录入卡片 -->
        <div class="dashboard-card" @click="navigateTo('/excellent-resume')">
          <div class="icon-box warning">
            <el-icon><Star /></el-icon>
          </div>
          <div class="card-content">
            <h3 class="card-title">优秀模板录入</h3>
            <p class="card-desc">上传高质量简历模板，充实向量数据库</p>
            <div class="card-action">
              <span>开始录入</span>
              <span class="arrow">→</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.home-container {
  min-height: 100vh;
  background-color: var(--bg-color);
  padding: 40px 20px;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.6s ease-out;
  
  &.show {
    opacity: 1;
    transform: translateY(0);
  }
}

.dashboard-header {
  margin-bottom: 60px;
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    
    @media (max-width: 768px) {
      flex-direction: column;
      gap: 20px;
    }
  }
  
  .header-left {
    flex: 1;
  }
  
  .main-title {
    font-size: 2.5rem;
    color: var(--text-main);
    margin-bottom: 10px;
    
    @media (max-width: 768px) {
      font-size: 2rem;
    }
  }
  
  .sub-title {
    font-size: 1.1rem;
    color: var(--text-secondary);
    font-weight: 400;
  }
  
  .header-right {
    display: flex;
    align-items: center;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .username {
      font-size: 1rem;
      color: var(--text-main);
      font-weight: 500;
    }
  }
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.dashboard-card {
  background: #fff;
  border-radius: 12px;
  padding: 30px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
  display: flex;
  align-items: flex-start;
  gap: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    border-color: var(--primary-color);
    
    .card-action {
      color: var(--primary-color);
      .arrow {
        transform: translateX(5px);
      }
    }
  }
  
  .icon-box {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 24px;
    flex-shrink: 0;
    
    &.primary {
      background-color: rgba(74, 108, 247, 0.1);
      color: var(--primary-color);
    }
    
    &.success {
      background-color: rgba(106, 153, 78, 0.1);
      color: var(--secondary-color);
    }
    
    &.warning {
      background-color: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
    }
  }
  
  .card-content {
    flex: 1;
  }
  
  .card-title {
    font-size: 1.25rem;
    margin-bottom: 8px;
    color: var(--text-main);
  }
  
  .card-desc {
    font-size: 0.95rem;
    color: var(--text-regular);
    line-height: 1.5;
    margin-bottom: 20px;
  }
  
  .card-action {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 5px;
    transition: color 0.3s ease;
    
    .arrow {
      transition: transform 0.3s ease;
    }
  }
}
</style>