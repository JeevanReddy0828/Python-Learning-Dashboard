import { apiClient } from './client'
import type {
  UserProfile, UserStats, UserRead,
  Module, ModuleDetail, LessonDetail,
  ExerciseDetail, SubmitResponse,
  WeeklyActivity, WeakArea, ProgressSummary,
  AchievementRead, StreakInfo,
  ReviewResponse, LineExplanation, ExecutionResult,
} from '../types'

// Auth
export const authApi = {
  register: (email: string, password: string, display_name: string) =>
    apiClient.post<{ access_token: string; user: UserRead }>('/auth/register', { email, password, display_name }),
  login: (email: string, password: string) =>
    apiClient.post<{ access_token: string }>('/auth/login', { email, password }),
  me: () => apiClient.get<UserRead>('/auth/me'),
}

// Users
export const usersApi = {
  profile: () => apiClient.get<UserProfile>('/users/me'),
  stats: () => apiClient.get<UserStats>('/users/me/stats'),
  update: (data: { display_name?: string; avatar_url?: string }) =>
    apiClient.patch<UserRead>('/users/me', data),
}

// Modules
export const modulesApi = {
  list: () => apiClient.get<Module[]>('/modules'),
  get: (slug: string) => apiClient.get<ModuleDetail>(`/modules/${slug}`),
}

// Lessons
export const lessonsApi = {
  get: (id: string) => apiClient.get<LessonDetail>(`/lessons/${id}`),
  start: (id: string) => apiClient.post(`/lessons/${id}/start`),
  complete: (id: string, time_spent_sec: number) =>
    apiClient.post(`/lessons/${id}/complete`, { time_spent_sec }),
}

// Exercises
export const exercisesApi = {
  get: (id: string) => apiClient.get<ExerciseDetail>(`/exercises/${id}`),
  hint: (id: string, hint_index: number) =>
    apiClient.get<{ hint: string; hint_index: number }>(`/exercises/${id}/hint`, { params: { hint_index } }),
  submit: (id: string, data: { code?: string; answer?: string }) =>
    apiClient.post<SubmitResponse>(`/exercises/${id}/submit`, data),
}

// Progress
export const progressApi = {
  summary: () => apiClient.get<ProgressSummary>('/progress'),
  weekly: () => apiClient.get<WeeklyActivity[]>('/progress/weekly'),
  weakAreas: () => apiClient.get<WeakArea[]>('/progress/weak-areas'),
}

// Achievements
export const achievementsApi = {
  list: () => apiClient.get<AchievementRead[]>('/achievements'),
  earned: () => apiClient.get<AchievementRead[]>('/achievements/earned'),
}

// Streaks
export const streaksApi = {
  get: () => apiClient.get<StreakInfo>('/streaks'),
  checkIn: () => apiClient.post<{ streak: StreakInfo; new_achievements: AchievementRead[] }>('/streaks/check-in'),
}

// Code execution
export const codeApi = {
  run: (code: string, stdin = '') =>
    apiClient.post<ExecutionResult>('/code/run', { code, stdin }),
}

// AI
export const aiApi = {
  hint: (code: string, exercise_id: string, hint_level: number) =>
    apiClient.post<{ hint: string; hint_level: number }>('/ai/hint', { code, exercise_id, hint_level }),
  review: (code: string, exercise_id?: string, exercise_title?: string) =>
    apiClient.post<ReviewResponse>('/ai/review', { code, exercise_id, exercise_title }),
  explain: (code: string) =>
    apiClient.post<{ lines: LineExplanation[] }>('/ai/explain', { code }),
  chat: (message: string, context_code?: string, lesson_title?: string) =>
    apiClient.post<{ response: string }>('/ai/chat', { message, context_code, lesson_title }),
}
