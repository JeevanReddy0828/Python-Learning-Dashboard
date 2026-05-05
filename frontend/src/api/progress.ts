import { apiClient } from './client'
import type { ProgressSummary, WeeklyActivity, WeakArea } from '../types'

export const progressApi = {
  summary: () => apiClient.get<ProgressSummary>('/progress'),
  weekly: () => apiClient.get<WeeklyActivity[]>('/progress/weekly'),
  weakAreas: () => apiClient.get<WeakArea[]>('/progress/weak-areas'),
}
