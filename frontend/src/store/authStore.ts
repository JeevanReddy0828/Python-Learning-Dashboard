import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserRead } from '../types'
import { authApi } from '../api'

interface AuthStore {
  user: UserRead | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const res = await authApi.login(email, password)
          const token = res.data.access_token
          localStorage.setItem('access_token', token)
          const meRes = await authApi.me()
          set({ accessToken: token, user: meRes.data, isAuthenticated: true })
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (email, password, displayName) => {
        set({ isLoading: true })
        try {
          const res = await authApi.register(email, password, displayName)
          const token = res.data.access_token
          localStorage.setItem('access_token', token)
          set({ accessToken: token, user: res.data.user, isAuthenticated: true })
        } finally {
          set({ isLoading: false })
        }
      },

      logout: () => {
        localStorage.removeItem('access_token')
        set({ user: null, accessToken: null, isAuthenticated: false })
      },

      refreshUser: async () => {
        const res = await authApi.me()
        set({ user: res.data })
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ accessToken: state.accessToken, user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
)
