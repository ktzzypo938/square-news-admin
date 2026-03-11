import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'adminAuth'

interface AdminAuthData {
  accessToken: string
  email: string
  name: string
  avatarUrl: string
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const email = ref<string | null>(null)
  const name = ref<string | null>(null)
  const avatarUrl = ref<string | null>(null)

  const isAuthenticated = computed(() => {
    if (!token.value) return false
    try {
      const payload = JSON.parse(atob(token.value.split('.')[1]))
      return payload.exp * 1000 > Date.now()
    } catch {
      return false
    }
  })

  function login(data: AdminAuthData) {
    token.value = data.accessToken
    email.value = data.email
    name.value = data.name
    avatarUrl.value = data.avatarUrl
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  function logout() {
    token.value = null
    email.value = null
    name.value = null
    avatarUrl.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  function loadFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const data: AdminAuthData = JSON.parse(stored)
        // 檢查 token 是否還有效，過期就清掉
        const payload = JSON.parse(atob(data.accessToken.split('.')[1]))
        if (payload.exp * 1000 > Date.now()) {
          token.value = data.accessToken
          email.value = data.email
          name.value = data.name
          avatarUrl.value = data.avatarUrl
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }

  loadFromStorage()

  return { token, email, name, avatarUrl, isAuthenticated, login, logout, loadFromStorage }
})
