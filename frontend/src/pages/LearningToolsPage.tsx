import { useState } from 'react'
import { cn } from '../utils/cn'
import { useToolSessions, type ToolSession } from '../hooks/useToolSessions'
import SessionsPanel from '../components/learning/SessionsPanel'
import LearningPlanGenerator from '../components/learning/LearningPlanGenerator'
import QuickReference from '../components/learning/QuickReference'
import LevelRoadmap from '../components/learning/LevelRoadmap'
import SocraticStandalone from '../components/learning/SocraticStandalone'
import VisualFlashcards from '../components/learning/VisualFlashcards'
import ConceptMap from '../components/learning/ConceptMap'
import HoppscotchPlayground from '../components/tools/HoppscotchPlayground'

const TABS = [
  { id: 'plan',      icon: '⚡',  label: '20-Hour Plan',    hasSessions: true },
  { id: 'reference', icon: '📄',  label: 'Quick Reference', hasSessions: false },
  { id: 'roadmap',   icon: '🗺️', label: 'Skill Roadmap',   hasSessions: false },
  { id: 'socratic',  icon: '🧠',  label: 'Socratic Mode',   hasSessions: true },
  { id: 'cards',     icon: '🃏',  label: 'Flashcards',      hasSessions: true },
  { id: 'map',       icon: '🕸️', label: 'Concept Map',     hasSessions: true },
  { id: 'api',       icon: '🔌',  label: 'API Playground',  hasSessions: false },
] as const

type TabId = typeof TABS[number]['id']

export default function LearningToolsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('plan')
  const [showSessions, setShowSessions] = useState(false)
  const [restoredSession, setRestoredSession] = useState<ToolSession | null>(null)

  const activeTabMeta = TABS.find((t) => t.id === activeTab)!

  // One session store per tool
  const planSessions    = useToolSessions('plan')
  const socraticSessions = useToolSessions('socratic')
  const cardSessions    = useToolSessions('cards')
  const mapSessions     = useToolSessions('map')

  const sessionStore = {
    plan:     planSessions,
    socratic: socraticSessions,
    cards:    cardSessions,
    map:      mapSessions,
  } as Record<string, ReturnType<typeof useToolSessions>>

  const currentStore = sessionStore[activeTab]

  function handleTabChange(id: TabId) {
    setActiveTab(id)
    setRestoredSession(null)
    if (!TABS.find((t) => t.id === id)?.hasSessions) setShowSessions(false)
  }

  function handleRestore(session: ToolSession) {
    setRestoredSession(session)
    setShowSessions(false)
  }

  function handleGenerated(title: string, content: string) {
    currentStore?.save(title, content)
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Learning Tools</h1>
              <p className="text-sm text-gray-500 mt-1">
                AI-powered frameworks + real integrations to accelerate your Python journey
              </p>
            </div>

            {activeTabMeta.hasSessions && (
              <button
                onClick={() => setShowSessions((v) => !v)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border',
                  showSessions
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white dark:bg-surface-dark border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary-400'
                )}
              >
                🕐 Sessions
                {currentStore?.sessions.length > 0 && (
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded-full font-bold',
                    showSessions ? 'bg-white/20 text-white' : 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                  )}>
                    {currentStore.sessions.length}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Tab bar */}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'relative flex flex-col items-center gap-1 p-3 rounded-2xl border-2 text-center transition-all',
                  activeTab === tab.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 bg-white dark:bg-surface-dark'
                )}
              >
                <span className="text-xl">{tab.icon}</span>
                <span className={cn(
                  'text-xs font-semibold leading-tight',
                  activeTab === tab.id ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'
                )}>
                  {tab.label}
                </span>
                {tab.hasSessions && sessionStore[tab.id]?.sessions.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {sessionStore[tab.id].sessions.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Restored session banner */}
          {restoredSession && (
            <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl text-sm">
              <span>🔄</span>
              <span className="flex-1 text-amber-800 dark:text-amber-300">
                Restored: <strong>{restoredSession.title}</strong>
                <span className="text-amber-600 dark:text-amber-400 ml-2 text-xs">
                  {new Date(restoredSession.createdAt).toLocaleString()}
                </span>
              </span>
              <button
                onClick={() => setRestoredSession(null)}
                className="text-amber-500 hover:text-amber-700 text-xs"
              >
                ✕ Clear
              </button>
            </div>
          )}

          {/* Tool content */}
          <div>
            {activeTab === 'plan' && (
              <LearningPlanGenerator
                onGenerated={handleGenerated}
                restored={restoredSession?.content}
              />
            )}
            {activeTab === 'reference' && <QuickReference />}
            {activeTab === 'roadmap'   && <LevelRoadmap />}
            {activeTab === 'socratic'  && (
              <SocraticStandalone onGenerated={handleGenerated} />
            )}
            {activeTab === 'cards' && (
              <VisualFlashcards
                onGenerated={handleGenerated}
                restored={restoredSession?.content}
              />
            )}
            {activeTab === 'map' && (
              <ConceptMap
                onGenerated={handleGenerated}
                restored={restoredSession?.content}
              />
            )}
            {activeTab === 'api' && <HoppscotchPlayground />}
          </div>
        </div>
      </div>

      {/* Sessions sidebar */}
      {showSessions && activeTabMeta.hasSessions && currentStore && (
        <aside className="w-72 shrink-0 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark overflow-y-auto flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-surface-dark z-10">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              🕐 {activeTabMeta.label} Sessions
            </h3>
            <button
              onClick={() => setShowSessions(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none"
            >
              ✕
            </button>
          </div>

          <div className="flex-1">
            <SessionsPanel
              sessions={currentStore.sessions}
              activeId={restoredSession?.id}
              onRestore={handleRestore}
              onDelete={currentStore.remove}
              onClear={currentStore.clear}
            />
          </div>
        </aside>
      )}
    </div>
  )
}
