import { useNavigate } from 'react-router-dom'
import type { Module } from '../../types'

export default function ModuleCard({ module: mod }: { module: Module }) {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => navigate('/modules')}
      className="card-hover p-5 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{mod.icon}</span>
        <span className="badge-primary text-xs">{mod.completion_percent}%</span>
      </div>
      <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">{mod.title}</h3>
      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{mod.description}</p>
      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 rounded-full transition-all duration-500"
          style={{ width: `${mod.completion_percent}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-2">{mod.lesson_count} lessons</p>
    </div>
  )
}
