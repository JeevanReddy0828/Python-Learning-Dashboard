import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { usersApi } from '../api'
import type { UserStats } from '../types'
import XPBar from '../components/gamification/XPBar'
import SkillRadarChart from '../components/dashboard/SkillRadarChart'
import NotionExport from '../components/profile/NotionExport'

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const [stats, setStats] = useState<UserStats | null>(null)

  useEffect(() => {
    usersApi.stats().then((r) => setStats(r.data)).catch(() => {})
  }, [])

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in space-y-6">
      <div className="card p-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-4xl">
          {user?.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover rounded-2xl" /> : '🧑‍💻'}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{user?.display_name}</h1>
          <p className="text-gray-500 text-sm">{user?.email}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="badge-primary">Level {user?.level}</span>
            <span className="text-sm text-yellow-500 font-medium">⭐ {user?.xp} XP</span>
          </div>
        </div>
      </div>

      {user && (
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Progress</h2>
          <XPBar xp={user.xp} level={user.level} />
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Lessons Done', value: stats.lessons_completed, icon: '📖' },
            { label: 'Exercises Passed', value: stats.exercises_completed, icon: '⚡' },
            { label: 'Completion', value: `${stats.completion_percent}%`, icon: '✅' },
            { label: 'Total XP', value: stats.total_xp, icon: '⭐' },
          ].map((s) => (
            <div key={s.label} className="card p-4 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card p-5">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Skills Radar</h2>
        <SkillRadarChart />
      </div>

      <NotionExport />
    </div>
  )
}
