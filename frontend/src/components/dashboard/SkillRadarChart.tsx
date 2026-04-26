import { useEffect, useState } from 'react'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'
import { modulesApi } from '../../api'
import { useUIStore } from '../../store/uiStore'

export default function SkillRadarChart() {
  const [data, setData] = useState<{ skill: string; score: number }[]>([])
  const darkMode = useUIStore((s) => s.darkMode)

  useEffect(() => {
    modulesApi.list().then((r) => {
      setData(r.data.map((m) => ({ skill: m.icon + ' ' + m.title.split(' ')[0], score: m.completion_percent })))
    }).catch(() => {})
  }, [])

  if (data.length === 0) return <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data}>
        <PolarGrid stroke={darkMode ? '#374151' : '#e5e7eb'} />
        <PolarAngleAxis dataKey="skill" tick={{ fill: darkMode ? '#9ca3af' : '#6b7280', fontSize: 11 }} />
        <Radar dataKey="score" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.25} />
        <Tooltip formatter={(v: number) => [`${v}%`, 'Completion']} contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
      </RadarChart>
    </ResponsiveContainer>
  )
}
