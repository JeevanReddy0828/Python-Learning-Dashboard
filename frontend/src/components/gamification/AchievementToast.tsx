import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { useGamificationStore } from '../../store/gamificationStore'

export default function AchievementToast() {
  const { newAchievements, clearAchievements } = useGamificationStore()

  useEffect(() => {
    if (newAchievements.length === 0) return

    newAchievements.forEach((a) => {
      toast.custom(
        (t) => (
          <div className={`bg-white dark:bg-surface-dark rounded-2xl shadow-lg border-2 border-yellow-300 p-4 flex items-center gap-3 transition-all ${t.visible ? 'animate-slide-up' : 'opacity-0'}`}>
            <span className="text-3xl">{a.icon}</span>
            <div>
              <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">Achievement unlocked! 🏆</p>
              <p className="text-sm text-primary-600 font-semibold">{a.title}</p>
              <p className="text-xs text-gray-500">{a.description}</p>
              <p className="text-xs text-yellow-500 font-semibold mt-0.5">+{a.xp_reward} XP</p>
            </div>
          </div>
        ),
        { duration: 5000 }
      )
    })

    clearAchievements()
  }, [newAchievements, clearAchievements])

  return null
}
