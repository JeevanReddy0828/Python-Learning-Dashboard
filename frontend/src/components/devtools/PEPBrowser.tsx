import { useState, useEffect, useMemo } from 'react'

interface PEP {
  number: number
  title: string
  status: string
  type: string
  authors: string
  url: string
  created: string
}

const STATUS_COLORS: Record<string, string> = {
  'Active':     'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Final':      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Accepted':   'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  'Draft':      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Deferred':   'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  'Rejected':   'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  'Withdrawn':  'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  'Superseded': 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
}

const FEATURED = [8, 20, 257, 484, 526, 572, 634, 701, 703, 3107, 3115, 3119]

export default function PEPBrowser() {
  const [peps, setPeps] = useState<PEP[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showFeatured, setShowFeatured] = useState(true)

  useEffect(() => {
    fetch('https://peps.python.org/api/peps.json')
      .then((r) => r.json())
      .then((data) => {
        const list: PEP[] = Object.entries(data).map(([num, p]: [string, any]) => ({
          number: Number(num),
          title: p.title,
          status: p.status,
          type: p.type,
          authors: Array.isArray(p.authors) ? p.authors.join(', ') : String(p.authors || ''),
          url: `https://peps.python.org/pep-${String(num).padStart(4, '0')}/`,
          created: p.created || '',
        }))
        setPeps(list.sort((a, b) => a.number - b.number))
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let list = peps
    if (showFeatured) list = list.filter((p) => FEATURED.includes(p.number))
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        String(p.number).includes(q) ||
        p.authors.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'all') list = list.filter((p) => p.status === statusFilter)
    if (typeFilter !== 'all') list = list.filter((p) => p.type === typeFilter)
    return list
  }, [peps, search, statusFilter, typeFilter, showFeatured])

  const statuses = useMemo(() => ['all', ...new Set(peps.map((p) => p.status))], [peps])
  const types = useMemo(() => ['all', ...new Set(peps.map((p) => p.type))], [peps])

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-5 text-white">
        <h2 className="text-xl font-bold">📜 PEP Browser</h2>
        <p className="text-indigo-100 text-sm mt-0.5">
          Python Enhancement Proposals — the official standards that shape the Python language. PEP 8 = style guide, PEP 484 = type hints, PEP 20 = Zen of Python
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <input
          className="input flex-1 min-w-48 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by number, title, or author..."
        />

        <button
          onClick={() => setShowFeatured((v) => !v)}
          className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
            showFeatured
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
          }`}
        >
          ⭐ Featured only
        </button>

        <select
          className="input text-sm w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {statuses.map((s) => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>)}
        </select>

        <select
          className="input text-sm w-auto"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          {types.map((t) => <option key={t} value={t}>{t === 'all' ? 'All types' : t}</option>)}
        </select>
      </div>

      {error && <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 text-sm">⚠️ {error}</div>}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading PEPs from peps.python.org...</div>
      ) : (
        <>
          <p className="text-xs text-gray-400">{filtered.length} PEP{filtered.length !== 1 ? 's' : ''}</p>
          <div className="space-y-2">
            {filtered.map((pep) => (
              <a
                key={pep.number}
                href={pep.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card p-4 flex items-start gap-4 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all group block"
              >
                <div className="w-14 shrink-0 text-center">
                  <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                    {pep.number}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {pep.title}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[pep.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {pep.status}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full">
                      {pep.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {pep.authors && `by ${pep.authors}`}
                    {pep.created && ` · ${pep.created}`}
                  </p>
                </div>
                <span className="text-gray-300 dark:text-gray-600 group-hover:text-indigo-400 transition-colors shrink-0">→</span>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
