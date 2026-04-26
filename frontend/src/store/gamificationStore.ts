import { create } from 'zustand'
import type { AchievementRead } from '../types'

interface XPEvent {
  id: string
  amount: number
  reason: string
}

interface GamificationStore {
  xp: number
  level: number
  showConfetti: boolean
  confettiIntensity: 'small' | 'medium' | 'large'
  pendingXPEvents: XPEvent[]
  newAchievements: AchievementRead[]
  setXP: (xp: number, level: number) => void
  addXPEvent: (amount: number, reason: string) => void
  removeXPEvent: (id: string) => void
  triggerConfetti: (intensity?: 'small' | 'medium' | 'large') => void
  clearConfetti: () => void
  addAchievements: (achievements: AchievementRead[]) => void
  clearAchievements: () => void
}

export const useGamificationStore = create<GamificationStore>((set) => ({
  xp: 0,
  level: 1,
  showConfetti: false,
  confettiIntensity: 'small',
  pendingXPEvents: [],
  newAchievements: [],

  setXP: (xp, level) => set({ xp, level }),

  addXPEvent: (amount, reason) => {
    const id = Math.random().toString(36).slice(2)
    set((s) => ({
      xp: s.xp + amount,
      pendingXPEvents: [...s.pendingXPEvents, { id, amount, reason }],
    }))
    setTimeout(() => {
      set((s) => ({ pendingXPEvents: s.pendingXPEvents.filter((e) => e.id !== id) }))
    }, 1500)
  },

  removeXPEvent: (id) =>
    set((s) => ({ pendingXPEvents: s.pendingXPEvents.filter((e) => e.id !== id) })),

  triggerConfetti: (intensity = 'small') =>
    set({ showConfetti: true, confettiIntensity: intensity }),

  clearConfetti: () => set({ showConfetti: false }),

  addAchievements: (achievements) =>
    set((s) => ({ newAchievements: [...s.newAchievements, ...achievements] })),

  clearAchievements: () => set({ newAchievements: [] }),
}))
