import { useState } from 'react'
import { aiApi } from '../../api'

/**
 * "I need to learn [topic] fast. Build me a 20-hour plan focused on the 20%
 *  that drives 80% of results. Break it into 10 two-hour sessions with the
 *  best resources and a 15-min review at the end of each."
 */

interface Session {
  number: number
  title: string
  focus: string
  keyTopics: string[]
  resources: string[]
  review: string
}

export default function LearningPlanGenerator() {
  const [topic, setTopic] = useState('')
  const [plan, setPlan] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedSession, setExpandedSession] = useState<number | null>(0)

  async function generatePlan() {
    if (!topic.trim()) return
    setLoading(true)
    setPlan([])

    const prompt = `I need to learn "${topic}" fast. Create a 20-hour learning plan using the 80/20 principle — focus on the 20% of concepts that drive 80% of results.

Break it into exactly 10 two-hour sessions. For each session return a JSON array with this structure:
[{
  "number": 1,
  "title": "Session 1: [title]",
  "focus": "What this session achieves in one sentence",
  "keyTopics": ["topic 1", "topic 2", "topic 3"],
  "resources": ["Specific resource: description", "Specific resource: description"],
  "review": "15-minute review task: [specific quiz/exercise]"
}]

Be extremely practical. No fluff. Focus on the highest-leverage concepts only.
Return ONLY valid JSON array, no other text.`

    try {
      const res = await aiApi.chat(prompt, '', topic)
      const raw = res.data.response
      const jsonMatch = raw.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const sessions = JSON.parse(jsonMatch[0]) as Session[]
        setPlan(sessions)
        setExpandedSession(0)
      }
    } catch {
      // fallback demo plan
      setPlan(getDemoPlan(topic))
    } finally {
      setLoading(false)
    }
  }

  const totalHours = 20
  const sessionHours = 2

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-bold mb-1">⚡ 20-Hour Fast Learning Plan</h2>
        <p className="text-primary-100 text-sm">
          The 20% of knowledge that gives 80% of results. 10 sessions × 2 hours + 15-min reviews.
        </p>
      </div>

      {/* Input */}
      <div className="card p-5 space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          What do you want to learn fast?
        </label>
        <div className="flex gap-3">
          <input
            className="input flex-1"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generatePlan()}
            placeholder="e.g. Python decorators, async/await, web scraping..."
          />
          <button onClick={generatePlan} disabled={loading || !topic.trim()} className="btn-primary px-6 shrink-0">
            {loading ? '⏳ Building...' : '🚀 Build Plan'}
          </button>
        </div>
      </div>

      {/* Stats */}
      {plan.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Hours', value: `${totalHours}h`, icon: '⏱️' },
            { label: 'Sessions', value: plan.length, icon: '📅' },
            { label: 'Daily Reviews', value: '15 min', icon: '📝' },
          ].map((s) => (
            <div key={s.label} className="card p-4 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xl font-bold text-primary-600 dark:text-primary-400">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Session list */}
      {plan.map((session, idx) => (
        <div key={session.number} className="card overflow-hidden">
          <button
            onClick={() => setExpandedSession(expandedSession === idx ? null : idx)}
            className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center shrink-0">
              <span className="font-bold text-primary-700 dark:text-primary-300 text-sm">{session.number}</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">{session.title}</h3>
              <p className="text-sm text-gray-500 mt-0.5">{session.focus}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-400">{sessionHours}h</span>
              <span className="text-gray-400">{expandedSession === idx ? '▲' : '▼'}</span>
            </div>
          </button>

          {expandedSession === idx && (
            <div className="px-5 pb-5 space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4 animate-fade-in">
              {/* Key Topics */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">🎯 Key Topics (80/20)</p>
                <div className="flex flex-wrap gap-2">
                  {session.keyTopics.map((t, i) => (
                    <span key={i} className="badge-primary text-xs">{t}</span>
                  ))}
                </div>
              </div>

              {/* Resources */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">📚 Best Resources</p>
                <ul className="space-y-1">
                  {session.resources.map((r, i) => (
                    <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                      <span className="text-primary-400 shrink-0">→</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 15-min Review */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <p className="text-xs font-semibold text-amber-600 mb-1">⏱️ 15-Minute Review</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{session.review}</p>
              </div>
            </div>
          )}
        </div>
      ))}

      {loading && (
        <div className="text-center py-8 space-y-3">
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-3 h-3 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
          <p className="text-gray-500 text-sm">Building your personalized 20-hour plan...</p>
        </div>
      )}
    </div>
  )
}

function getDemoPlan(topic: string): Session[] {
  return Array.from({ length: 10 }, (_, i) => ({
    number: i + 1,
    title: `Session ${i + 1}: Core Concept ${i + 1}`,
    focus: `Master the fundamentals of ${topic} — session ${i + 1} of 10`,
    keyTopics: ['Concept A', 'Concept B', 'Practice exercise'],
    resources: [`Official ${topic} documentation`, 'Interactive coding exercise'],
    review: `Write 3 sentences explaining what you learned. Then code one small example from scratch without looking at notes.`,
  }))
}
