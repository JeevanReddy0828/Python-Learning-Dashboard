import { useState } from 'react'
import { aiApi } from '../../api'

/**
 * "Break [topic] into 5 levels of difficulty. Show me how to go from
 *  Level 1 (beginner) to Level 5 (advanced) with a clear milestone at each step."
 */

interface Level {
  level: number
  label: string
  description: string
  milestone: string
  skills: string[]
  timeEstimate: string
  project: string
}

const LEVEL_CONFIG = [
  { color: 'bg-green-100 dark:bg-green-900/30 border-green-300', badge: 'bg-green-500', emoji: '🌱', name: 'Beginner' },
  { color: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300', badge: 'bg-blue-500', emoji: '📘', name: 'Elementary' },
  { color: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300', badge: 'bg-yellow-500', emoji: '⚡', name: 'Intermediate' },
  { color: 'bg-orange-100 dark:bg-orange-900/30 border-orange-300', badge: 'bg-orange-500', emoji: '🔥', name: 'Advanced' },
  { color: 'bg-purple-100 dark:bg-purple-900/30 border-purple-300', badge: 'bg-purple-600', emoji: '👑', name: 'Expert' },
]

export default function LevelRoadmap() {
  const [topic, setTopic] = useState('')
  const [levels, setLevels] = useState<Level[]>([])
  const [loading, setLoading] = useState(false)
  const [currentLevel, setCurrentLevel] = useState<number | null>(null)

  async function generateRoadmap() {
    if (!topic.trim()) return
    setLoading(true)
    setLevels([])

    const prompt = `Break "${topic}" in Python into exactly 5 levels of difficulty, from absolute beginner to expert.

Return ONLY a JSON array:
[{
  "level": 1,
  "label": "Beginner",
  "description": "What you know and can do at this level (1-2 sentences)",
  "milestone": "Specific, measurable thing you can build/do at this level",
  "skills": ["skill 1", "skill 2", "skill 3", "skill 4"],
  "timeEstimate": "e.g. 2-4 hours",
  "project": "Mini-project that proves you've reached this level"
}]

Make each level clearly distinct. Milestones must be specific and testable.
Return ONLY valid JSON array.`

    try {
      const res = await aiApi.chat(prompt, '', topic)
      const raw = res.data.response
      const match = raw.match(/\[[\s\S]*\]/)
      if (match) setLevels(JSON.parse(match[0]))
    } catch {
      setLevels(getDemoLevels(topic))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl p-5 text-white">
        <h2 className="text-xl font-bold mb-1">🗺️ 5-Level Skill Roadmap</h2>
        <p className="text-orange-100 text-sm">
          From Level 1 (beginner) to Level 5 (expert) with clear milestones at each step.
        </p>
      </div>

      {/* Input */}
      <div className="card p-4 space-y-3">
        <input
          className="input"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && generateRoadmap()}
          placeholder="Topic (e.g. Python OOP, web scraping, data analysis...)"
        />

        <div className="flex gap-3">
          <button onClick={generateRoadmap} disabled={loading || !topic.trim()} className="btn-primary flex-1">
            {loading ? '⏳ Mapping...' : '🗺️ Generate Roadmap'}
          </button>
        </div>
      </div>

      {/* Level self-assessment */}
      {levels.length > 0 && (
        <div className="card p-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Where are you now?</p>
          <div className="flex gap-2">
            {levels.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentLevel(i)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                  currentLevel === i
                    ? `${LEVEL_CONFIG[i].badge} text-white`
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                }`}
              >
                {LEVEL_CONFIG[i].emoji}
              </button>
            ))}
          </div>
          {currentLevel !== null && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              You're at Level {currentLevel + 1} — {LEVEL_CONFIG[currentLevel].name}
            </p>
          )}
        </div>
      )}

      {/* Vertical roadmap */}
      <div className="relative">
        {levels.length > 0 && (
          <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-200 dark:bg-gray-700" />
        )}

        <div className="space-y-4">
          {levels.map((lvl, i) => {
            const cfg = LEVEL_CONFIG[i]
            const isCurrent = currentLevel === i
            const isCompleted = currentLevel !== null && i < currentLevel
            const isLocked = currentLevel !== null && i > currentLevel + 1

            return (
              <div key={lvl.level} className={`relative pl-14 transition-opacity ${isLocked ? 'opacity-50' : ''}`}>
                {/* Level badge */}
                <div className={`absolute left-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                  isCompleted ? 'bg-success-500' : isCurrent ? cfg.badge : 'bg-gray-300 dark:bg-gray-600'
                } shadow-md`}>
                  {isCompleted ? '✓' : cfg.emoji}
                </div>

                <div className={`card border-2 p-5 ${isCurrent ? cfg.color : ''}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800 dark:text-gray-100">Level {lvl.level}: {lvl.label}</span>
                        {isCurrent && <span className="badge-primary text-xs">You are here</span>}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{lvl.timeEstimate}</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{lvl.description}</p>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {lvl.skills.map((s, j) => (
                      <span key={j} className="text-xs px-2.5 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full text-gray-600 dark:text-gray-400">
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Milestone */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-3 mb-2">
                    <p className="text-xs font-semibold text-gray-500 mb-1">🎯 Milestone</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{lvl.milestone}</p>
                  </div>

                  {/* Project */}
                  <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-3">
                    <p className="text-xs font-semibold text-primary-500 mb-1">🚀 Proof of Level</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{lvl.project}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {loading && (
        <div className="text-center py-6 text-gray-400">
          <div className="text-3xl mb-2">🗺️</div>
          <p className="text-sm">Building your skill roadmap...</p>
        </div>
      )}
    </div>
  )
}

function getDemoLevels(topic: string): Level[] {
  const labels = ['Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert']
  return labels.map((label, i) => ({
    level: i + 1,
    label,
    description: `At this level you understand ${topic} ${['basics', 'fundamentals', 'patterns', 'advanced techniques', 'internals'][i]}.`,
    milestone: `You can build a simple ${topic} example from scratch without looking at documentation.`,
    skills: [`${topic} skill ${i * 2 + 1}`, `${topic} skill ${i * 2 + 2}`, `${topic} skill ${i * 2 + 3}`],
    timeEstimate: ['2-4h', '4-8h', '8-20h', '20-40h', '40h+'][i],
    project: `Build a mini-project that demonstrates Level ${i + 1} mastery of ${topic}.`,
  }))
}
