import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/home',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue')
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/ForgotPasswordView.vue')
    },
    {
      path: '/resume/upload',
      name: 'resume-upload',
      component: () => import('@/views/ResumeUploadView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/excellent-resume',
      name: 'excellent-resume',
      component: () => import('@/views/ExcellentResumeUploadView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/resume/optimize',
      name: 'resume-optimize',
      component: () => import('@/views/ResumeOptimizeView.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  if (to.meta.requiresAuth && !userStore.token) {
    next({ name: 'login' })
  } else {
    next()
  }
})

export default router