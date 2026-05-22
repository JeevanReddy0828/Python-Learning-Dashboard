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

/**
 * Returned from streamChat so callers know whether the stream produced
 * real tokens or failed before any AI output arrived. On failure, the caller
 * should treat the in-progress message as an error and avoid advancing state
 * (e.g. don't transition Socratic phase from `explain` → `reexplain`).
 */
export interface StreamResult {
  ok: boolean
  /** HTTP status if the upstream rejected the request; undefined for network errors. */
  status?: number
  /** Human-readable error message that was streamed into the bubble (if !ok). */
  error?: string
}

export async function streamChat(
  message: string,
  onToken: (token: string) => void,
  onDone: () => void,
  contextCode?: string,
  lessonTitle?: string,
): Promise<StreamResult> {
  const token = localStorage.getItem('access_token')
  let res: Response
  try {
    res = await fetch(`${API_URL}/api/v1/ai/stream-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message, context_code: contextCode, lesson_title: lessonTitle }),
    })
  } catch (e) {
    const msg = '⚠️ Could not reach the AI service. Check your network connection.'
    onToken(msg)
    onDone()
    return { ok: false, error: msg }
  }

  if (!res.ok || !res.body) {
    const errMsg =
      res.status === 401 || res.status === 403
        ? '🔒 Your session expired — redirecting you to log in…'
        : res.status === 503
        ? '⚠️ The AI service isn\'t configured on the server (missing API key).'
        : res.status === 429
        ? '⏳ Rate limited — wait a moment and try again.'
        : `⚠️ AI request failed (HTTP ${res.status}). Try again in a moment.`
    onToken(errMsg)
    onDone()
    // Mirror the axios interceptor in client.ts: clear stale token and redirect
    // on auth failure so the user lands on /login instead of getting stuck.
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('access_token')
      setTimeout(() => { window.location.href = '/login' }, 1200)
    }
    return { ok: false, status: res.status, error: errMsg }
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let receivedAnyToken = false
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const payload = line.slice(6)
        if (payload === '[DONE]') { onDone(); return { ok: receivedAnyToken } }
        try {
          onToken(JSON.parse(payload).t)
          receivedAnyToken = true
        } catch { /* skip malformed chunk */ }
      }
    }
  } catch (e) {
    const msg = '\n\n⚠️ Stream interrupted. Try again.'
    onToken(msg)
    onDone()
    return { ok: false, error: msg }
  }
  onDone()
  return { ok: receivedAnyToken }
}
