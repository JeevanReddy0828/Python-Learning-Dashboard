import { apiClient } from './client'
import type { ExecutionResult } from '../types'

export const codeApi = {
  run: (code: string, stdin = '') =>
    apiClient.post<ExecutionResult>('/code/run', { code, stdin }),
}
