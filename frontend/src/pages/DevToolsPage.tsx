import { useState } from 'react'
import { cn } from '../utils/cn'
import GitHubTrending from '../components/devtools/GitHubTrending'
import PyPIExplorer from '../components/devtools/PyPIExplorer'
import RegexLab from '../components/devtools/RegexLab'
import JsonDictConverter from '../components/devtools/JsonDictConverter'
import PEPBrowser from '../components/devtools/PEPBrowser'
import CurlConverter from '../components/devtools/CurlConverter'

const TOOLS = [
  { id: 'github',  icon: '🔥', label: 'GitHub Trending', jd: 'open source, git' },
  { id: 'pypi',    icon: '📦', label: 'PyPI Explorer',   jd: 'pip, packages' },
  { id: 'regex',   icon: '🔍', label: 'Regex Lab',       jd: 'data parsing, regex' },
  { id: 'json',    icon: '🔄', label: 'JSON ↔ Dict',     jd: 'REST APIs, JSON' },
  { id: 'pep',     icon: '📜', label: 'PEP Browser',     jd: 'PEP 8, type hints' },
  { id: 'curl',    icon: '🌐', label: 'cURL → Python',   jd: 'HTTP, requests' },
] as const

type ToolId = typeof TOOLS[number]['id']

export default function DevToolsPage() {
  const [active, setActive] = useState<ToolId>('github')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">🛠️ Dev Tools</h1>
        <p className="text-sm text-gray-500 mt-1">
          Real tools used by Python developers daily — straight from the job descriptions
        </p>

        {/* Tool tabs */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActive(tool.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-medium shrink-0 transition-all',
                active === tool.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark text-gray-600 dark:text-gray-300 hover:border-primary-300'
              )}
            >
              <span>{tool.icon}</span>
              <span>{tool.label}</span>
              <span className="hidden sm:inline text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-full">
                {tool.jd}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tool content */}
      <div className="flex-1 overflow-y-auto p-6">
        {active === 'github' && <GitHubTrending />}
        {active === 'pypi'   && <PyPIExplorer />}
        {active === 'regex'  && <RegexLab />}
        {active === 'json'   && <JsonDictConverter />}
        {active === 'pep'    && <PEPBrowser />}
        {active === 'curl'   && <CurlConverter />}
      </div>
    </div>
  )
}
