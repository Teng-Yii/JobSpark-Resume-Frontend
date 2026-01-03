<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock, Message, Phone } from '@element-plus/icons-vue'

const userStore = useUserStore()
const router = useRouter()

const registerFormRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  phone: '',
  nickname: ''
})

const validatePass = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== form.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const rules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于 6 位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validatePass, trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ]
})

const handleRegister = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  
  await formEl.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await userStore.register({
          username: form.username,
          password: form.password,
          confirmPassword: form.confirmPassword,
          email: form.email,
          phone: form.phone || undefined,
          nickname: form.nickname || undefined
        })
        ElMessage.success('注册成功，欢迎加入')
        router.push('/home')
      } catch (error: any) {
        console.error(error)
      } finally {
        loading.value = false
      }
    }
  })
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="register-container">
    <div class="register-left">
      <div class="brand-wrapper">
        <h1 class="brand-title">JobSpark 智能简历</h1>
        <p class="brand-slogan">开启您的职业新征程</p>
      </div>
      <div class="brand-decoration"></div>
    </div>
    
    <div class="register-right">
      <div class="form-wrapper fade-in">
        <div class="form-header">
          <h2>创建账户</h2>
          <p class="subtitle">填写信息完成注册</p>
        </div>
        
        <el-form
          ref="registerFormRef"
          :model="form"
          :rules="rules"
          label-position="top"
          size="large"
          class="register-form"
        >
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入用户名"
              :prefix-icon="User"
            />
          </el-form-item>
          
          <el-form-item label="邮箱" prop="email">
            <el-input
              v-model="form.email"
              placeholder="请输入邮箱地址"
              :prefix-icon="Message"
            />
          </el-form-item>
          
          <el-form-item label="昵称（可选）" prop="nickname">
            <el-input
              v-model="form.nickname"
              placeholder="请输入昵称"
              :prefix-icon="User"
            />
          </el-form-item>
          
          <el-form-item label="手机号（可选）" prop="phone">
            <el-input
              v-model="form.phone"
              placeholder="请输入手机号"
              :prefix-icon="Phone"
            />
          </el-form-item>
          
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              :prefix-icon="Lock"
              show-password
            />
          </el-form-item>
          
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              :prefix-icon="Lock"
              show-password
              @keyup.enter="handleRegister(registerFormRef)"
            />
          </el-form-item>
          
          <el-button
            type="primary"
            :loading="loading"
            class="register-button"
            @click="handleRegister(registerFormRef)"
          >
            注 册
          </el-button>
          
          <div class="form-footer">
            <span class="footer-text">已有账户？</span>
            <el-link type="primary" :underline="false" @click="goToLogin">立即登录</el-link>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.register-container {
  display: flex;
  height: 100vh;
  width: 100%;
  background-color: #fff;
  overflow: hidden;
}

.register-left {
  flex: 1;
  background: linear-gradient(135deg, #6a994e 0%, #588157 100%);
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

.register-right {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fff;
  padding: 40px;
  overflow-y: auto;
  
  .form-wrapper {
    width: 100%;
    max-width: 440px;
  }
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;
  
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

.register-form {
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
  
  :deep(.el-form-item) {
    margin-bottom: 18px;
  }
}

.register-button {
  width: 100%;
  height: 48px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  background-color: var(--secondary-color);
  border-color: var(--secondary-color);
  margin-top: 8px;
  
  &:hover {
    background-color: #588157;
    border-color: #588157;
  }
}

.form-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 1.5rem;
  gap: 8px;
  
  .footer-text {
    color: var(--text-secondary);
    font-size: 0.9rem;
  }
}
</style>
