import { apiClient } from './client'
import type { AchievementRead } from '../types'

export const achievementsApi = {
  list: () => apiClient.get<AchievementRead[]>('/achievements'),
  earned: () => apiClient.get<AchievementRead[]>('/achievements/earned'),
}
