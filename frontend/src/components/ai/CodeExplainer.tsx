import { useState } from 'react'
import { aiApi } from '../../api'
import type { LineExplanation } from '../../types'

const TAG_COLORS: Record<string, string> = {
  variable: 'bg-blue-100 text-blue-700',
  function: 'bg-purple-100 text-purple-700',
  loop: 'bg-green-100 text-green-700',
  condition: 'bg-yellow-100 text-yellow-700',
  'input/output': 'bg-pink-100 text-pink-700',
  import: 'bg-gray-100 text-gray-700',
  class: 'bg-indigo-100 text-indigo-700',
  operator: 'bg-orange-100 text-orange-700',
  string: 'bg-teal-100 text-teal-700',
  list: 'bg-cyan-100 text-cyan-700',
  dictionary: 'bg-rose-100 text-rose-700',
}

interface Props {
  code: string
}

export default function CodeExplainer({ code }: Props) {
  const [lines, setLines] = useState<LineExplanation[]>([])
  const [loading, setLoading] = useState(false)
  const [hoveredLine, setHoveredLine] = useState<number | null>(null)

  async function explain() {
    if (!code.trim()) return
    setLoading(true)
    try {
      const res = await aiApi.explain(code)
      setLines(res.data.lines)
    } catch {
      setLines([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Get a plain-English explanation of your code, line by line.</p>

      <button onClick={explain} disabled={loading || !code.trim()} className="btn-primary w-full py-3">
        {loading ? '📖 Reading your code...' : '📖 Explain My Code'}
      </button>

      {lines.length > 0 && (
        <div className="space-y-2 animate-slide-up">
          {lines.map((line) => (
            <div
              key={line.line_no}
              onMouseEnter={() => setHoveredLine(line.line_no)}
              onMouseLeave={() => setHoveredLine(null)}
              className={`rounded-xl p-3 border transition-all cursor-default ${
                hoveredLine === line.line_no
                  ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-surface-dark'
              }`}
            >
              <div className="flex items-start gap-2 mb-1">
                <span className="text-xs font-mono text-gray-400 w-5 shrink-0">{line.line_no}</span>
                <code className="text-xs font-mono text-gray-600 dark:text-gray-400 truncate flex-1">
                  {line.code}
                </code>
                {line.concept_tag && (
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${TAG_COLORS[line.concept_tag] || 'bg-gray-100 text-gray-600'}`}>
                    {line.concept_tag}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 pl-7">{line.explanation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
