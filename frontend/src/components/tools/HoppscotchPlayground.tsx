/**
 * Hoppscotch API Playground integration.
 *
 * Hoppscotch (https://hoppscotch.io) is an open-source API testing platform.
 * We deep-link into it with pre-filled requests so students can try real APIs
 * right from the lesson — no sign-up needed.
 */
import { useState } from 'react'

interface ApiExample {
  label: string
  description: string
  method: 'GET' | 'POST'
  url: string
  headers?: Record<string, string>
  body?: string
  emoji: string
}

const EXAMPLES: ApiExample[] = [
  {
    emoji: '🌤️',
    label: 'Open-Meteo Weather',
    description: 'Get current weather for any city — completely free, no API key needed!',
    method: 'GET',
    url: 'https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&current_weather=true',
  },
  {
    emoji: '🐶',
    label: 'Random Dog Photo',
    description: 'Fetch a random dog image URL from the Dog CEO API — great for practising GET requests.',
    method: 'GET',
    url: 'https://dog.ceo/api/breeds/image/random',
  },
  {
    emoji: '🎲',
    label: 'Random User Generator',
    description: 'Generate a fake user — name, email, avatar. Used in testing and prototyping.',
    method: 'GET',
    url: 'https://randomuser.me/api/?results=1',
  },
  {
    emoji: '📚',
    label: 'Open Library Search',
    description: "Search for Python books using Open Library's free API.",
    method: 'GET',
    url: 'https://openlibrary.org/search.json?q=python+programming&limit=3',
  },
  {
    emoji: '🪙',
    label: 'CoinGecko Crypto Price',
    description: 'Get real-time Bitcoin price in USD — free tier, no auth.',
    method: 'GET',
    url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
  },
  {
    emoji: '🌍',
    label: 'REST Countries',
    description: 'Get info about any country: population, capital, flag, languages.',
    method: 'GET',
    url: 'https://restcountries.com/v3.1/name/germany?fields=name,population,capital,flags',
  },
]

function buildHoppscotchUrl(ex: ApiExample): string {
  // Hoppscotch supports deep-linking via query params and base64 encoding
  // Their format: https://hoppscotch.io/#url=<encoded>&method=<METHOD>
  const params = new URLSearchParams({
    url: ex.url,
    method: ex.method,
  })
  return `https://hoppscotch.io/?${params.toString()}`
}

async function runRequest(ex: ApiExample): Promise<{ ok: boolean; status: number; body: string; time: number }> {
  const start = Date.now()
  try {
    const opts: RequestInit = {
      method: ex.method,
      headers: { 'Accept': 'application/json', ...(ex.headers ?? {}) },
    }
    if (ex.body && ex.method === 'POST') {
      opts.body = ex.body
      ;(opts.headers as Record<string, string>)['Content-Type'] = 'application/json'
    }
    const res = await fetch(ex.url, opts)
    const body = await res.text()
    let pretty = body
    try { pretty = JSON.stringify(JSON.parse(body), null, 2) } catch { /* not JSON */ }
    return { ok: res.ok, status: res.status, body: pretty, time: Date.now() - start }
  } catch (e) {
    return { ok: false, status: 0, body: `Network error: ${e}`, time: Date.now() - start }
  }
}

export default function HoppscotchPlayground() {
  const [selected, setSelected] = useState<ApiExample>(EXAMPLES[0])
  const [result, setResult] = useState<{ ok: boolean; status: number; body: string; time: number } | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleRun() {
    setLoading(true)
    setResult(null)
    const r = await runRequest(selected)
    setResult(r)
    setLoading(false)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🔌</span>
          <div>
            <h2 className="text-xl font-bold">API Playground</h2>
            <p className="text-orange-100 text-sm">Try real APIs instantly — powered by free public endpoints</p>
          </div>
        </div>
        <a
          href="https://hoppscotch.io"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors rounded-xl px-4 py-2 text-sm font-semibold mt-1"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1 17H9V7h2v10zm4 0h-2V7h2v10z"/></svg>
          Open full Hoppscotch ↗
        </a>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Left: API picker */}
        <div className="card p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Choose a free API to test:</p>
          <div className="space-y-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.url}
                onClick={() => { setSelected(ex); setResult(null) }}
                className={`w-full text-left rounded-xl p-3 border-2 transition-all ${
                  selected.url === ex.url
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{ex.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{ex.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{ex.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: request + response */}
        <div className="space-y-3">
          {/* Request preview */}
          <div className="card p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Request</p>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 text-xs font-bold px-2 py-1 rounded-lg">
                {selected.method}
              </span>
              <span className="text-primary-600 dark:text-primary-300 text-xs font-mono break-all">
                {selected.url}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRun}
                disabled={loading}
                className="btn-primary text-sm px-4 py-2 flex-1"
              >
                {loading ? '⏳ Sending...' : '▶ Run Request'}
              </button>
              <a
                href={buildHoppscotchUrl(selected)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl"
                title="Open in Hoppscotch"
              >
                🔌 Hoppscotch
              </a>
            </div>
          </div>

          {/* Response */}
          {(loading || result) && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Response</p>
                {result && (
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                      result.ok
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                    }`}>
                      {result.status || 'ERR'}
                    </span>
                    <span className="text-xs text-gray-400">{result.time}ms</span>
                  </div>
                )}
              </div>
              {loading ? (
                <div className="animate-pulse h-24 bg-gray-100 dark:bg-gray-800 rounded-lg"/>
              ) : result ? (
                <pre className="text-xs font-mono bg-gray-950 text-green-300 rounded-xl p-3 overflow-auto max-h-64 whitespace-pre-wrap">
                  {result.body.slice(0, 3000)}{result.body.length > 3000 ? '\n…(truncated)' : ''}
                </pre>
              ) : null}
            </div>
          )}

          {/* Tip */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-300">
            💡 <strong>Python equivalent:</strong><br/>
            <code className="font-mono">{`import requests\nr = requests.get("${selected.url.slice(0, 50)}...")\nprint(r.json())`}</code>
          </div>
        </div>
      </div>
    </div>
  )
}
