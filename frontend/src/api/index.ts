import { apiClient } from './client'
import type {
  UserProfile, UserStats, UserRead,
  Module, ModuleDetail, LessonDetail,
  ExerciseDetail, SubmitResponse,
  WeeklyActivity, WeakArea, ProgressSummary,
  AchievementRead, StreakInfo,
  ReviewResponse, LineExplanation, ExecutionResult,
  LeaderboardEntry,
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
  devChat: (mode: string, input_text: string, code?: string) =>
    apiClient.post<{ response: string; mode: string }>('/ai/dev-chat', { mode, input_text, code }),
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function streamDevChat(
  mode: string,
  inputText: string,
  onToken: (token: string) => void,
  onDone: () => void,
  code?: string,
): Promise<void> {
  const token = localStorage.getItem('access_token')
  const res = await fetch(`${API_URL}/api/v1/ai/stream-dev-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ mode, input_text: inputText, code }),
  })
  if (!res.ok || !res.body) { onDone(); return }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const payload = line.slice(6)
      if (payload === '[DONE]') { onDone(); return }
      try { onToken(JSON.parse(payload).t) } catch { /* skip */ }
    }
  }
  onDone()
}

export async function streamChat(
  message: string,
  onToken: (token: string) => void,
  onDone: () => void,
  contextCode?: string,
  lessonTitle?: string,
): Promise<void> {
  const token = localStorage.getItem('access_token')
  const res = await fetch(`${API_URL}/api/v1/ai/stream-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, context_code: contextCode, lesson_title: lessonTitle }),
  })
  if (!res.ok || !res.body) { onDone(); return }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const payload = line.slice(6)
      if (payload === '[DONE]') { onDone(); return }
      try { onToken(JSON.parse(payload).t) } catch { /* skip malformed chunk */ }
    }
  }
  onDone()
}

// Leaderboard (Redis-backed)
export const leaderboardApi = {
  top: () => apiClient.get<LeaderboardEntry[]>('/leaderboard'),
  myRank: () => apiClient.get<{ rank: number | null; xp: number; display_name: string }>('/leaderboard/me'),
  sync: () => apiClient.post('/leaderboard/sync'),
}

// Export
export const exportApi = {
  toNotion: () => apiClient.post<{ notion_url: string; message: string }>('/export/notion'),
}

// Memory Vault + Session History
export const memoryApi = {
  // Vault
  listVault: (memory_type?: string) =>
    apiClient.get<MemoryEntry[]>('/memory/vault', { params: memory_type ? { memory_type } : {} }),
  createMemory: (data: { title: string; content: string; memory_type?: string; tags?: string[]; lesson_slug?: string }) =>
    apiClient.post<MemoryEntry>('/memory/vault', data),
  updateMemory: (id: string, data: { title?: string; content?: string; memory_type?: string; tags?: string[] }) =>
    apiClient.patch<MemoryEntry>(`/memory/vault/${id}`, data),
  deleteMemory: (id: string) =>
    apiClient.delete(`/memory/vault/${id}`),

  // Sessions
  listSessions: () => apiClient.get<ChatSessionSummary[]>('/memory/sessions'),
  createSession: (title: string, lesson_slug?: string) =>
    apiClient.post<ChatSessionSummary>('/memory/sessions', { title, lesson_slug }),
  getSession: (id: string) => apiClient.get<ChatSessionDetail>(`/memory/sessions/${id}`),
  addMessage: (session_id: string, role: string, content: string) =>
    apiClient.post<ChatMessageRecord>(`/memory/sessions/${session_id}/messages`, null, {
      params: { role, content },
    }),
  deleteSession: (id: string) => apiClient.delete(`/memory/sessions/${id}`),
}
