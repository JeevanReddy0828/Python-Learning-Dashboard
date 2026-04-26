import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { progressApi, modulesApi } from '../api'
import type { WeeklyActivity, ProgressSummary, Module } from '../types'
import WeeklyProgressChart from '../components/dashboard/WeeklyProgressChart'
import StatsGrid from '../components/dashboard/StatsGrid'
import WeakAreasPanel from '../components/dashboard/WeakAreasPanel'
import ModuleCard from '../components/curriculum/ModuleCard'
import XPBar from '../components/gamification/XPBar'

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [weekly, setWeekly] = useState<WeeklyActivity[]>([])
  const [summary, setSummary] = useState<ProgressSummary | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      progressApi.summary(),
      progressApi.weekly(),
      modulesApi.list(),
    ]).then(([s, w, m]) => {
      setSummary(s.data)
      setWeekly(w.data)
      setModules(m.data)
    }).finally(() => setLoading(false))
  }, [])

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Loading your dashboard...</div>

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {greeting()}, {user?.display_name.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {summary?.overall_percent === 0
            ? "Ready to start your Python journey? Let's go!"
            : `You're ${summary?.overall_percent}% through the curriculum — keep it up!`}
        </p>
      </div>

      {/* XP Bar */}
      {user && (
        <div className="card p-5">
          <XPBar xp={user.xp} level={user.level} />
        </div>
      )}

      {/* Stats */}
      {summary && <StatsGrid summary={summary} />}

      {/* Weekly chart */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">This week's activity</h2>
        <WeeklyProgressChart data={weekly} />
      </div>

      {/* Continue learning */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Continue Learning</h2>
          <button onClick={() => navigate('/modules')} className="text-sm text-primary-600 hover:underline">View all →</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.slice(0, 3).map((mod) => (
            <ModuleCard key={mod.id} module={mod} />
          ))}
        </div>
      </div>

      {/* Weak areas */}
      <WeakAreasPanel />
    </div>
  )
}
