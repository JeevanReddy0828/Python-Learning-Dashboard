/**
 * Exports the user's learning progress to a Notion database.
 * Requires NOTION_TOKEN + NOTION_DATABASE_ID in backend .env.
 */
import { useState } from 'react'
import { exportApi } from '../../api'
import toast from 'react-hot-toast'

export default function NotionExport() {
  const [loading, setLoading] = useState(false)
  const [notionUrl, setNotionUrl] = useState<string | null>(null)

  async function handleExport() {
    setLoading(true)
    try {
      const res = await exportApi.toNotion()
      setNotionUrl(res.data.notion_url)
      toast.success(res.data.message)
    } catch (err: any) {
      const detail = err?.response?.data?.detail ?? 'Export failed'
      toast.error(detail)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center gap-3">
        {/* Notion logo SVG */}
        <svg width="32" height="32" viewBox="0 0 100 100" fill="none">
          <rect width="100" height="100" rx="16" fill="#fff"/>
          <path d="M17.5 18.5c3.4 2.8 4.7 2.6 11.2 2.1l60.8-3.6c1.2 0 .2-1.2-.2-1.4l-10.2-7.4C77.3 6.9 75.9 7 73.9 7.3l-58.9 4.3c-2.2.2-2.7 1.3-1.5 2.2l4 4.7zM21 30.4v63.1c0 3.4 1.7 4.7 5.5 4.4l66.8-3.8c3.8-.2 4.7-2.4 4.7-5.3V26.5c0-2.9-1.1-4.4-3.6-4.2l-70 4c-2.7.2-3.4 1.5-3.4 4.1zm65.2 2.7c.4 1.8 0 3.6-1.8 3.8l-2.9.5v43c-2.5 1.3-4.9 2-6.9 2-3.1 0-3.9-1-6.3-3.9l-19.2-30.2v29.2l6.1 1.3s0 3.6-5 3.6l-13.8.8c-.4-.8 0-2.7 1.4-3.1l3.6-1V41.4L35.6 41c-.4-1.8.7-4.4 3.8-4.6l14.8-.9 19.9 30.5V37.2l-5.1-.6c-.4-2.2.9-3.8 2.9-4l15.3-1z" fill="#000"/>
        </svg>
        <div>
          <h3 className="font-bold text-gray-800 dark:text-gray-100">Export to Notion</h3>
          <p className="text-xs text-gray-500">Save your XP, levels, and achievements to your Notion workspace</p>
        </div>
      </div>

      {notionUrl ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 space-y-2">
          <p className="text-sm text-green-700 dark:text-green-300 font-semibold">✓ Exported successfully!</p>
          <a
            href={notionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-sm inline-flex items-center gap-2"
          >
            Open in Notion ↗
          </a>
        </div>
      ) : (
        <button
          onClick={handleExport}
          disabled={loading}
          className="btn-secondary w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <><span className="animate-spin">⚙️</span> Exporting…</>
          ) : (
            <>📤 Export Progress to Notion</>
          )}
        </button>
      )}

      <p className="text-xs text-gray-400 dark:text-gray-500">
        Requires <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">NOTION_TOKEN</code> in your{' '}
        <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">.env</code>.{' '}
        <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="text-primary-500 underline">
          Create one free →
        </a>
      </p>
    </div>
  )
}
