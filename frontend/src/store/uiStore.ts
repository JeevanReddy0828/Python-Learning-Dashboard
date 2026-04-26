import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStore {
  darkMode: boolean
  focusMode: boolean
  sidebarOpen: boolean
  toggleDarkMode: () => void
  toggleFocusMode: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      darkMode: false,
      focusMode: false,
      sidebarOpen: true,

      toggleDarkMode: () => {
        const next = !get().darkMode
        set({ darkMode: next })
        document.documentElement.classList.toggle('dark', next)
      },

      toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'ui-store',
      onRehydrateStorage: () => (state) => {
        if (state?.darkMode) {
          document.documentElement.classList.add('dark')
        }
      },
    },
  ),
)
