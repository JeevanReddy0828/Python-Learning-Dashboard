import { apiClient } from './client'
import type { LeaderboardEntry } from '../types'

export const leaderboardApi = {
  top: () => apiClient.get<LeaderboardEntry[]>('/leaderboard'),
  myRank: () => apiClient.get<{ rank: number | null; xp: number; display_name: string }>('/leaderboard/me'),
  sync: () => apiClient.post('/leaderboard/sync'),
}
