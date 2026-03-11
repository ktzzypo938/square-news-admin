<template>
  <div class="login-container">
    <n-card style="max-width: 400px; width: 100%">
      <div class="login-header">
        <n-icon size="48" color="#2563eb">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
          </svg>
        </n-icon>
        <h2 class="login-title">Square News 後台管理</h2>
        <p class="login-subtitle">請使用 @square.news 帳號登入</p>
      </div>

      <n-divider />

      <div id="google-signin-btn" class="google-btn-wrapper"></div>

      <n-alert v-if="error" type="error" :title="error" style="margin-top: 16px" />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage, NCard, NDivider, NIcon, NAlert } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'
import { adminApi } from '@/api/client'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const authStore = useAuthStore()

const error = ref<string | null>(null)

async function handleCredentialResponse(response: { credential: string }) {
  error.value = null
  try {
    const res = await adminApi.post('/admin/auth/google', { idToken: response.credential })
    authStore.login(res.data)
    message.success(`歡迎，${res.data.name || res.data.email}`)
    const redirect = route.query.redirect as string
    router.push(redirect || '/admin')
  } catch (err: any) {
    error.value = err.message || '登入失敗，請確認帳號是否為 @square.news'
  }
}

onMounted(() => {
  const clientId = import.meta.env.VITE_ADMIN_GOOGLE_CLIENT_ID
  const initGSI = () => {
    if (typeof (window as any).google === 'undefined') {
      setTimeout(initGSI, 100)
      return
    }
    ;(window as any).google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
      auto_select: false
    })
    ;(window as any).google.accounts.id.renderButton(
      document.getElementById('google-signin-btn'),
      { theme: 'outline', size: 'large', locale: 'zh-TW', width: 300 }
    )
  }
  initGSI()
})
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 72px);
  padding: 24px;
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 0;
}

.login-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.login-subtitle {
  margin: 0;
  font-size: 14px;
  color: #64748b;
}

.google-btn-wrapper {
  display: flex;
  justify-content: center;
  padding: 8px 0;
}
</style>
