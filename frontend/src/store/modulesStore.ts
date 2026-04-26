import { create } from 'zustand'
import type { Module } from '../types'
import { modulesApi } from '../api'

interface ModulesStore {
  modules: Module[]
  refresh: () => Promise<void>
}

export const useModulesStore = create<ModulesStore>((set) => ({
  modules: [],
  refresh: async () => {
    try {
      const r = await modulesApi.list()
      set({ modules: r.data })
    } catch {}
  },
}))
