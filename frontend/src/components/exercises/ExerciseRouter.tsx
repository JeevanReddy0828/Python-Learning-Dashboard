import { useState, useEffect } from 'react'
import type { LessonDetail } from '../../types'
import { useLessonStore } from '../../store/lessonStore'
import FillInBlanks from './FillInBlanks'
import MCQQuiz from './MCQQuiz'
import DebugChallenge from './DebugChallenge'
import MiniProject from './MiniProject'
import ExerciseFeedback from './ExerciseFeedback'

interface Props {
  lesson: LessonDetail
  onAllDone?: () => void
}

function CompletionScreen({ lesson, onNext }: { lesson: LessonDetail; onNext: () => void }) {
  const [countdown, setCountdown] = useState(5)
  const hasNext = !!lesson.next_lesson_id

  useEffect(() => {
    if (!hasNext) return
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(id); onNext(); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [hasNext, onNext])

  return (
    <div className="text-center py-12 space-y-6 animate-fade-in">
      <div className="text-6xl">🎊</div>
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">All exercises done!</h2>
        <p className="text-gray-500 mt-1">You crushed every challenge in this lesson.</p>
      </div>

      {hasNext ? (
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 rounded-2xl px-5 py-3">
            <span className="text-sm text-gray-500">Up next:</span>
            <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">{lesson.next_lesson_title}</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <button onClick={onNext} className="btn-primary px-8 py-3 text-base">
              Next Lesson →
            </button>
            <p className="text-xs text-gray-400">Auto-advancing in {countdown}s…</p>
          </div>

          {/* Countdown ring */}
          <div className="flex justify-center mt-1">
            <svg width="44" height="44" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="18" fill="none" stroke="#E5E7EB" strokeWidth="3" />
              <circle
                cx="22" cy="22" r="18" fill="none"
                stroke="#7C3AED" strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 18}`}
                strokeDashoffset={`${2 * Math.PI * 18 * (1 - countdown / 5)}`}
                strokeLinecap="round"
                transform="rotate(-90 22 22)"
                className="transition-all duration-1000"
              />
              <text x="22" y="26" textAnchor="middle" fontSize="13" fill="#7C3AED" fontWeight="700">{countdown}</text>
            </svg>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-gray-500 text-sm">You've reached the end of this module's lessons!</p>
          <button onClick={onNext} className="btn-secondary px-6 py-2">
            ← Back to Modules
          </button>
        </div>
      )}
    </div>
  )
}

export default function ExerciseRouter({ lesson, onAllDone }: Props) {
  const { currentExerciseIndex, setExerciseIndex } = useLessonStore()
  const exercises = lesson.exercises
  const [lastResult, setLastResult] = useState<{ passed: boolean; feedback: string; xp: number } | null>(null)

  const exercise = exercises[currentExerciseIndex]

  if (!exercise) {
    return <CompletionScreen lesson={lesson} onNext={() => onAllDone?.()} />
  }

  const handleResult = (passed: boolean, feedback: string, xp: number) => {
    setLastResult({ passed, feedback, xp })
    if (passed) {
      setTimeout(() => {
        setLastResult(null)
        if (currentExerciseIndex < exercises.length - 1) {
          setExerciseIndex(currentExerciseIndex + 1)
        }
      }, 2000)
    }
  }

  const props = { exercise, onResult: handleResult }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Progress */}
      <div className="flex items-center gap-3 mb-6">
        {exercises.map((ex, i) => (
          <button
            key={ex.id}
            onClick={() => { setLastResult(null); setExerciseIndex(i) }}
            className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
              i === currentExerciseIndex ? 'bg-primary-600 text-white scale-110' :
              ex.status === 'passed' ? 'bg-success-500 text-white' :
              'bg-gray-200 dark:bg-gray-700 text-gray-500'
            }`}
          >
            {ex.status === 'passed' ? '✓' : i + 1}
          </button>
        ))}
        <span className="text-sm text-gray-400 ml-auto">{currentExerciseIndex + 1} of {exercises.length}</span>
      </div>

      {lastResult && <ExerciseFeedback passed={lastResult.passed} feedback={lastResult.feedback} xp={lastResult.xp} />}

      {!lastResult?.passed && (
        <>
          {exercise.type === 'fill_blank' && <FillInBlanks {...props} />}
          {exercise.type === 'mcq' && <MCQQuiz {...props} />}
          {exercise.type === 'debug' && <DebugChallenge {...props} />}
          {exercise.type === 'mini_project' && <MiniProject {...props} />}
        </>
      )}
    </div>
  )
}
