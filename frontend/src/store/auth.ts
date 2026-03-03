import { create } from 'zustand'
import type { User, RegisterInput, LoginInput } from '../types'
import { authApi } from '../api/client'

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null

  login: (data: LoginInput) => Promise<void>
  register: (data: RegisterInput) => Promise<void>
  logout: () => void
  fetchProfile: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  error: null,

  login: async (data) => {
    set({ loading: true, error: null })
    try {
      const res = await authApi.login(data)
      localStorage.setItem('token', res.data.token)
      set({ token: res.data.token, user: res.data.user, loading: false })
    } catch (e: any) {
      set({ loading: false, error: e.response?.data?.error ?? 'Ошибка входа' })
      throw e
    }
  },

  register: async (data) => {
    set({ loading: true, error: null })
    try {
      const res = await authApi.register(data)
      localStorage.setItem('token', res.data.token)
      set({ token: res.data.token, user: res.data.user, loading: false })
    } catch (e: any) {
      set({ loading: false, error: e.response?.data?.error ?? 'Ошибка регистрации' })
      throw e
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },

  fetchProfile: async () => {
    try {
      const res = await authApi.getProfile()
      set({ user: res.data })
    } catch {
      // token invalid — logout handled by interceptor
    }
  },

  clearError: () => set({ error: null }),
}))