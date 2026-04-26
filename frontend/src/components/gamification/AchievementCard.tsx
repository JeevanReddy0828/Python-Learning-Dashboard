import type { AchievementRead } from '../../types'
import { cn } from '../../utils/cn'
import { format } from 'date-fns'

interface Props {
  achievement: AchievementRead
  locked?: boolean
}

export default function AchievementCard({ achievement, locked }: Props) {
  return (
    <div className={cn(
      'card p-4 text-center transition-all duration-200',
      locked ? 'opacity-40 grayscale' : 'hover:shadow-md hover:-translate-y-0.5'
    )}>
      <div className="text-3xl mb-2">{locked ? '🔒' : achievement.icon}</div>
      <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-100 mb-1">{achievement.title}</h3>
      <p className="text-xs text-gray-500 mb-2 leading-relaxed">{achievement.description}</p>
      {!locked && achievement.earned_at && (
        <p className="text-xs text-success-500">{format(new Date(achievement.earned_at), 'MMM d')}</p>
      )}
      {!locked && (
        <span className="text-xs font-medium text-yellow-500">+{achievement.xp_reward} XP</span>
      )}
    </div>
  )
}
