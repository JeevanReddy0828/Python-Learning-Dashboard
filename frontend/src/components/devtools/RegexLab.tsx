import { useState, useMemo } from 'react'

const EXAMPLES = [
  { label: 'Email',       pattern: r`[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}`, text: 'Contact us at hello@example.com or support@company.org' },
  { label: 'Phone',       pattern: r`\+?[\d\s\-\(\)]{10,}`, text: 'Call us: +1 (555) 123-4567 or 800-555-0199' },
  { label: 'URL',         pattern: r`https?://[^\s]+`, text: 'Visit https://python.org or http://docs.python.org/3/' },
  { label: 'IP Address',  pattern: r`\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b`, text: 'Server IPs: 192.168.1.1 and 10.0.0.254' },
  { label: 'Date',        pattern: r`\d{4}-\d{2}-\d{2}`, text: 'Dates: 2024-01-15 and 2025-12-31' },
  { label: 'Python var',  pattern: r`\b[a-z_][a-z0-9_]*\b`, text: 'my_var = some_value + another_one' },
]

function r(strings: TemplateStringsArray) { return strings[0] }

interface Match {
  text: string
  start: number
  end: number
  groups: string[]
}

function runRegex(pattern: string, flags: string, text: string): { matches: Match[]; error: string } {
  if (!pattern) return { matches: [], error: '' }
  try {
    const re = new RegExp(pattern, flags)
    const matches: Match[] = []
    if (flags.includes('g')) {
      let m: RegExpExecArray | null
      let safety = 0
      while ((m = re.exec(text)) !== null && safety++ < 500) {
        matches.push({ text: m[0], start: m.index, end: m.index + m[0].length, groups: [...m].slice(1) })
        if (m[0].length === 0) re.lastIndex++
      }
    } else {
      const m = re.exec(text)
      if (m) matches.push({ text: m[0], start: m.index, end: m.index + m[0].length, groups: [...m].slice(1) })
    }
    return { matches, error: '' }
  } catch (e: any) {
    return { matches: [], error: e.message }
  }
}

function buildPythonCode(pattern: string, flags: string, text: string): string {
  const pyFlags: string[] = []
  if (flags.includes('i')) pyFlags.push('re.IGNORECASE')
  if (flags.includes('m')) pyFlags.push('re.MULTILINE')
  if (flags.includes('s')) pyFlags.push('re.DOTALL')
  const flagStr = pyFlags.length ? `, ${pyFlags.join(' | ')}` : ''
  return `import re

pattern = r"${pattern}"
text = """${text}"""

# Find all matches
matches = re.findall(pattern${flagStr}, text)
print(f"Found {len(matches)} match(es):", matches)

# Find with position info
for m in re.finditer(pattern${flagStr}, text):
    print(f"  Match: '{m.group()}' at position {m.start()}-{m.end()}")`
}

export default function RegexLab() {
  const [pattern, setPattern] = useState(r`\b[A-Z][a-z]+\b`)
  const [text, setText] = useState('Hello World! Python is Amazing. Meet Alice and Bob.')
  const [flags, setFlags] = useState('g')
  const [showCode, setShowCode] = useState(false)
  const [copied, setCopied] = useState(false)

  const { matches, error } = useMemo(() => runRegex(pattern, flags, text), [pattern, flags, text])

  function highlightText() {
    if (!matches.length) return <span className="text-gray-700 dark:text-gray-300">{text}</span>
    const parts: JSX.Element[] = []
    let last = 0
    matches.forEach((m, i) => {
      if (m.start > last) parts.push(<span key={`t${i}`}>{text.slice(last, m.start)}</span>)
      parts.push(
        <mark key={`m${i}`} className="bg-yellow-300 dark:bg-yellow-600 text-gray-900 rounded px-0.5">
          {m.text}
        </mark>
      )
      last = m.end
    })
    if (last < text.length) parts.push(<span key="tail">{text.slice(last)}</span>)
    return <>{parts}</>
  }

  const pyCode = buildPythonCode(pattern, flags, text)

  function copy() {
    navigator.clipboard.writeText(pyCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-5 text-white">
        <h2 className="text-xl font-bold">🔍 Python Regex Lab</h2>
        <p className="text-green-100 text-sm mt-0.5">Test Python <code className="font-mono bg-white/20 px-1 rounded">re</code> patterns live — see matches highlighted + auto-generated Python code</p>
      </div>

      {/* Examples */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-xs text-gray-400 self-center shrink-0">Examples:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            onClick={() => { setPattern(ex.pattern); setText(ex.text) }}
            className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-300 rounded-full transition-all text-gray-600 dark:text-gray-400"
          >
            {ex.label}
          </button>
        ))}
      </div>

      {/* Pattern input */}
      <div className="card p-4 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Pattern</label>
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2">
            <span className="text-gray-400 font-mono">/</span>
            <input
              className="flex-1 bg-transparent font-mono text-sm text-gray-900 dark:text-gray-100 outline-none"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="your regex pattern..."
              spellCheck={false}
            />
            <span className="text-gray-400 font-mono">/</span>
            <div className="flex gap-1">
              {['g', 'i', 'm', 's'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFlags((prev) => prev.includes(f) ? prev.replace(f, '') : prev + f)}
                  className={`w-6 h-6 rounded text-xs font-mono font-bold transition-all ${
                    flags.includes(f)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}
                  title={{ g: 'global', i: 'ignore case', m: 'multiline', s: 'dotall' }[f]}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-red-500 text-xs mt-1 font-mono">{error}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Test String</label>
          <textarea
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 font-mono text-sm resize-none outline-none focus:ring-2 focus:ring-green-500 dark:text-gray-100"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Highlighted preview */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">🎯 Matches highlighted</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              matches.length > 0
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
            }`}>
              {matches.length} match{matches.length !== 1 ? 'es' : ''}
            </span>
          </div>
          <div className="font-mono text-sm leading-relaxed bg-gray-50 dark:bg-gray-900 rounded-xl p-3 min-h-16">
            {highlightText()}
          </div>
        </div>

        {/* Match list */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">📋 Match details</h3>
          {matches.length === 0 ? (
            <p className="text-gray-400 text-sm">No matches found</p>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {matches.map((m, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-gray-400 w-5 text-right">{i + 1}</span>
                  <code className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-0.5 rounded font-mono">
                    {m.text || '(empty)'}
                  </code>
                  <span className="text-gray-400">[{m.start}:{m.end}]</span>
                  {m.groups.filter(Boolean).map((g, gi) => (
                    <span key={gi} className="text-blue-500">group {gi + 1}: {g}</span>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Python code */}
      <div className="card overflow-hidden">
        <button
          onClick={() => setShowCode((v) => !v)}
          className="w-full flex items-center justify-between p-4 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <span>🐍 Generated Python Code</span>
          <span className="text-gray-400">{showCode ? '▲' : '▼'}</span>
        </button>
        {showCode && (
          <div className="relative">
            <pre className="bg-gray-900 text-green-300 font-mono text-xs p-4 overflow-x-auto leading-relaxed">
              {pyCode}
            </pre>
            <button
              onClick={copy}
              className="absolute top-2 right-2 text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
            >
              {copied ? '✅' : '📋'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
