import { useState } from 'react'
import { aiApi } from '../../api'
import type { LessonDetail } from '../../types'

/**
 * "Summarize the key concepts of [topic] on a single page.
 *  Use bullet points, diagrams, and examples so I can review it in 5 minutes."
 */

interface RefSection {
  title: string
  emoji: string
  bullets: string[]
  codeExample?: string
}

interface Props {
  lesson?: LessonDetail
}

export default function QuickReference({ lesson }: Props) {
  const [topic, setTopic] = useState(lesson?.title || '')
  const [sections, setSections] = useState<RefSection[]>([])
  const [loading, setLoading] = useState(false)

  async function generateRef() {
    if (!topic.trim()) return
    setLoading(true)
    setSections([])

    const prompt = `Create a single-page 5-minute review reference for "${topic}" in Python.

Return ONLY a JSON array of sections:
[{
  "title": "section title",
  "emoji": "relevant emoji",
  "bullets": ["key point 1", "key point 2", "key point 3"],
  "codeExample": "short python code example (optional, null if not needed)"
}]

Include these sections: Core Concept, Key Syntax, Common Patterns, Watch Out For (gotchas), Quick Quiz.
Keep each bullet under 12 words. Code examples under 5 lines. ADHD-friendly — short and punchy.
Return ONLY valid JSON, no other text.`

    try {
      const res = await aiApi.chat(prompt, '', topic)
      const raw = res.data.response
      const match = raw.match(/\[[\s\S]*\]/)
      if (match) setSections(JSON.parse(match[0]))
    } catch {
      setSections(getDemoSections(topic))
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => window.print()

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl p-5 text-white">
        <h2 className="text-xl font-bold mb-1">📋 5-Minute Quick Reference</h2>
        <p className="text-green-100 text-sm">
          One page. Key concepts only. Bullet points + examples. Review in 5 minutes.
        </p>
      </div>

      {/* Input */}
      <div className="card p-4 flex gap-3">
        <input
          className="input flex-1"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && generateRef()}
          placeholder="Topic to summarize (e.g. Python lists, decorators, classes...)"
        />
        <button onClick={generateRef} disabled={loading || !topic.trim()} className="btn-success px-5 shrink-0">
          {loading ? '📋 Generating...' : '📋 Create Ref Card'}
        </button>
        {sections.length > 0 && (
          <button onClick={handlePrint} className="btn-secondary px-4 shrink-0">🖨️</button>
        )}
      </div>

      {sections.length > 0 && (
        <div className="card p-6 print:shadow-none">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100">{topic} — Quick Reference</h3>
            <span className="badge-success">5 min read</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sections.map((section, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
                  <span>{section.emoji}</span>
                  <span>{section.title}</span>
                </h4>
                <ul className="space-y-1 mb-3">
                  {section.bullets.map((bullet, j) => (
                    <li key={j} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-1.5">
                      <span className="text-primary-400 shrink-0 mt-0.5">•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                {section.codeExample && (
                  <pre className="bg-gray-900 text-green-300 text-xs rounded-lg p-3 overflow-x-auto font-mono whitespace-pre-wrap">
                    {section.codeExample}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-6 text-gray-400 text-sm">
          <div className="text-3xl mb-2">📋</div>
          Generating your single-page reference...
        </div>
      )}
    </div>
  )
}

function getDemoSections(topic: string): RefSection[] {
  return [
    { title: 'Core Concept', emoji: '💡', bullets: [`${topic} is a fundamental Python concept`, 'Used in almost every Python program', 'Master this first, everything else follows'] },
    { title: 'Key Syntax', emoji: '📝', bullets: ['Syntax rule 1', 'Syntax rule 2', 'Syntax rule 3'], codeExample: `# Example\nmy_var = "hello"\nprint(my_var)` },
    { title: 'Common Patterns', emoji: '🔄', bullets: ['Pattern 1: most common use case', 'Pattern 2: iteration', 'Pattern 3: with functions'] },
    { title: 'Watch Out For', emoji: '⚠️', bullets: ['Common mistake 1', 'Common mistake 2', 'Edge case to remember'] },
    { title: 'Quick Quiz', emoji: '🧠', bullets: ['Can you explain it in one sentence?', 'Write a 5-line example from memory', 'What error appears if you misuse it?'] },
  ]
}
