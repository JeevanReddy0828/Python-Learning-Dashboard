import { useState } from 'react'
import type { LessonDetail } from '../../types'
import { useLessonStore } from '../../store/lessonStore'
import FillInBlanks from './FillInBlanks'
import MCQQuiz from './MCQQuiz'
import DebugChallenge from './DebugChallenge'
import MiniProject from './MiniProject'
import ExerciseFeedback from './ExerciseFeedback'

interface Props {
  lesson: LessonDetail
}

export default function ExerciseRouter({ lesson }: Props) {
  const { currentExerciseIndex, setExerciseIndex } = useLessonStore()
  const exercises = lesson.exercises
  const [lastResult, setLastResult] = useState<{ passed: boolean; feedback: string; xp: number } | null>(null)

  const exercise = exercises[currentExerciseIndex]

  if (!exercise) {
    return (
      <div className="text-center py-12 space-y-4 animate-fade-in">
        <div className="text-5xl">🎊</div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">All done!</h2>
        <p className="text-gray-500">You completed all exercises in this lesson.</p>
      </div>
    )
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
