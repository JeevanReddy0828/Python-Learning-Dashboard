import type { LessonSummary } from '../../types'
import { cn } from '../../utils/cn'

interface Props {
  lesson: LessonSummary
  index: number
  onClick: () => void
}

const STATUS_CONFIG = {
  completed: { icon: '✅', color: 'text-success-500', bg: 'bg-success-50 dark:bg-green-900/20' },
  in_progress: { icon: '▶️', color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20' },
  not_started: { icon: '⭕', color: 'text-gray-400', bg: 'bg-gray-50 dark:bg-gray-800' },
}

export default function LessonCard({ lesson, index, onClick }: Props) {
  const cfg = STATUS_CONFIG[lesson.status]
  return (
    <button
      onClick={onClick}
      className={cn('w-full text-left card-hover p-4 flex items-center gap-4', cfg.bg)}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-surface-dark border-2 border-gray-200 dark:border-gray-600 text-lg shrink-0">
        {cfg.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-mono">#{index + 1}</span>
          <h3 className="font-medium text-gray-800 dark:text-gray-100 truncate">{lesson.title}</h3>
        </div>
        <p className="text-sm text-gray-500 truncate mt-0.5">{lesson.eli5_summary}</p>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-xs text-gray-400">{lesson.estimated_min} min</div>
        <div className="text-xs font-medium text-yellow-500 mt-0.5">+{lesson.xp_reward} XP</div>
      </div>
    </button>
  )
}
