import { apiClient } from './client'
import type { ExerciseDetail, SubmitResponse } from '../types'

export const exercisesApi = {
  get: (id: string) => apiClient.get<ExerciseDetail>(`/exercises/${id}`),
  hint: (id: string, hint_index: number) =>
    apiClient.get<{ hint: string; hint_index: number }>(`/exercises/${id}/hint`, { params: { hint_index } }),
  submit: (id: string, data: { code?: string; answer?: string }) =>
    apiClient.post<SubmitResponse>(`/exercises/${id}/submit`, data),
}
