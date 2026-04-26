import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { progressApi } from '../../api'
import type { WeakArea } from '../../types'

export default function WeakAreasPanel() {
  const [areas, setAreas] = useState<WeakArea[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    progressApi.weakAreas().then((r) => setAreas(r.data)).catch(() => {})
  }, [])

  if (areas.length === 0) return null

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">Areas to strengthen 💪</h2>
      <p className="text-sm text-gray-500 mb-4">These modules could use some more practice</p>
      <div className="space-y-3">
        {areas.map((area) => (
          <div key={area.module_id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex-1">
              <p className="font-medium text-sm text-gray-800 dark:text-gray-100">{area.module_title}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-warning-500 rounded-full" style={{ width: `${area.completion_percent}%` }} />
                </div>
                <span className="text-xs text-gray-400">{area.completion_percent}%</span>
              </div>
            </div>
            <button onClick={() => navigate('/modules')} className="btn-primary text-xs px-3 py-1.5 shrink-0">
              Continue →
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
