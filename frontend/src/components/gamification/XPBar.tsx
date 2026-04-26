import { useEffect, useRef } from 'react'
import { useGamificationStore } from '../../store/gamificationStore'
import { xpProgressInLevel, xpToNextLevel } from '../../utils/xpCalculator'

interface Props {
  xp: number
  level: number
  compact?: boolean
}

export default function XPBar({ xp, level, compact = false }: Props) {
  const { pendingXPEvents } = useGamificationStore()
  const { current, needed, percent } = xpProgressInLevel(xp, level)
  const barRef = useRef<HTMLDivElement>(null)

  if (compact) {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-primary-600 dark:text-primary-400">Lvl {level}</span>
          <span className="text-gray-400">{current} / {needed} XP</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full transition-all duration-700"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="relative space-y-3">
      {/* Floating XP events */}
      <div className="absolute -top-8 left-0 right-0 pointer-events-none">
        {pendingXPEvents.map((event) => (
          <div key={event.id} className="absolute left-1/2 -translate-x-1/2 animate-float-up">
            <span className="text-yellow-500 font-bold text-sm whitespace-nowrap">+{event.amount} XP</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
            <span className="text-lg font-bold text-primary-700 dark:text-primary-300">{level}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Level {level}</p>
            <p className="text-xs text-gray-400">{current} / {needed} XP to next level</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-yellow-500">⭐ {xp}</p>
          <p className="text-xs text-gray-400">total XP</p>
        </div>
      </div>

      <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          ref={barRef}
          className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full transition-all duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 text-right">{percent}% to Level {level + 1}</p>
    </div>
  )
}
