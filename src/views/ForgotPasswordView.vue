<script setup lang="ts">
import { reactive, ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Message, Lock, Key, User } from '@element-plus/icons-vue'
import { sendForgetPasswordCodeApi, forgetPasswordApi } from '@/api/auth'

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)
const codeLoading = ref(false)
const countdown = ref(0)
let timer: number | null = null

// 表单数据
const form = reactive({
  username: '',
  email: '',
  code: '',
  newPassword: '',
  confirmPassword: ''
})

// 密码一致性校验
const validatePass = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== form.newPassword) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

// 表单校验规则
const rules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码长度为6位', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于 6 位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validatePass, trigger: 'blur' }
  ]
})

// 发送验证码
const handleSendCode = async () => {
  if (countdown.value > 0) return

  // 先只校验用户名和邮箱字段
  if (!formRef.value) return
  try {
    await formRef.value.validateField(['username', 'email'])
  } catch (error) {
    return
  }

  codeLoading.value = true
  try {
    await sendForgetPasswordCodeApi({
      username: form.username,
      email: form.email
    })
    ElMessage.success('验证码已发送，请查收邮箱')
    startCountdown()
  } catch (error) {
    console.error(error)
  } finally {
    codeLoading.value = false
  }
}

// 开始倒计时
const startCountdown = () => {
  countdown.value = 60
  timer = window.setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      if (timer) clearInterval(timer)
      timer = null
    }
  }, 1000)
}

// 组件卸载时清除定时器
onUnmounted(() => {
  if (timer) clearInterval(timer)
})

// 提交重置密码
const handleResetPassword = async (formEl: FormInstance | undefined) => {
  if (!formEl) return

  await formEl.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await forgetPasswordApi({
          username: form.username,
          email: form.email,
          code: form.code,
          newPassword: form.newPassword,
          confirmPassword: form.confirmPassword
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
        <div class="form-header">
          <h2>重置密码</h2>
          <p class="subtitle">通过邮箱验证码重置您的密码</p>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          size="large"
          class="forgot-form"
        >
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入您的用户名"
              :prefix-icon="User"
            />
          </el-form-item>

          <el-form-item label="邮箱地址" prop="email">
            <el-input
              v-model="form.email"
              placeholder="请输入注册时的邮箱"
              :prefix-icon="Message"
            />
          </el-form-item>

          <el-form-item label="验证码" prop="code">
            <div class="code-input-wrapper">
              <el-input
                v-model="form.code"
                placeholder="请输入6位验证码"
                :prefix-icon="Key"
                maxlength="6"
              />
              <el-button
                type="primary"
                plain
                :disabled="countdown > 0"
                :loading="codeLoading"
                class="send-code-btn"
                @click="handleSendCode"
              >
                {{ countdown > 0 ? `${countdown}秒后重试` : '获取验证码' }}
              </el-button>
            </div>
          </el-form-item>

          <el-form-item label="新密码" prop="newPassword">
            <el-input
              v-model="form.newPassword"
              type="password"
              placeholder="请输入新密码"
              :prefix-icon="Lock"
              show-password
            />
          </el-form-item>

          <el-form-item label="确认新密码" prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              :prefix-icon="Lock"
              show-password
              @keyup.enter="handleResetPassword(formRef)"
            />
          </el-form-item>

          <el-button
            type="primary"
            :loading="loading"
            class="submit-button"
            @click="handleResetPassword(formRef)"
          >
            重置密码
          </el-button>

          <div class="form-footer">
            <el-button link type="primary" @click="goToLogin">
              返回登录
            </el-button>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.forgot-password-container {
  display: flex;
  min-height: 100vh;
  width: 100%;
  background-color: #f5f7fa;

  .forgot-left {
    display: none;

    @media (min-width: 1024px) {
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: 40%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 4rem;
      position: relative;
      overflow: hidden;
    }

    .brand-wrapper {
      z-index: 2;

      .brand-title {
        font-size: 3rem;
        font-weight: 800;
        margin-bottom: 1rem;
        letter-spacing: -0.5px;
      }

      .brand-slogan {
        font-size: 1.5rem;
        opacity: 0.9;
        font-weight: 300;
      }
    }

    .brand-decoration {
      position: absolute;
      top: -10%;
      right: -10%;
      width: 500px;
      height: 500px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      z-index: 1;
    }
  }

  .forgot-right {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;

    .form-wrapper {
      width: 100%;
      max-width: 480px;
      background: white;
      padding: 3rem;
      border-radius: 16px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);

      .form-header {
        text-align: center;
        margin-bottom: 2.5rem;

        h2 {
          font-size: 2rem;
          color: #2c3e50;
          margin-bottom: 0.5rem;
          font-weight: 700;
        }

        .subtitle {
          color: #94a3b8;
          font-size: 1rem;
        }
      }

      .forgot-form {
        .el-form-item {
          margin-bottom: 1.5rem;

          :deep(.el-form-item__label) {
            font-weight: 500;
            color: #475569;
          }

          :deep(.el-input__wrapper) {
            box-shadow: 0 0 0 1px #e2e8f0 inset;
            border-radius: 8px;
            padding: 4px 11px;

            &.is-focus {
              box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
            }
          }
        }

        .code-input-wrapper {
          display: flex;
          width: 100%;
          gap: 12px;

          .el-input {
            flex: 1;
          }

          .send-code-btn {
            width: 120px;
            border-radius: 8px;
          }
        }

        .submit-button {
          width: 100%;
          height: 48px;
          font-size: 1.1rem;
          border-radius: 8px;
          margin-top: 1rem;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .form-footer {
          margin-top: 1.5rem;
          text-align: center;
        }
      }
    }
  }
}

.fade-in {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .forgot-right {
    padding: 1rem;

    .form-wrapper {
      padding: 2rem;
      box-shadow: none;
      background: transparent;
    }
  }
}
</style>
