import { apiClient } from './client'
import type { ReviewResponse, LineExplanation } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

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
