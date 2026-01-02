<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const userStore = useUserStore()
const router = useRouter()

const loginFormRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于 6 位', trigger: 'blur' }
  ]
})

const handleLogin = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  
  await formEl.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await userStore.login({
          username: form.username,
          password: form.password
        })
        ElMessage.success('登录成功，欢迎回来')
        router.push('/home')
      } catch (error: any) {
        console.error(error)
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<template>
  <div class="login-container">
    <div class="login-left">
      <div class="brand-wrapper">
        <h1 class="brand-title">JobSpark 智能简历</h1>
        <p class="brand-slogan">您的职业未来，由智能简历优化开启</p>
      </div>
      <div class="brand-decoration"></div>
    </div>
    
    <div class="login-right">
      <div class="form-wrapper fade-in">
        <div class="form-header">
          <h2>欢迎回来</h2>
          <p class="subtitle">登录您的账户</p>
        </div>
        
        <el-form
          ref="loginFormRef"
          :model="form"
          :rules="rules"
          label-position="top"
          size="large"
          class="login-form"
        >
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入用户名"
              :prefix-icon="User"
            />
          </el-form-item>
          
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              :prefix-icon="Lock"
              show-password
              @keyup.enter="handleLogin(loginFormRef)"
            />
          </el-form-item>
          
          <div class="form-footer">
            <el-link type="primary" :underline="false">忘记密码？</el-link>
          </div>
          
          <el-button
            type="primary"
            :loading="loading"
            class="login-button"
            @click="handleLogin(loginFormRef)"
          >
            登 录
          </el-button>
        </el-form>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.login-container {
  display: flex;
  height: 100vh;
  width: 100%;
  background-color: #fff;
  overflow: hidden;
}

.login-left {
  flex: 1;
  background: linear-gradient(135deg, #4a6cf7 0%, #3b5bdb 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  color: #fff;
  padding: 40px;
  
  // 仅在大屏显示
  @media (max-width: 900px) {
    display: none;
  }

  .brand-wrapper {
    z-index: 10;
    text-align: center;
    max-width: 480px;
  }

  .brand-title {
    font-size: 3.5rem;
    font-weight: 700;
    letter-spacing: -1px;
    margin-bottom: 1rem;
    color: #fff;
  }

  .brand-slogan {
    font-size: 1.25rem;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.9);
    font-weight: 300;
  }

  .brand-decoration {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: 
      radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 10%),
      radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 15%);
    z-index: 1;
  }
}

.login-right {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fff;
  padding: 40px;
  
  .form-wrapper {
    width: 100%;
    max-width: 400px;
  }
}

.form-header {
  text-align: center;
  margin-bottom: 2.5rem;
  
  h2 {
    font-size: 1.875rem;
    color: var(--text-main);
    margin-bottom: 0.5rem;
  }
  
  .subtitle {
    color: var(--text-secondary);
    font-size: 0.95rem;
  }
}

.login-form {
  :deep(.el-input__wrapper) {
    box-shadow: none;
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    transition: all 0.2s ease;
    
    &.is-focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 1px var(--primary-color);
      background-color: #fff;
    }
  }
  
  :deep(.el-form-item__label) {
    font-weight: 600;
    color: var(--text-main);
  }
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1.5rem;
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  
  &:hover {
    background-color: var(--primary-hover);
    border-color: var(--primary-hover);
  }
}
</style>