import { apiClient } from './client'
import type { UserProfile, UserStats, UserRead } from '../types'

export const usersApi = {
  profile: () => apiClient.get<UserProfile>('/users/me'),
  stats: () => apiClient.get<UserStats>('/users/me/stats'),
  update: (data: { display_name?: string; avatar_url?: string }) =>
    apiClient.patch<UserRead>('/users/me', data),
}
