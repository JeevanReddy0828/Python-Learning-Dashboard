import { apiClient } from './client'
import type { Module, ModuleDetail } from '../types'

export const modulesApi = {
  list: () => apiClient.get<Module[]>('/modules'),
  get: (slug: string) => apiClient.get<ModuleDetail>(`/modules/${slug}`),
}
