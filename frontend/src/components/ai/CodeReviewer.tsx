import { useState } from 'react'
import { aiApi } from '../../api'
import type { ReviewResponse, ExerciseSummary } from '../../types'

interface Props {
  code: string
  exercise?: ExerciseSummary
}

export default function CodeReviewer({ code, exercise }: Props) {
  const [review, setReview] = useState<ReviewResponse | null>(null)
  const [loading, setLoading] = useState(false)

  async function doReview() {
    if (!code.trim()) return
    setLoading(true)
    try {
      const res = await aiApi.review(code, exercise?.id, exercise?.title)
      setReview(res.data)
    } catch {
      setReview(null)
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = review
    ? review.score >= 80 ? 'text-success-500' : review.score >= 60 ? 'text-warning-500' : 'text-red-500'
    : 'text-gray-400'

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Get AI feedback on your code — strengths, suggestions, and a score.</p>

      <button onClick={doReview} disabled={loading || !code.trim()} className="btn-primary w-full py-3">
        {loading ? '🔍 Reviewing...' : '🔍 Review My Code'}
      </button>

      {!code.trim() && <p className="text-xs text-gray-400 text-center">Write some code first</p>}

      {review && (
        <div className="space-y-4 animate-slide-up">
          {/* Score ring */}
          <div className="flex justify-center py-2">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none" strokeWidth="8"
                  stroke={review.score >= 80 ? '#10b981' : review.score >= 60 ? '#f59e0b' : '#ef4444'}
                  strokeDasharray={`${2 * Math.PI * 42 * review.score / 100} ${2 * Math.PI * 42}`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="text-center">
                <span className={`text-2xl font-bold ${scoreColor}`}>{review.score}</span>
                <span className="block text-xs text-gray-400">/100</span>
              </div>
            </div>
          </div>

          {/* Strengths */}
          {review.strengths.length > 0 && (
            <div className="bg-success-50 dark:bg-green-900/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-success-600 mb-2">✅ What you did well</p>
              <ul className="space-y-1">
                {review.strengths.map((s, i) => <li key={i} className="text-sm text-gray-700 dark:text-gray-300">• {s}</li>)}
              </ul>
            </div>
          )}

          {/* Feedback */}
          {review.feedback.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-600 mb-2">📋 Observations</p>
              <ul className="space-y-1">
                {review.feedback.map((f, i) => <li key={i} className="text-sm text-gray-700 dark:text-gray-300">• {f}</li>)}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {review.suggestions.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-600 mb-2">💡 Suggestions</p>
              <ul className="space-y-1">
                {review.suggestions.map((s, i) => <li key={i} className="text-sm text-gray-700 dark:text-gray-300">• {s}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
