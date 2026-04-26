import { usePomodoro } from '../../hooks/usePomodoro'
import { cn } from '../../utils/cn'

const PHASE_CONFIG = {
  work: { label: 'Focus', color: '#7C3AED', bg: 'bg-primary-100 dark:bg-primary-900/40', text: 'text-primary-700 dark:text-primary-300' },
  short_break: { label: 'Break', color: '#10B981', bg: 'bg-success-50 dark:bg-green-900/30', text: 'text-success-600' },
  long_break: { label: 'Long Break', color: '#3B82F6', bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600' },
}

interface Props {
  compact?: boolean
}

const R = 40
const CIRCUMFERENCE = 2 * Math.PI * R

export default function PomodoroTimer({ compact = false }: Props) {
  const { phase, minutes, seconds, progress, isActive, completedPomodoros, start, pause, reset } = usePomodoro()
  const cfg = PHASE_CONFIG[phase]
  const dash = CIRCUMFERENCE * (1 - progress)

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs', cfg.bg)}>
        <div className="relative w-6 h-6">
          <svg viewBox="0 0 100 100" className="-rotate-90 w-full h-full">
            <circle cx="50" cy="50" r={R} fill="none" stroke="#e5e7eb" strokeWidth="12" />
            <circle
              cx="50" cy="50" r={R} fill="none" strokeWidth="12"
              stroke={cfg.color}
              strokeDasharray={`${CIRCUMFERENCE * progress} ${CIRCUMFERENCE}`}
              strokeLinecap="round"
            />
          </svg>
        </div>
        <span className={cn('font-mono font-bold', cfg.text)}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
        <button
          onClick={isActive ? pause : start}
          className={cn('text-xs font-medium', cfg.text)}
        >
          {isActive ? '⏸' : '▶'}
        </button>
      </div>
    )
  }

  return (
    <div className={cn('rounded-2xl p-6 text-center space-y-4', cfg.bg)}>
      <div className="flex items-center justify-center gap-2">
        <span className={cn('text-xs font-semibold uppercase tracking-wider', cfg.text)}>{cfg.label}</span>
        {completedPomodoros > 0 && (
          <span className="text-xs text-gray-400">🍅 × {completedPomodoros}</span>
        )}
      </div>

      {/* SVG ring */}
      <div className="flex justify-center">
        <div className="relative w-36 h-36">
          <svg viewBox="0 0 100 100" className="-rotate-90 w-full h-full">
            <circle cx="50" cy="50" r={R} fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle
              cx="50" cy="50" r={R} fill="none" strokeWidth="8"
              stroke={cfg.color}
              strokeDasharray={`${CIRCUMFERENCE * progress} ${CIRCUMFERENCE}`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn('font-mono text-3xl font-bold', cfg.text)}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <button onClick={isActive ? pause : start} className="btn-primary px-6 py-2">
          {isActive ? '⏸ Pause' : '▶ Start'}
        </button>
        <button onClick={reset} className="btn-ghost px-4 py-2">↺</button>
      </div>
    </div>
  )
}
