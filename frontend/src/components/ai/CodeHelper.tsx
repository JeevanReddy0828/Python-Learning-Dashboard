import { useState } from 'react'
import { aiApi } from '../../api'
import type { ExerciseSummary } from '../../types'
import { useLessonStore } from '../../store/lessonStore'

interface Props {
  code: string
  exercise?: ExerciseSummary
}

export default function CodeHelper({ code, exercise }: Props) {
  const [hint, setHint] = useState('')
  const [loading, setLoading] = useState(false)
  const { hintLevel, incrementHint } = useLessonStore()

  async function getHint() {
    if (!exercise || !code.trim()) return
    setLoading(true)
    try {
      const res = await aiApi.hint(code, exercise.id, hintLevel)
      setHint(res.data.hint)
      incrementHint()
    } catch {
      setHint('Could not load hint. Make sure OPENAI_API_KEY is configured.')
    } finally {
      setLoading(false)
    }
  }

  if (!exercise) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-3xl mb-2">💡</p>
        <p className="text-sm">Open an exercise first to get hints</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4">
        <p className="text-xs font-semibold text-primary-500 mb-1">Current exercise</p>
        <p className="text-sm text-gray-700 dark:text-gray-300">{exercise.title}</p>
      </div>

      {/* Hint level indicator */}
      <div className="flex gap-1.5 items-center">
        {[1, 2, 3].map((level) => (
          <div
            key={level}
            className={`h-2 flex-1 rounded-full ${
              hintLevel > level ? 'bg-primary-500' :
              hintLevel === level ? 'bg-primary-300' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
        <span className="text-xs text-gray-400 ml-1">Hint {Math.min(hintLevel, 3)}/3</span>
      </div>

      <button
        onClick={getHint}
        disabled={loading || !code.trim()}
        className="btn-primary w-full py-3"
      >
        {loading ? '🤔 Thinking...' : hintLevel === 1 ? '💡 Get First Hint' : `💡 Get Hint ${Math.min(hintLevel, 3)}`}
      </button>

      {!code.trim() && (
        <p className="text-xs text-gray-400 text-center">Write some code in the editor first</p>
      )}

      {hint && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 animate-slide-up">
          <p className="text-xs font-semibold text-amber-600 mb-2">💡 Hint</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{hint}</p>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        {hintLevel <= 3 ? `${4 - hintLevel} hint${4 - hintLevel !== 1 ? 's' : ''} remaining` : 'All hints used — you can do it!'}
      </p>
    </div>
  )
}
