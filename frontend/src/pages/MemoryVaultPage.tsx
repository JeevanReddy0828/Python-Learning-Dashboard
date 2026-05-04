import { useState, useEffect } from 'react'
import { memoryApi } from '../api'
import type { MemoryEntry, ChatSessionSummary, ChatSessionDetail } from '../types'
import toast from 'react-hot-toast'

const TYPE_META: Record<string, { icon: string; label: string; color: string }> = {
  note:      { icon: '📝', label: 'Note',      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  code:      { icon: '💻', label: 'Code',      color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
  insight:   { icon: '💡', label: 'Insight',   color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  error_fix: { icon: '🔧', label: 'Error Fix', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
}

const TABS = ['🗄️ Vault', '💬 Session History'] as const
type Tab = typeof TABS[number]

export default function MemoryVaultPage() {
  const [tab, setTab] = useState<Tab>('🗄️ Vault')

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">🗄️ Memory Vault</h1>
        <p className="text-gray-500 text-sm mt-1">Save insights, code snippets, and review your AI conversations.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === '🗄️ Vault' && <VaultTab />}
      {tab === '💬 Session History' && <HistoryTab />}
    </div>
  )
}

// ── Vault Tab ─────────────────────────────────────────────────────────────────

function VaultTab() {
  const [entries, setEntries] = useState<MemoryEntry[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<MemoryEntry | null>(null)

  useEffect(() => {
    load()
  }, [filter])

  async function load() {
    setLoading(true)
    try {
      const r = await memoryApi.listVault(filter === 'all' ? undefined : filter)
      setEntries(r.data)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    await memoryApi.deleteMemory(id)
    setEntries((prev) => prev.filter((e) => e.id !== id))
    toast.success('Memory deleted')
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {['all', 'note', 'code', 'insight', 'error_fix'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {f === 'all' ? '🗂️ All' : `${TYPE_META[f].icon} ${TYPE_META[f].label}`}
            </button>
          ))}
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true) }} className="btn-primary text-sm px-4 py-2">
          + New Memory
        </button>
      </div>

      {showForm && (
        <MemoryForm
          initial={editing}
          onSave={async (data) => {
            if (editing) {
              const r = await memoryApi.updateMemory(editing.id, data)
              setEntries((prev) => prev.map((e) => e.id === editing.id ? r.data : e))
              toast.success('Updated!')
            } else {
              const r = await memoryApi.createMemory(data)
              setEntries((prev) => [r.data, ...prev])
              toast.success('Saved to vault!')
            }
            setShowForm(false)
            setEditing(null)
          }}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-5xl">🗄️</p>
          <p className="text-gray-500 font-medium">Your vault is empty</p>
          <p className="text-gray-400 text-sm">Save notes, code snippets, and insights as you learn.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {entries.map((entry) => (
            <MemoryCard
              key={entry.id}
              entry={entry}
              onEdit={() => { setEditing(entry); setShowForm(true) }}
              onDelete={() => handleDelete(entry.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function MemoryCard({ entry, onEdit, onDelete }: { entry: MemoryEntry; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const meta = TYPE_META[entry.memory_type] ?? TYPE_META.note

  return (
    <div className="card p-4 space-y-2 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${meta.color}`}>
            {meta.icon} {meta.label}
          </span>
          <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">{entry.title}</h3>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={onEdit} className="p-1 text-gray-400 hover:text-primary-500 transition-colors text-xs">✏️</button>
          <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-500 transition-colors text-xs">🗑️</button>
        </div>
      </div>

      <div
        className={`text-sm text-gray-600 dark:text-gray-400 cursor-pointer ${
          entry.memory_type === 'code'
            ? 'font-mono bg-gray-900 text-green-400 rounded-lg p-2 text-xs'
            : ''
        } ${!expanded ? 'line-clamp-3' : ''}`}
        onClick={() => setExpanded((v) => !v)}
      >
        {entry.content}
      </div>

      {entry.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {entry.tags.map((tag) => (
            <span key={tag} className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-500">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400">
        {new Date(entry.updated_at).toLocaleDateString()}
        {entry.lesson_slug && ` · ${entry.lesson_slug}`}
      </p>
    </div>
  )
}

function MemoryForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: MemoryEntry | null
  onSave: (data: { title: string; content: string; memory_type: string; tags: string[]; lesson_slug?: string }) => Promise<void>
  onCancel: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [type, setType] = useState(initial?.memory_type ?? 'note')
  const [tagsRaw, setTagsRaw] = useState(initial?.tags.join(', ') ?? '')
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({
        title,
        content,
        memory_type: type,
        tags: tagsRaw.split(',').map((t) => t.trim()).filter(Boolean),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="card p-5 space-y-4 border-2 border-primary-200 dark:border-primary-800">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{initial ? 'Edit Memory' : 'New Memory'}</h3>

      <div className="flex gap-2">
        {Object.entries(TYPE_META).map(([k, v]) => (
          <button
            key={k}
            type="button"
            onClick={() => setType(k)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
              type === k ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            {v.icon} {v.label}
          </button>
        ))}
      </div>

      <input
        className="input"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <textarea
        className={`w-full rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-900 dark:text-gray-100 ${
          type === 'code' ? 'font-mono bg-gray-900 text-green-400' : ''
        }`}
        rows={5}
        placeholder={type === 'code' ? '# paste your code here' : 'What do you want to remember?'}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />

      <input
        className="input"
        placeholder="Tags (comma separated): python, loops, debugging"
        value={tagsRaw}
        onChange={(e) => setTagsRaw(e.target.value)}
      />

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="btn-ghost px-4 py-2 text-sm">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary px-4 py-2 text-sm">
          {saving ? 'Saving...' : initial ? 'Update' : 'Save to Vault'}
        </button>
      </div>
    </form>
  )
}

// ── Session History Tab ───────────────────────────────────────────────────────

function HistoryTab() {
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([])
  const [selected, setSelected] = useState<ChatSessionDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    memoryApi.listSessions().then((r) => setSessions(r.data)).finally(() => setLoading(false))
  }, [])

  async function loadSession(id: string) {
    const r = await memoryApi.getSession(id)
    setSelected(r.data)
  }

  async function deleteSession(id: string) {
    await memoryApi.deleteSession(id)
    setSessions((prev) => prev.filter((s) => s.id !== id))
    if (selected?.id === id) setSelected(null)
    toast.success('Session deleted')
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Loading sessions...</div>

  if (sessions.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-5xl">💬</p>
        <p className="text-gray-500 font-medium">No chat sessions yet</p>
        <p className="text-gray-400 text-sm">Your AI tutor conversations will appear here automatically.</p>
      </div>
    )
  }

  return (
    <div className="flex gap-4 h-[65vh]">
      {/* Session list */}
      <aside className="w-72 shrink-0 space-y-2 overflow-y-auto pr-1">
        {sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => loadSession(s.id)}
            className={`w-full text-left p-3 rounded-xl transition-all group ${
              selected?.id === s.id
                ? 'bg-primary-100 dark:bg-primary-900/40 border border-primary-300 dark:border-primary-700'
                : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750'
            }`}
          >
            <div className="flex items-start justify-between gap-1">
              <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{s.title}</p>
              <button
                onClick={(e) => { e.stopPropagation(); deleteSession(s.id) }}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-xs transition-opacity shrink-0"
              >
                🗑️
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {s.message_count} messages · {new Date(s.last_message_at).toLocaleDateString()}
            </p>
            {s.lesson_slug && (
              <p className="text-xs text-primary-500 mt-0.5 truncate">📖 {s.lesson_slug}</p>
            )}
          </button>
        ))}
      </aside>

      {/* Message viewer */}
      <div className="flex-1 card p-4 overflow-y-auto">
        {!selected ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Select a session to view messages
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 pb-2 border-b border-gray-100 dark:border-gray-700">
              💬 {selected.title}
            </h3>
            {selected.messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'ai'
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                    : 'bg-primary-600 text-white'
                }`}>
                  {msg.role === 'ai' && (
                    <p className="text-xs font-semibold text-gray-400 mb-1">🤖 Tutor</p>
                  )}
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs opacity-50 mt-1">{new Date(msg.created_at).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
