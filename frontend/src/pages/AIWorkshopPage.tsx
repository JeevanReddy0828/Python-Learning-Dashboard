import { useState } from 'react'
import { streamDevChat } from '../api'

const MODES = [
  {
    id: 'feature-dev',
    icon: '⚙️',
    title: 'Production Feature Developer',
    description: 'Design & build a production-ready feature with architecture, data flow, and edge cases.',
    inputLabel: 'Describe the feature you want to build',
    inputPlaceholder: 'e.g. Add a real-time notification system for user events...',
    hasCode: true,
  },
  {
    id: 'full-app',
    icon: '🚀',
    title: 'Full Application from Scratch',
    description: 'Generate a complete startup MVP — architecture, DB schema, API, UI, and full code.',
    inputLabel: 'Describe the application',
    inputPlaceholder: 'e.g. A SaaS task manager with teams, roles, and real-time updates...',
    hasCode: false,
  },
  {
    id: 'repo-refactor',
    icon: '🔍',
    title: 'Repo Understanding + Refactoring',
    description: 'Paste code and get a full audit: architecture, structural problems, and refactored output.',
    inputLabel: 'Describe what you want to understand or refactor',
    inputPlaceholder: 'e.g. This is our auth service, find issues and refactor it...',
    hasCode: true,
  },
  {
    id: 'debugger',
    icon: '🐛',
    title: 'Senior Debugging Engineer',
    description: 'Paste broken code and get root cause analysis, a repair plan, and production-ready fix.',
    inputLabel: 'Describe the bug or unexpected behavior',
    inputPlaceholder: 'e.g. Users get logged out randomly after 5 minutes...',
    hasCode: true,
  },
  {
    id: 'system-design',
    icon: '🏗️',
    title: 'System Design + Implementation',
    description: 'Design a scalable system with architecture, caching strategy, API design, and code.',
    inputLabel: 'Describe the system or product to design',
    inputPlaceholder: 'e.g. Design a URL shortener that handles 10M requests/day...',
    hasCode: false,
  },
  {
    id: 'perf-optimize',
    icon: '⚡',
    title: 'Performance Optimization',
    description: 'Get bottleneck analysis and optimized code targeting speed, memory, and scalability.',
    inputLabel: 'What should be optimized?',
    inputPlaceholder: 'e.g. This endpoint is slow under load, find and fix the bottlenecks...',
    hasCode: true,
  },
  {
    id: 'arch-reconstruct',
    icon: '🧱',
    title: 'Architecture Reconstruction',
    description: 'Restructure code for clean architecture — separate concerns, reduce coupling, stay correct.',
    inputLabel: 'Describe the restructuring goal',
    inputPlaceholder: 'e.g. Separate business logic from the controller layer...',
    hasCode: true,
  },
]

export default function AIWorkshopPage() {
  const [selectedMode, setSelectedMode] = useState<string | null>(null)
  const [inputText, setInputText] = useState('')
  const [code, setCode] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const mode = MODES.find((m) => m.id === selectedMode)

  async function handleSubmit() {
    if (!selectedMode || !inputText.trim()) return
    setLoading(true)
    setError('')
    setResponse('')
    try {
      await streamDevChat(
        selectedMode,
        inputText,
        (token) => setResponse((prev) => prev + token),
        () => setLoading(false),
        code || undefined,
      )
    } catch {
      setError('AI request failed. Make sure your API key is configured.')
      setLoading(false)
    }
  }

  function handleModeSelect(id: string) {
    setSelectedMode(id)
    setInputText('')
    setCode('')
    setResponse('')
    setError('')
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Workshop</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          7 specialized AI modes — pick one and get expert-level output
        </p>
      </div>

      {/* Mode grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => handleModeSelect(m.id)}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              selectedMode === m.id
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 bg-white dark:bg-gray-800'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{m.icon}</span>
              <span className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">{m.title}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">{m.description}</p>
          </button>
        ))}
      </div>

      {/* Input area */}
      {mode && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{mode.icon}</span>
            <h2 className="font-bold text-gray-900 dark:text-white">{mode.title}</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {mode.inputLabel}
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={mode.inputPlaceholder}
              rows={3}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {mode.hasCode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Code (optional)
              </label>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste relevant code here..."
                rows={6}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
              />
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !inputText.trim()}
            className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Thinking...' : 'Run'}
          </button>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>
      )}

      {/* Response */}
      {response && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Response</h3>
            <button
              onClick={() => navigator.clipboard.writeText(response)}
              className="text-xs text-indigo-500 hover:underline"
            >
              Copy
            </button>
          </div>
          <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-mono leading-relaxed overflow-auto max-h-[600px]">
            {response}
          </pre>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-3 animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        </div>
      )}
    </div>
  )
}
