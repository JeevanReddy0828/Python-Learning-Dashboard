import { useState } from 'react'
import type { ExerciseSummary } from '../../types'
import { exercisesApi } from '../../api'
import { useGamificationStore } from '../../store/gamificationStore'

interface Props {
  exercise: ExerciseSummary & { instructions: string; options: { label: string }[] | null; hints: string[] }
  onResult: (passed: boolean, feedback: string, xp: number) => void
}

export default function MCQQuiz({ exercise, onResult }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hintIndex, setHintIndex] = useState(-1)
  const { addXPEvent, triggerConfetti } = useGamificationStore()

  async function handleSubmit() {
    if (!selected || loading) return
    setLoading(true)
    setSubmitted(true)
    try {
      const res = await exercisesApi.submit(exercise.id, { answer: selected })
      const { passed, feedback, xp_gained, new_achievements } = res.data
      if (passed) {
        addXPEvent(xp_gained, 'Correct answer!')
        triggerConfetti('small')
        if (new_achievements.length > 0) useGamificationStore.getState().addAchievements(new_achievements)
      }
      onResult(passed, feedback, xp_gained)
    } catch {
      onResult(false, 'Something went wrong. Try again!', 0)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="badge-primary">Multiple Choice</span>
          <span className="text-xs text-yellow-500 font-medium">+{exercise.xp_reward} XP</span>
        </div>
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-lg mb-4">{exercise.instructions}</h3>

        <div className="space-y-2">
          {(exercise.options || []).map((opt) => (
            <button
              key={opt.label}
              onClick={() => !submitted && setSelected(opt.label)}
              disabled={submitted}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                selected === opt.label
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={handleSubmit}
            disabled={!selected || loading || submitted}
            className="btn-primary flex-1 py-2.5"
          >
            {loading ? 'Checking...' : 'Submit Answer'}
          </button>
          {exercise.hints.length > 0 && hintIndex < exercise.hints.length - 1 && (
            <button
              onClick={() => setHintIndex((h) => h + 1)}
              className="btn-secondary px-4"
            >
              💡 Hint
            </button>
          )}
        </div>

        {hintIndex >= 0 && (
          <div className="mt-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-sm text-amber-700 dark:text-amber-300">
            💡 {exercise.hints[hintIndex]}
          </div>
        )}
      </div>
    </div>
  )
}
