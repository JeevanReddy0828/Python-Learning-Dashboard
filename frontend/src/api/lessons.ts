import { apiClient } from './client'
import type { LessonDetail } from '../types'

export const lessonsApi = {
  get: (id: string) => apiClient.get<LessonDetail>(`/lessons/${id}`),
  start: (id: string) => apiClient.post(`/lessons/${id}/start`),
  complete: (id: string, time_spent_sec: number) =>
    apiClient.post(`/lessons/${id}/complete`, { time_spent_sec }),
}
