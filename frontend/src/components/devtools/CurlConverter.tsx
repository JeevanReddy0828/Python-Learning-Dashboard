import { useState } from 'react'

interface ParsedCurl {
  method: string
  url: string
  headers: Record<string, string>
  data: string | null
  params: Record<string, string>
  auth: { user: string; pass: string } | null
  json: boolean
}

function parseCurl(curlStr: string): ParsedCurl {
  const result: ParsedCurl = {
    method: 'GET',
    url: '',
    headers: {},
    data: null,
    params: {},
    auth: null,
    json: false,
  }

  // Normalize line continuations
  let s = curlStr.replace(/\\\n/g, ' ').replace(/\s+/g, ' ').trim()
  if (s.startsWith('curl ')) s = s.slice(5)

  // Tokenize
  const tokens: string[] = []
  let i = 0
  while (i < s.length) {
    if (s[i] === ' ') { i++; continue }
    if (s[i] === '"' || s[i] === "'") {
      const q = s[i]; let j = i + 1
      while (j < s.length && s[j] !== q) {
        if (s[j] === '\\') j++
        j++
      }
      tokens.push(s.slice(i + 1, j))
      i = j + 1
    } else {
      let j = i
      while (j < s.length && s[j] !== ' ') j++
      tokens.push(s.slice(i, j))
      i = j
    }
  }

  let ti = 0
  while (ti < tokens.length) {
    const tok = tokens[ti]
    if (tok === '-X' || tok === '--request') {
      result.method = tokens[++ti] ?? 'GET'
    } else if (tok === '-H' || tok === '--header') {
      const h = tokens[++ti] ?? ''
      const [k, ...v] = h.split(':')
      if (k) result.headers[k.trim()] = v.join(':').trim()
    } else if (tok === '-d' || tok === '--data' || tok === '--data-raw' || tok === '--data-binary') {
      result.data = tokens[++ti] ?? ''
      if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(result.method)) result.method = 'POST'
    } else if (tok === '-u' || tok === '--user') {
      const [user, pass = ''] = (tokens[++ti] ?? '').split(':')
      result.auth = { user, pass }
    } else if (tok === '-G' || tok === '--get') {
      result.method = 'GET'
    } else if (!tok.startsWith('-')) {
      if (!result.url) {
        try {
          const parsed = new URL(tok)
          result.url = tok
          parsed.searchParams.forEach((v, k) => { result.params[k] = v })
        } catch {
          result.url = tok
        }
      }
    }
    ti++
  }

  // Detect JSON
  const ct = Object.entries(result.headers).find(([k]) => k.toLowerCase() === 'content-type')
  if (ct && ct[1].toLowerCase().includes('json')) result.json = true
  if (result.data) {
    try { JSON.parse(result.data); result.json = true } catch {}
  }

  return result
}

function toPythonRequests(p: ParsedCurl): string {
  const lines: string[] = ['import requests', '']

  if (Object.keys(p.headers).length) {
    const h = JSON.stringify(p.headers, null, 4).replace(/"([^"]+)":/g, '"$1":')
    lines.push(`headers = ${h}`)
    lines.push('')
  }

  if (p.auth) {
    lines.push(`auth = ("${p.auth.user}", "${p.auth.pass}")`)
    lines.push('')
  }

  let dataStr = ''
  if (p.data) {
    if (p.json) {
      try {
        const parsed = JSON.parse(p.data)
        dataStr = `json=${JSON.stringify(parsed, null, 4)}`
      } catch {
        dataStr = `data="${p.data.replace(/"/g, '\\"')}"`
      }
    } else {
      dataStr = `data="${p.data.replace(/"/g, '\\"')}"`
    }
  }

  const paramsStr = Object.keys(p.params).length
    ? `params=${JSON.stringify(p.params, null, 4)}`
    : ''

  const args: string[] = [
    `"${p.url}"`,
    Object.keys(p.headers).length ? 'headers=headers' : '',
    p.auth ? 'auth=auth' : '',
    paramsStr,
    dataStr,
  ].filter(Boolean)

  const method = p.method.toLowerCase()
  if (args.length > 2) {
    lines.push(`response = requests.${method}(`)
    lines.push(`    ${args.join(',\n    ')},`)
    lines.push(')')
  } else {
    lines.push(`response = requests.${method}(${args.join(', ')})`)
  }

  lines.push('')
  lines.push('print(response.status_code)')
  lines.push('print(response.json())')
  return lines.join('\n')
}

const EXAMPLES = {
  'Simple GET': `curl https://api.github.com/repos/python/cpython`,
  'POST JSON': `curl -X POST https://httpbin.org/post \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Alice", "role": "developer"}'`,
  'With Auth': `curl -u admin:secret https://api.example.com/data`,
  'With Headers': `curl https://api.openai.com/v1/models \\
  -H "Authorization: Bearer sk-abc123" \\
  -H "Content-Type: application/json"`,
  'PUT request': `curl -X PUT https://jsonplaceholder.typicode.com/posts/1 \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Updated", "body": "content", "userId": 1}'`,
}

export default function CurlConverter() {
  const [input, setInput] = useState(EXAMPLES['POST JSON'])
  const [copied, setCopied] = useState(false)

  let parsed: ParsedCurl | null = null
  let output = ''
  let error = ''

  try {
    if (input.trim()) {
      parsed = parseCurl(input)
      output = toPythonRequests(parsed)
    }
  } catch (e: any) {
    error = e.message
  }

  function copy() {
    if (!output) return
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="bg-gradient-to-r from-rose-600 to-pink-600 rounded-2xl p-5 text-white">
        <h2 className="text-xl font-bold">🌐 cURL → Python Requests</h2>
        <p className="text-rose-100 text-sm mt-0.5">
          Paste any curl command — instantly get the equivalent Python <code className="font-mono bg-white/20 px-1 rounded">requests</code> code
        </p>
      </div>

      {/* Examples */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-xs text-gray-400 self-center">Examples:</span>
        {Object.keys(EXAMPLES).map((k) => (
          <button
            key={k}
            onClick={() => setInput(EXAMPLES[k as keyof typeof EXAMPLES])}
            className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-rose-100 dark:hover:bg-rose-900/30 hover:text-rose-700 dark:hover:text-rose-300 rounded-full transition-all text-gray-600 dark:text-gray-400"
          >
            {k}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">📥 cURL Command</label>
          <textarea
            className="w-full h-64 bg-gray-900 text-yellow-300 font-mono text-xs rounded-xl p-4 resize-none outline-none focus:ring-2 focus:ring-rose-500 leading-relaxed"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder="curl https://..."
          />
        </div>

        {/* Output */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">📤 Python Code</label>
            {output && (
              <button onClick={copy} className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-500 hover:text-gray-700 transition-colors">
                {copied ? '✅ Copied!' : '📋 Copy'}
              </button>
            )}
          </div>
          <div className="h-64 relative">
            <pre className={`w-full h-full font-mono text-xs rounded-xl p-4 overflow-auto leading-relaxed ${
              error
                ? 'bg-red-50 dark:bg-red-900/20 text-red-500'
                : 'bg-gray-900 text-green-300'
            }`}>
              {error || output || <span className="text-gray-600">Output appears here as you type...</span>}
            </pre>
          </div>
        </div>
      </div>

      {/* Parsed summary */}
      {parsed && !error && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">🔍 Parsed Request</h3>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className={`px-3 py-1 rounded-full font-bold text-white text-xs ${
              { GET: 'bg-green-500', POST: 'bg-blue-500', PUT: 'bg-orange-500', DELETE: 'bg-red-500', PATCH: 'bg-purple-500' }[parsed.method] ?? 'bg-gray-500'
            }`}>
              {parsed.method}
            </span>
            <code className="text-gray-600 dark:text-gray-400 text-xs bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full truncate max-w-80">
              {parsed.url || '(no URL)'}
            </code>
            {parsed.auth && <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full">🔐 Auth</span>}
            {parsed.json && <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">📄 JSON body</span>}
            {Object.keys(parsed.headers).length > 0 && (
              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                {Object.keys(parsed.headers).length} header{Object.keys(parsed.headers).length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
