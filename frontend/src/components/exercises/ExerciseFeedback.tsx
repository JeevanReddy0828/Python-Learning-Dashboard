interface Props {
  passed: boolean
  feedback: string
  xp: number
}

export default function ExerciseFeedback({ passed, feedback, xp }: Props) {
  return (
    <div className={`rounded-2xl p-5 border-2 animate-bounce-soft ${
      passed
        ? 'bg-success-50 dark:bg-green-900/20 border-success-500'
        : 'bg-red-50 dark:bg-red-900/20 border-red-300'
    }`}>
      <div className="flex items-center gap-3">
        <span className="text-3xl">{passed ? '🎉' : '😅'}</span>
        <div>
          <p className="font-semibold text-gray-800 dark:text-gray-100">
            {passed ? `Correct! +${xp} XP` : 'Not quite — try again!'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 whitespace-pre-wrap">{feedback}</p>
        </div>
      </div>
    </div>
  )
}
