import { useState, useEffect } from 'react'

interface Repo {
  id: number
  full_name: string
  description: string | null
  html_url: string
  stargazers_count: number
  forks_count: number
  language: string | null
  topics: string[]
  owner: { avatar_url: string; login: string }
  open_issues_count: number
  watchers_count: number
}

const PERIODS = [
  { label: 'Today',    sort: 'stars', since: 'daily' },
  { label: 'This Week', sort: 'stars', since: 'weekly' },
  { label: 'Most Forked', sort: 'forks', since: '' },
]

export default function GitHubTrending() {
  const [repos, setRepos] = useState<Repo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState(0)
  const [query, setQuery] = useState('python')

  useEffect(() => { fetchRepos() }, [period, query])

  async function fetchRepos() {
    setLoading(true)
    setError('')
    try {
      const sort = PERIODS[period].sort
      const dateFilter = period === 0
        ? `+created:>${new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0]}`
        : period === 1
        ? `+created:>${new Date(Date.now() - 86400000 * 30).toISOString().split('T')[0]}`
        : ''
      const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}+language:python${dateFilter}&sort=${sort}&order=desc&per_page=15`
      const res = await fetch(url)
      if (!res.ok) throw new Error('GitHub API rate limited — try again in a minute')
      const data = await res.json()
      setRepos(data.items ?? [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function fmtNum(n: number) {
    return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-5 text-white flex items-center gap-4">
        <span className="text-4xl">🔥</span>
        <div>
          <h2 className="text-xl font-bold">GitHub Trending — Python</h2>
          <p className="text-gray-300 text-sm mt-0.5">Live data from GitHub's search API — the repos everyone is starring right now</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          {PERIODS.map((p, i) => (
            <button
              key={p.label}
              onClick={() => setPeriod(i)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                period === i
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-1 min-w-48">
          <input
            className="input flex-1 text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchRepos()}
            placeholder="Search topic (e.g. fastapi, pandas, ml)..."
          />
          <button onClick={fetchRepos} className="btn-primary px-4 py-2 text-sm shrink-0">Search</button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3">
          {repos.map((repo, idx) => (
            <a
              key={repo.id}
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="card p-4 hover:shadow-md transition-all hover:border-primary-200 dark:hover:border-primary-700 group block"
            >
              <div className="flex items-start gap-3">
                <span className="text-lg font-bold text-gray-300 dark:text-gray-600 w-6 shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <img src={repo.owner.avatar_url} alt="" className="w-8 h-8 rounded-full shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {repo.full_name}
                    </h3>
                    {repo.language && (
                      <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">
                        {repo.language}
                      </span>
                    )}
                  </div>
                  {repo.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{repo.description}</p>
                  )}
                  {repo.topics.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {repo.topics.slice(0, 5).map((t) => (
                        <span key={t} className="text-xs px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-4 shrink-0 text-sm text-gray-500">
                  <span title="Stars">⭐ {fmtNum(repo.stargazers_count)}</span>
                  <span title="Forks">🍴 {fmtNum(repo.forks_count)}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
