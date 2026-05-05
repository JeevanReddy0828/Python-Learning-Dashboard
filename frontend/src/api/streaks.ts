import { apiClient } from './client'
import type { StreakInfo, AchievementRead } from '../types'

export const streaksApi = {
  get: () => apiClient.get<StreakInfo>('/streaks'),
  checkIn: () => apiClient.post<{ streak: StreakInfo; new_achievements: AchievementRead[] }>('/streaks/check-in'),
}
