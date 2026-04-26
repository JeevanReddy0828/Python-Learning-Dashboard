import type { ProgressSummary } from '../../types'

interface Props {
  summary: ProgressSummary
}

export default function StatsGrid({ summary }: Props) {
  const stats = [
    { label: 'Lessons Done', value: summary.completed_lessons, total: summary.total_lessons, icon: '📖', color: 'text-primary-600' },
    { label: 'Exercises Passed', value: summary.completed_exercises, total: summary.total_exercises, icon: '⚡', color: 'text-success-500' },
    { label: 'Overall Progress', value: `${summary.overall_percent}%`, icon: '🎯', color: 'text-purple-600' },
    { label: 'Remaining', value: summary.total_lessons - summary.completed_lessons, icon: '📋', color: 'text-gray-500' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="card p-5 text-center hover:shadow-md transition-shadow">
          <div className="text-2xl mb-2">{s.icon}</div>
          <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          {'total' in s && s.total !== undefined && (
            <div className="text-xs text-gray-400">of {s.total}</div>
          )}
          <div className="text-xs text-gray-500 mt-1">{s.label}</div>
        </div>
      ))}
    </div>
  )
}
