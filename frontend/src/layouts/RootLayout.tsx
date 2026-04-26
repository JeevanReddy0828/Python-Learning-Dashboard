import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'
import { useGamificationStore } from '../store/gamificationStore'
import { modulesApi, streaksApi } from '../api'
import type { Module } from '../types'
import XPBar from '../components/gamification/XPBar'
import StreakCounter from '../components/gamification/StreakCounter'
import ConfettiCelebration from '../components/gamification/ConfettiCelebration'
import AchievementToast from '../components/gamification/AchievementToast'
import PomodoroTimer from '../components/adhd/PomodoroTimer'
import { cn } from '../utils/cn'

const NAV_ITEMS = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/modules', icon: '📚', label: 'Learn' },
  { to: '/achievements', icon: '🏆', label: 'Achievements' },
  { to: '/daily', icon: '⚡', label: 'Daily Challenge' },
  { to: '/learning-tools', icon: '🧠', label: 'Learning Tools' },
  { to: '/profile', icon: '👤', label: 'Profile' },
]

export default function RootLayout() {
  const { user, logout } = useAuthStore()
  const { darkMode, focusMode, sidebarOpen, toggleDarkMode, toggleFocusMode, setSidebarOpen } = useUIStore()
  const { setXP } = useGamificationStore()
  const [modules, setModules] = useState<Module[]>([])
  const [streak, setStreak] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    modulesApi.list().then((r) => setModules(r.data)).catch(() => {})
    streaksApi.checkIn().then((r) => setStreak(r.data.streak.current_streak)).catch(() => {})
  }, [])

  useEffect(() => {
    if (user) setXP(user.xp, user.level)
  }, [user])

  // F key toggles focus mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'f' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        toggleFocusMode()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggleFocusMode])

  return (
    <div className={cn('flex h-screen overflow-hidden', darkMode && 'dark')}>
      <ConfettiCelebration />
      <AchievementToast />

      {/* Sidebar */}
      {!focusMode && (
        <aside className={cn(
          'flex flex-col bg-white dark:bg-surface-dark border-r border-gray-100 dark:border-gray-700 transition-all duration-300 shrink-0',
          sidebarOpen ? 'w-60' : 'w-16'
        )}>
          {/* Logo */}
          <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100 dark:border-gray-700">
            <span className="text-2xl">🐍</span>
            {sidebarOpen && <span className="font-bold text-primary-700 dark:text-primary-300 text-lg">PyLearn</span>}
          </div>

          {/* Nav */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                )}
              >
                <span className="text-lg shrink-0">{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            ))}

            {/* Modules list */}
            {sidebarOpen && modules.length > 0 && (
              <div className="mt-4">
                <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Modules</p>
                {modules.map((mod) => (
                  <button
                    key={mod.id}
                    onClick={() => navigate(`/modules`)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-400"
                  >
                    <span>{mod.icon}</span>
                    <span className="truncate">{mod.title}</span>
                    <span className="ml-auto text-primary-500">{mod.completion_percent}%</span>
                  </button>
                ))}
              </div>
            )}
          </nav>

          {/* XP + Streak */}
          {sidebarOpen && user && (
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
              <XPBar xp={user.xp} level={user.level} compact />
              <StreakCounter streak={streak} />
            </div>
          )}

          {/* Toggle sidebar */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 border-t border-gray-100 dark:border-gray-700 transition-colors"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </aside>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        {!focusMode && (
          <header className="flex items-center justify-between px-6 py-3 bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-gray-700 shrink-0">
            <div className="flex items-center gap-3">
              {user && (
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Hey, {user.display_name.split(' ')[0]}! 👋
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <PomodoroTimer compact />
              <button
                onClick={toggleFocusMode}
                className="btn-ghost text-xs px-3 py-1.5"
                title="Toggle Focus Mode (F)"
              >
                🎯 Focus
              </button>
              <button onClick={toggleDarkMode} className="btn-ghost w-9 h-9 rounded-xl text-lg">
                {darkMode ? '☀️' : '🌙'}
              </button>
              <button onClick={() => { logout(); navigate('/login') }} className="btn-ghost text-xs px-3 py-1.5 text-red-500">
                Sign out
              </button>
            </div>
          </header>
        )}

        {/* Focus mode exit bar */}
        {focusMode && (
          <div className="flex justify-between items-center px-4 py-2 bg-primary-600 text-white text-xs">
            <span>🎯 Focus Mode — Press F to exit</span>
            <button onClick={toggleFocusMode} className="underline">Exit</button>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
