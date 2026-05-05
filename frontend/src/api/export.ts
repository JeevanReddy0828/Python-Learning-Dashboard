import { apiClient } from './client'

export const exportApi = {
  toNotion: () => apiClient.post<{ notion_url: string; message: string }>('/export/notion'),
}
