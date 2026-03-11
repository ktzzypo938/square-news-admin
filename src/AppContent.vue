<template>
  <n-layout class="app-layout">
    <n-layout-header class="app-header" bordered>
      <div class="header-content">
        <div class="logo-section" @click="router.push('/dashboard')">
          <n-icon size="32" color="#2563eb">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
            </svg>
          </n-icon>
          <h2 class="logo-text">Square News</h2>
        </div>

        <nav class="nav-menu">
          <n-button
            v-for="item in navItems"
            :key="item.path"
            :class="{ 'nav-active': isActive(item.path) }"
            text
            @click="router.push(item.path)"
          >
            {{ item.label }}
          </n-button>
        </nav>

        <div class="auth-section">
          <n-badge v-if="authStore.isAuthenticated" :value="'Admin'" type="success">
            <n-avatar
              round
              size="small"
              :src="authStore.avatarUrl || undefined"
              :style="{ backgroundColor: '#2563eb' }"
            >
              {{ authStore.name?.substring(0, 1) || authStore.email?.substring(0, 1) || 'A' }}
            </n-avatar>
          </n-badge>

          <n-dropdown v-if="authStore.isAuthenticated" trigger="hover" :options="dropdownOptions" @select="handleDropdownSelect">
            <n-button text>
              <template #icon>
                <n-icon size="20">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 10l5 5 5-5z"/>
                  </svg>
                </n-icon>
              </template>
            </n-button>
          </n-dropdown>

          <n-button v-if="!authStore.isAuthenticated" type="primary" @click="router.push('/login')">
            登入
          </n-button>
        </div>
      </div>
    </n-layout-header>

    <n-layout-content class="app-content" :native-scrollbar="false" :content-style="{ padding: route.path.startsWith('/admin') ? '0' : '32px 24px' }">
      <transition name="fade" mode="out-in">
        <router-view />
      </transition>
    </n-layout-content>
  </n-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NLayout, NLayoutHeader, NLayoutContent, NButton, NIcon, NBadge, NAvatar, NDropdown } from 'naive-ui'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const navItems = computed(() => {
  const items = [
    { label: '儀表板', path: '/dashboard' },
    { label: '事件', path: '/events' },
    { label: '文章', path: '/articles' }
  ]

  if (authStore.isAuthenticated) {
    items.push({ label: '後台管理', path: '/admin' })
  }

  return items
})

const dropdownOptions = computed(() => [
  {
    label: authStore.email || '',
    key: 'email',
    disabled: true
  },
  {
    type: 'divider',
    key: 'divider'
  },
  {
    label: '登出',
    key: 'logout'
  }
])

function isActive(path: string) {
  return route.path.startsWith(path)
}

function handleDropdownSelect(key: string) {
  if (key === 'logout') {
    authStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
}

.app-header {
  height: 72px;
  padding: 0;
  background: white;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 32px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.logo-section:hover {
  opacity: 0.8;
}

.logo-text {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-menu {
  flex: 1;
  display: flex;
  gap: 8px;
}

.nav-menu :deep(.n-button) {
  font-size: 15px;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s;
}

.nav-menu :deep(.n-button:hover) {
  background-color: #f1f5f9;
  color: #2563eb;
}

.nav-menu :deep(.nav-active.n-button) {
  background-color: #eff6ff;
  color: #2563eb;
  font-weight: 600;
}

.auth-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-content {
  background-color: #f8fafc;
  min-height: calc(100vh - 72px);
}

/* 響應式設計 */
@media (max-width: 768px) {
  .header-content {
    gap: 16px;
  }

  .logo-text {
    font-size: 18px;
  }

  .nav-menu {
    display: none;
  }

  .app-content {
    padding: 20px 16px;
  }
}
</style>
