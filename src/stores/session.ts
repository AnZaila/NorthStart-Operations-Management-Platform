import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi } from '@/api'
import type { LoginPayload, Profile } from '@/types/models'
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '@/utils/token'

export const useSessionStore = defineStore('session', () => {
  const profile = ref<Profile | null>(null)
  const ready = ref(false)

  const isLogin = computed(() => Boolean(getAccessToken() || getRefreshToken()))
  const displayName = computed(() => profile.value?.displayName ?? '')
  const permissions = computed(() => profile.value?.permissions ?? [])
  const superAdmin = computed(() => (profile.value?.roles ?? []).includes('super_admin'))

  async function login(payload: LoginPayload) {
    const tokens = await authApi.login(payload)
    setTokens(tokens.accessToken, tokens.refreshToken, tokens.expiresIn)
    profile.value = await authApi.me()
    ready.value = true
    return tokens
  }

  async function ensureSession() {
    if (profile.value) {
      return profile.value
    }
    if (!getAccessToken() && !getRefreshToken()) {
      throw new Error('UNAUTHENTICATED')
    }
    profile.value = await authApi.me()
    ready.value = true
    return profile.value
  }

  async function logout() {
    try {
      await authApi.logout(getRefreshToken())
    } catch {
      /* ignore */
    }
    profile.value = null
    ready.value = false
    clearTokens()
  }

  function applyProfile(next: Profile | null) {
    profile.value = next
    ready.value = Boolean(next)
  }

  async function reloadProfile() {
    profile.value = await authApi.me()
    ready.value = true
    return profile.value
  }

  function hasPermission(code?: string) {
    if (!code) {
      return true
    }
    if (superAdmin.value) {
      return true
    }
    return permissions.value.includes(code)
  }

  return {
    profile,
    ready,
    isLogin,
    displayName,
    permissions,
    superAdmin,
    login,
    ensureSession,
    logout,
    applyProfile,
    reloadProfile,
    hasPermission,
  }
})
