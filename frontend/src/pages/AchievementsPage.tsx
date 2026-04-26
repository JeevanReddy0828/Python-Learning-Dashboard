import { useEffect, useState } from 'react'
import { achievementsApi } from '../api'
import type { AchievementRead } from '../types'
import AchievementCard from '../components/gamification/AchievementCard'

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<AchievementRead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    achievementsApi.list().then((r) => setAchievements(r.data)).finally(() => setLoading(false))
  }, [])

  const earned = achievements.filter((a) => a.earned_at)
  const locked = achievements.filter((a) => !a.earned_at)

  if (loading) return <div className="p-8 text-center text-gray-400">Loading achievements...</div>

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Achievements 🏆</h1>
      <p className="text-gray-500 mb-8">{earned.length} of {achievements.length} unlocked</p>

      {earned.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Earned ({earned.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {earned.map((a) => <AchievementCard key={a.id} achievement={a} />)}
          </div>
        </section>
      )}

      {locked.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Locked ({locked.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {locked.map((a) => <AchievementCard key={a.id} achievement={a} locked />)}
          </div>
        </section>
      )}
    </div>
  )
}
