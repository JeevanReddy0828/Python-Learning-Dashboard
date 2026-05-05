import { apiClient } from './client'
import type { MemoryEntry, ChatSessionSummary, ChatSessionDetail, ChatMessageRecord } from '../types'

export const memoryApi = {
  listVault: (memory_type?: string) =>
    apiClient.get<MemoryEntry[]>('/memory/vault', { params: memory_type ? { memory_type } : {} }),
  createMemory: (data: { title: string; content: string; memory_type?: string; tags?: string[]; lesson_slug?: string }) =>
    apiClient.post<MemoryEntry>('/memory/vault', data),
  updateMemory: (id: string, data: { title?: string; content?: string; memory_type?: string; tags?: string[] }) =>
    apiClient.patch<MemoryEntry>(`/memory/vault/${id}`, data),
  deleteMemory: (id: string) =>
    apiClient.delete(`/memory/vault/${id}`),

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
