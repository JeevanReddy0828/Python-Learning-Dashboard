import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { modulesApi } from '../api'
import type { ModuleDetail } from '../types'
import LessonCard from '../components/curriculum/LessonCard'

export default function ModulesPage() {
  const [modules, setModules] = useState<ModuleDetail[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    modulesApi.list().then(async (r) => {
      const details = await Promise.all(
        r.data.map((m) => modulesApi.get(m.slug).then((d) => d.data))
      )
      setModules(details)
      if (details.length > 0) setSelected(details[0].id)
    }).catch((err) => {
      setError(err?.response?.data?.detail || err?.message || 'Failed to load modules')
    }).finally(() => setLoading(false))
  }, [])

  const currentModule = modules.find((m) => m.id === selected)

  if (loading) return <div className="p-8 text-center text-gray-400">Loading curriculum...</div>
  if (error) return <div className="p-8 text-center text-red-400">⚠️ {error}</div>

  return (
    <div className="flex h-full">
      {/* Module list sidebar */}
      <aside className="w-72 shrink-0 border-r border-gray-100 dark:border-gray-700 overflow-y-auto p-4 space-y-2">
        <h2 className="font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider px-2 mb-3">Modules</h2>
        {modules.map((mod) => (
          <button
            key={mod.id}
            onClick={() => setSelected(mod.id)}
            className={`w-full text-left px-3 py-3 rounded-xl transition-all ${
              selected === mod.id
                ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{mod.icon}</span>
              <span className="font-medium text-sm">{mod.title}</span>
            </div>
            <div className="flex items-center gap-2 pl-8">
              <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all"
                  style={{ width: `${mod.completion_percent}%` }}
                />
              </div>
              <span className="text-xs text-gray-400">{mod.completion_percent}%</span>
            </div>
          </button>
        ))}
      </aside>

      {/* Lesson list */}
      <main className="flex-1 overflow-y-auto p-6">
        {currentModule && (
          <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">{currentModule.icon}</span>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{currentModule.title}</h1>
                  <p className="text-gray-500">{currentModule.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-3">
                <span>📖 {currentModule.lesson_count} lessons</span>
                <span>✅ {currentModule.completion_percent}% complete</span>
              </div>
            </div>

            <div className="space-y-3">
              {currentModule.lessons.map((lesson, idx) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  index={idx}
                  onClick={() => navigate(`/lessons/${lesson.id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
