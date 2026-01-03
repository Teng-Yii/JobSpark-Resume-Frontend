<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Message, Lock } from '@element-plus/icons-vue'
import { forgotPasswordApi, resetPasswordApi } from '@/api/auth'

const router = useRouter()
const route = useRoute()

// 判断是重置密码还是发送邮件（通过URL参数token判断）
const resetToken = ref<string>(route.query.token as string || '')
const isResetMode = ref<boolean>(!!resetToken.value)

const forgotFormRef = ref<FormInstance>()
const resetFormRef = ref<FormInstance>()
const loading = ref(false)
const emailSent = ref(false)

// 忘记密码表单
const forgotForm = reactive({
  email: ''
})

// 重置密码表单
const resetForm = reactive({
  newPassword: '',
  confirmPassword: ''
})

const validatePass = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== resetForm.newPassword) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const forgotRules = reactive<FormRules>({
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
})

const resetRules = reactive<FormRules>({
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于 6 位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validatePass, trigger: 'blur' }
  ]
})

// 发送重置密码邮件
const handleForgotPassword = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  
  await formEl.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await forgotPasswordApi({ email: forgotForm.email })
        emailSent.value = true
        ElMessage.success('重置密码邮件已发送，请查收邮箱')
      } catch (error: any) {
        console.error(error)
      } finally {
        loading.value = false
      }
    }
  })
}

// 重置密码
const handleResetPassword = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  
  await formEl.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await resetPasswordApi({
          token: resetToken.value,
          newPassword: resetForm.newPassword,
          confirmPassword: resetForm.confirmPassword
        })
        ElMessage.success('密码重置成功，请使用新密码登录')
        router.push('/login')
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
  <div class="forgot-password-container">
    <div class="forgot-left">
      <div class="brand-wrapper">
        <h1 class="brand-title">JobSpark 智能简历</h1>
        <p class="brand-slogan">我们会帮您找回密码</p>
      </div>
      <div class="brand-decoration"></div>
    </div>
    
    <div class="forgot-right">
      <div class="form-wrapper fade-in">
        <!-- 忘记密码模式 -->
        <template v-if="!isResetMode">
          <div class="form-header">
            <h2>忘记密码</h2>
            <p class="subtitle">输入注册时使用的邮箱地址</p>
          </div>
          
          <template v-if="!emailSent">
            <el-form
              ref="forgotFormRef"
              :model="forgotForm"
              :rules="forgotRules"
              label-position="top"
              size="large"
              class="forgot-form"
            >
              <el-form-item label="邮箱地址" prop="email">
                <el-input
                  v-model="forgotForm.email"
                  placeholder="请输入注册时的邮箱"
                  :prefix-icon="Message"
                  @keyup.enter="handleForgotPassword(forgotFormRef)"
                />
              </el-form-item>
              
              <el-button
                type="primary"
                :loading="loading"
                class="submit-button"
                @click="handleForgotPassword(forgotFormRef)"
              >
                发送重置邮件
              </el-button>
            </el-form>
          </template>
          
          <!-- 邮件已发送提示 -->
          <template v-else>
            <el-result
              icon="success"
              title="邮件已发送"
              sub-title="请查收您的邮箱，点击邮件中的链接重置密码"
            >
              <template #extra>
                <el-button type="primary" @click="goToLogin">返回登录</el-button>
              </template>
            </el-result>
          </template>
        </template>
        
        <!-- 重置密码模式 -->
        <template v-else>
          <div class="form-header">
            <h2>重置密码</h2>
            <p class="subtitle">请输入您的新密码</p>
          </div>
          
          <el-form
            ref="resetFormRef"
            :model="resetForm"
            :rules="resetRules"
            label-position="top"
            size="large"
            class="forgot-form"
          >
            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="resetForm.newPassword"
                type="password"
                placeholder="请输入新密码"
                :prefix-icon="Lock"
                show-password
              />
            </el-form-item>
            
            <el-form-item label="确认新密码" prop="confirmPassword">
              <el-input
                v-model="resetForm.confirmPassword"
                type="password"
                placeholder="请再次输入新密码"
                :prefix-icon="Lock"
                show-password
                @keyup.enter="handleResetPassword(resetFormRef)"
              />
            </el-form-item>
            
            <el-button
              type="primary"
              :loading="loading"
              class="submit-button"
              @click="handleResetPassword(resetFormRef)"
            >
              重置密码
            </el-button>
          </el-form>
        </template>
        
        <div class="form-footer" v-if="!emailSent">
          <span class="footer-text">记起密码了？</span>
          <el-link type="primary" :underline="false" @click="goToLogin">返回登录</el-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.forgot-password-container {
  display: flex;
  height: 100vh;
  width: 100%;
  background-color: #fff;
  overflow: hidden;
}

.forgot-left {
  flex: 1;
  background: linear-gradient(135deg, #f77f00 0%, #d62828 100%);
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

.forgot-right {
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

.forgot-form {
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

.submit-button {
  width: 100%;
  height: 48px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  margin-top: 8px;
  
  &:hover {
    background-color: var(--primary-hover);
    border-color: var(--primary-hover);
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

:deep(.el-result) {
  padding: 20px 0;
  
  .el-result__icon svg {
    width: 64px;
    height: 64px;
  }
  
  .el-result__title {
    margin-top: 20px;
  }
}
</style>
