import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { lessonsApi } from '../api'
import type { LessonDetail } from '../types'
import { useLessonStore } from '../store/lessonStore'
import LessonContent from '../components/curriculum/LessonContent'
import ExerciseRouter from '../components/exercises/ExerciseRouter'
import AIPanel from '../components/ai/AIPanel'
import MicroWin from '../components/adhd/MicroWin'
import { useGamificationStore } from '../store/gamificationStore'
import { useModulesStore } from '../store/modulesStore'
import toast from 'react-hot-toast'

export default function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState<LessonDetail | null>(null)
  const [view, setView] = useState<'lesson' | 'exercises'>('lesson')
  const [loading, setLoading] = useState(true)
  const startTime = useRef(Date.now())
  const { setLesson: storSetLesson } = useLessonStore()
  const { triggerConfetti, addXPEvent } = useGamificationStore()
  const { refresh: refreshModules } = useModulesStore()
  const [showMicroWin, setShowMicroWin] = useState(false)

  useEffect(() => {
    if (!lessonId) return
    setLoading(true)
    lessonsApi.get(lessonId)
      .then((r) => {
        setLesson(r.data)
        storSetLesson(r.data)
        lessonsApi.start(lessonId).catch(() => {})
      })
      .finally(() => setLoading(false))
    startTime.current = Date.now()
  }, [lessonId])

  // Show micro-win nudge after 2 min
  useEffect(() => {
    const t = setTimeout(() => setShowMicroWin(true), 2 * 60 * 1000)
    return () => clearTimeout(t)
  }, [lessonId])

  async function handleAllDone() {
    if (!lessonId || !lesson) return
    const timeSpent = Math.round((Date.now() - startTime.current) / 1000)
    try {
      const res = await lessonsApi.complete(lessonId, timeSpent)
      const data = res.data
      if (data.xp_gained > 0) {
        addXPEvent(data.xp_gained, 'Lesson complete!')
        triggerConfetti(data.level_up ? 'large' : 'medium')
        toast.success(`Lesson complete! +${data.xp_gained} XP 🎉`)
      }
      if (data.level_up) toast.success(`Level up! You're now Level ${data.new_level} ⬆️`, { duration: 5000 })
    } catch { /* already completed */ }

    refreshModules().catch(() => {})
    if (lesson.next_lesson_id) {
      navigate(`/lessons/${lesson.next_lesson_id}`)
    } else {
      navigate('/modules')
    }
  }

  async function handleCompleteLesson() {
    if (!lessonId || !lesson) return
    const timeSpent = Math.round((Date.now() - startTime.current) / 1000)
    try {
      const res = await lessonsApi.complete(lessonId, timeSpent)
      const data = res.data
      if (data.xp_gained > 0) {
        addXPEvent(data.xp_gained, 'Lesson complete!')
        triggerConfetti(data.level_up ? 'large' : 'medium')
        toast.success(`Lesson complete! +${data.xp_gained} XP 🎉`)
      }
      if (data.level_up) toast.success(`Level up! You're now Level ${data.new_level} ⬆️`, { duration: 5000 })
    } catch { /* already completed */ }
    navigate(-1)
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Loading lesson...</div>
  if (!lesson) return <div className="p-8 text-center text-gray-400">Lesson not found</div>

  return (
    <div className="flex h-full">
      {showMicroWin && <MicroWin onDismiss={() => setShowMicroWin(false)} />}

      {/* Main lesson/exercise area */}
      <div className="flex-1 overflow-y-auto">
        {/* Lesson header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-gray-700 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="btn-ghost text-gray-400 text-sm px-2">← Back</button>
            <div>
              <h1 className="font-semibold text-gray-800 dark:text-gray-100">{lesson.title}</h1>
              <p className="text-xs text-gray-400">{lesson.estimated_min} min · {lesson.xp_reward} XP</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('lesson')}
              className={`btn text-sm px-4 py-1.5 ${view === 'lesson' ? 'btn-primary' : 'btn-ghost'}`}
            >📖 Learn</button>
            <button
              onClick={() => setView('exercises')}
              className={`btn text-sm px-4 py-1.5 ${view === 'exercises' ? 'btn-primary' : 'btn-ghost'}`}
            >⚡ Practice ({lesson.exercises.length})</button>
          </div>
        </div>

        <div className="p-6 max-w-lesson mx-auto">
          {view === 'lesson' ? (
            <div className="space-y-6 animate-fade-in">
              {/* ELI5 card */}
              <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-2xl p-5">
                <p className="text-xs font-semibold text-primary-500 uppercase tracking-wider mb-1">💡 In a nutshell</p>
                <p className="text-gray-800 dark:text-gray-200 font-medium">{lesson.eli5_summary}</p>
              </div>

              {/* Analogy card */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-2xl p-5">
                <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-1">🔍 Think of it like this</p>
                <p className="text-gray-700 dark:text-gray-300">{lesson.analogy}</p>
              </div>

              <LessonContent html={lesson.content_html} diagramData={lesson.diagram_data} />

              <div className="flex gap-3 pt-4">
                <button onClick={() => setView('exercises')} className="btn-primary flex-1 py-3">
                  Practice Time! ⚡
                </button>
                <button onClick={handleCompleteLesson} className="btn-secondary px-6 py-3">
                  Mark Complete ✓
                </button>
              </div>
            </div>
          ) : (
            <ExerciseRouter lesson={lesson} onAllDone={handleAllDone} />
          )}
        </div>
      </div>

      {/* AI Panel */}
      <AIPanel lesson={lesson} />
    </div>
  )
}
