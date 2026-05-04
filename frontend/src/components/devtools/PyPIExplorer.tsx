import { useState } from 'react'

interface PackageInfo {
  name: string
  version: string
  summary: string
  author: string
  license: string
  home_page: string
  project_url: string
  requires_python: string
  keywords: string
  classifiers: string[]
  releases_count: number
  last_release: string
}

const POPULAR = ['requests', 'fastapi', 'numpy', 'pandas', 'pydantic', 'sqlalchemy', 'pytest', 'black', 'ruff', 'httpx']

export default function PyPIExplorer() {
  const [query, setQuery] = useState('')
  const [pkg, setPkg] = useState<PackageInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function search(name: string) {
    if (!name.trim()) return
    setLoading(true)
    setError('')
    setPkg(null)
    try {
      const res = await fetch(`https://pypi.org/pypi/${encodeURIComponent(name.trim())}/json`)
      if (!res.ok) throw new Error(`Package "${name}" not found on PyPI`)
      const data = await res.json()
      const info = data.info
      const releases = Object.keys(data.releases || {})
      setPkg({
        name: info.name,
        version: info.version,
        summary: info.summary || 'No description available.',
        author: info.author || info.author_email || '—',
        license: info.license || '—',
        home_page: info.home_page || info.project_url || '',
        project_url: `https://pypi.org/project/${info.name}`,
        requires_python: info.requires_python || '—',
        keywords: info.keywords || '',
        classifiers: info.classifiers || [],
        releases_count: releases.length,
        last_release: info.version,
      })
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const installCmd = pkg ? `pip install ${pkg.name}` : ''

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-5 text-white">
        <h2 className="text-xl font-bold">📦 PyPI Package Explorer</h2>
        <p className="text-blue-100 text-sm mt-0.5">Search any Python package — the same registry you use with pip install</p>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <input
          className="input flex-1"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search(query)}
          placeholder="Package name (e.g. requests, fastapi, numpy)..."
        />
        <button onClick={() => search(query)} disabled={loading} className="btn-primary px-5 shrink-0">
          {loading ? '⏳' : '🔍 Search'}
        </button>
      </div>

      {/* Popular */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-xs text-gray-400 self-center">Popular:</span>
        {POPULAR.map((p) => (
          <button
            key={p}
            onClick={() => { setQuery(p); search(p) }}
            className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-700 dark:hover:text-primary-300 rounded-full transition-all text-gray-600 dark:text-gray-400"
          >
            {p}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 text-sm">
          ⚠️ {error}
        </div>
      )}

      {pkg && (
        <div className="space-y-4">
          {/* Install command */}
          <div className="flex items-center gap-3 p-4 bg-gray-900 rounded-2xl">
            <code className="text-green-400 font-mono text-sm flex-1">$ {installCmd}</code>
            <button
              onClick={() => copy(installCmd)}
              className="shrink-0 text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
            >
              {copied ? '✅ Copied!' : '📋 Copy'}
            </button>
          </div>

          {/* Info card */}
          <div className="card p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{pkg.name}</h3>
                <p className="text-gray-500 text-sm mt-0.5">{pkg.summary}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="inline-block px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-mono font-semibold">
                  v{pkg.version}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Author', value: pkg.author },
                { label: 'License', value: pkg.license },
                { label: 'Python', value: pkg.requires_python },
                { label: 'Releases', value: String(pkg.releases_count) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                  <p className="text-gray-800 dark:text-gray-200 font-medium">{value}</p>
                </div>
              ))}
            </div>

            {pkg.keywords && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Keywords</p>
                <div className="flex flex-wrap gap-1">
                  {pkg.keywords.split(/[\s,]+/).filter(Boolean).map((k) => (
                    <span key={k} className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <a href={pkg.project_url} target="_blank" rel="noopener noreferrer"
                className="btn-primary text-sm px-4 py-2">
                📦 PyPI Page
              </a>
              {pkg.home_page && (
                <a href={pkg.home_page} target="_blank" rel="noopener noreferrer"
                  className="btn-ghost text-sm px-4 py-2">
                  🏠 Homepage
                </a>
              )}
            </div>
          </div>

          {/* Classifiers */}
          {pkg.classifiers.length > 0 && (
            <details className="card p-4">
              <summary className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                📋 Classifiers ({pkg.classifiers.length})
              </summary>
              <div className="mt-3 space-y-1">
                {pkg.classifiers.map((c, i) => (
                  <p key={i} className="text-xs text-gray-500 font-mono">{c}</p>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
