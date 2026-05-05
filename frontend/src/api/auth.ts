import { apiClient } from './client'
import type { UserRead } from '../types'

export const authApi = {
  register: (email: string, password: string, display_name: string) =>
    apiClient.post<{ access_token: string; user: UserRead }>('/auth/register', { email, password, display_name }),
  login: (email: string, password: string) =>
    apiClient.post<{ access_token: string }>('/auth/login', { email, password }),
  me: () => apiClient.get<UserRead>('/auth/me'),
}
