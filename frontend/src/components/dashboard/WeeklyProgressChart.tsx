import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'
import type { WeeklyActivity } from '../../types'
import { useUIStore } from '../../store/uiStore'

interface Props {
  data: WeeklyActivity[]
}

export default function WeeklyProgressChart({ data }: Props) {
  const darkMode = useUIStore((s) => s.darkMode)
  const textColor = darkMode ? '#9ca3af' : '#6b7280'
  const gridColor = darkMode ? '#374151' : '#f3f4f6'

  const chartData = data.map((d) => ({
    day: format(parseISO(d.date), 'EEE'),
    xp: d.xp_earned,
    lessons: d.lessons_completed,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="day" tick={{ fill: textColor, fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: textColor, fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: darkMode ? '#242448' : '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            fontSize: '12px',
          }}
          formatter={(value: number, name: string) => [
            `${value}${name === 'xp' ? ' XP' : ' lessons'}`,
            name === 'xp' ? '⭐ XP Earned' : '📖 Lessons'
          ]}
        />
        <Bar dataKey="xp" fill="#7C3AED" radius={[6, 6, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  )
}
