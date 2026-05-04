import { useState, useCallback } from 'react'

function jsonToPythonDict(json: string): string {
  try {
    const parsed = JSON.parse(json)
    return toPython(parsed, 0)
  } catch (e: any) {
    throw new Error(`Invalid JSON: ${e.message}`)
  }
}

function toPython(val: unknown, indent: number): string {
  const pad = '    '.repeat(indent)
  const innerPad = '    '.repeat(indent + 1)

  if (val === null) return 'None'
  if (val === true) return 'True'
  if (val === false) return 'False'
  if (typeof val === 'number') return String(val)
  if (typeof val === 'string') {
    const escaped = val.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    return `"${escaped}"`
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return '[]'
    const items = val.map((v) => innerPad + toPython(v, indent + 1))
    return `[\n${items.join(',\n')},\n${pad}]`
  }
  if (typeof val === 'object') {
    const entries = Object.entries(val as Record<string, unknown>)
    if (entries.length === 0) return '{}'
    const items = entries.map(([k, v]) => `${innerPad}"${k}": ${toPython(v, indent + 1)}`)
    return `{\n${items.join(',\n')},\n${pad}}`
  }
  return String(val)
}

function pythonDictToJson(pyDict: string): string {
  let s = pyDict.trim()
  s = s.replace(/\bNone\b/g, 'null')
  s = s.replace(/\bTrue\b/g, 'true')
  s = s.replace(/\bFalse\b/g, 'false')
  // Replace Python single-quoted strings with double-quoted
  s = s.replace(/'([^'\\]|\\.)*'/g, (m) => '"' + m.slice(1, -1).replace(/"/g, '\\"') + '"')
  // Remove trailing commas before } or ]
  s = s.replace(/,(\s*[}\]])/g, '$1')
  const parsed = JSON.parse(s)
  return JSON.stringify(parsed, null, 2)
}

const EXAMPLES = {
  'Simple dict': `{
  "name": "Alice",
  "age": 30,
  "active": true,
  "score": null
}`,
  'Nested': `{
  "user": {
    "id": 1,
    "tags": ["admin", "dev"],
    "settings": {"theme": "dark"}
  }
}`,
  'API response': `{
  "status": "ok",
  "data": [
    {"id": 1, "title": "Learn Python"},
    {"id": 2, "title": "Master FastAPI"}
  ],
  "total": 2
}`,
}

export default function JsonDictConverter() {
  const [mode, setMode] = useState<'j2p' | 'p2j'>('j2p')
  const [input, setInput] = useState(EXAMPLES['Simple dict'])
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const convert = useCallback(() => {
    setError('')
    try {
      if (mode === 'j2p') {
        setOutput(toPython(JSON.parse(input), 0))
      } else {
        setOutput(pythonDictToJson(input))
      }
    } catch (e: any) {
      setError(e.message)
      setOutput('')
    }
  }, [input, mode])

  function copy() {
    if (!output) return
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl p-5 text-white">
        <h2 className="text-xl font-bold">🔄 JSON ↔ Python Dict Converter</h2>
        <p className="text-orange-100 text-sm mt-0.5">
          Instantly convert between JSON (APIs) and Python dict syntax — handles null/None, true/True, false/False
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-4">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          <button
            onClick={() => { setMode('j2p'); setOutput(''); setError('') }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'j2p'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            JSON → Python dict
          </button>
          <button
            onClick={() => { setMode('p2j'); setOutput(''); setError('') }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'p2j'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            Python dict → JSON
          </button>
        </div>

        {mode === 'j2p' && (
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs text-gray-400 self-center">Examples:</span>
            {Object.keys(EXAMPLES).map((k) => (
              <button
                key={k}
                onClick={() => { setInput(EXAMPLES[k as keyof typeof EXAMPLES]); setOutput('') }}
                className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-full text-gray-600 dark:text-gray-400 hover:text-orange-700 dark:hover:text-orange-300 transition-all"
              >
                {k}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {mode === 'j2p' ? '📥 JSON Input' : '📥 Python Dict Input'}
          </label>
          <textarea
            className="w-full h-72 bg-gray-900 text-green-300 font-mono text-sm rounded-xl p-4 resize-none outline-none focus:ring-2 focus:ring-orange-500 leading-relaxed"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
          />
        </div>

        {/* Output */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {mode === 'j2p' ? '📤 Python Dict Output' : '📤 JSON Output'}
            </label>
            {output && (
              <button onClick={copy} className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-500 hover:text-gray-700 transition-colors">
                {copied ? '✅ Copied!' : '📋 Copy'}
              </button>
            )}
          </div>
          <div className="relative h-72">
            <pre className={`w-full h-full font-mono text-sm rounded-xl p-4 overflow-auto leading-relaxed ${
              error
                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                : 'bg-gray-900 text-blue-300'
            }`}>
              {error || output || <span className="text-gray-600">Output will appear here...</span>}
            </pre>
          </div>
        </div>
      </div>

      <button onClick={convert} className="btn-primary px-8 py-3 text-sm">
        🔄 Convert
      </button>

      {/* Cheat sheet */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">📖 Type Mapping Cheat Sheet</h3>
        <div className="grid grid-cols-3 gap-2 text-xs font-mono">
          <div className="font-semibold text-gray-400">JSON</div>
          <div className="font-semibold text-gray-400">→</div>
          <div className="font-semibold text-gray-400">Python</div>
          {[['null', 'None'], ['true', 'True'], ['false', 'False'], ['"string"', '"string"'], ['123', '123'], ['[...]', '[...]'], ['{...}', '{...}']].map(([j, p]) => (
            <>
              <code key={j} className="text-orange-400">{j}</code>
              <span className="text-gray-400">→</span>
              <code key={p} className="text-blue-400">{p}</code>
            </>
          ))}
        </div>
      </div>
    </div>
  )
}
