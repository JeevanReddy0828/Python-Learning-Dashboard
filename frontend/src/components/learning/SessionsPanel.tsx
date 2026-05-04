import type { ToolSession } from '../../hooks/useToolSessions'

interface Props {
  sessions: ToolSession[]
  onRestore: (session: ToolSession) => void
  onDelete: (id: string) => void
  onClear: () => void
  activeId?: string
}

export default function SessionsPanel({ sessions, onRestore, onDelete, onClear, activeId }: Props) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-10 px-4 space-y-2">
        <p className="text-3xl">📭</p>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No sessions yet</p>
        <p className="text-xs text-gray-400">Generate content and it auto-saves here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-1 p-2">
      <div className="flex items-center justify-between px-2 pb-2 border-b border-gray-100 dark:border-gray-700">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {sessions.length} saved
        </span>
        <button
          onClick={onClear}
          className="text-xs text-red-400 hover:text-red-600 transition-colors"
        >
          Clear all
        </button>
      </div>

      {sessions.map((s) => (
        <div
          key={s.id}
          onClick={() => onRestore(s)}
          className={`group flex items-start justify-between gap-2 p-2.5 rounded-xl cursor-pointer transition-all ${
            activeId === s.id
              ? 'bg-primary-100 dark:bg-primary-900/40 border border-primary-200 dark:border-primary-700'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <div className="min-w-0">
            <p className={`text-sm font-medium truncate ${
              activeId === s.id
                ? 'text-primary-700 dark:text-primary-300'
                : 'text-gray-800 dark:text-gray-200'
            }`}>
              {s.title}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(s.createdAt).toLocaleDateString(undefined, {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(s.id) }}
            className="opacity-0 group-hover:opacity-100 shrink-0 text-gray-400 hover:text-red-500 transition-all text-xs pt-0.5"
            title="Delete session"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
