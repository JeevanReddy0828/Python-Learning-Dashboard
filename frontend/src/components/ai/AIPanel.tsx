import { useState } from 'react'
import { useLessonStore } from '../../store/lessonStore'
import type { LessonDetail } from '../../types'
import CodeHelper from './CodeHelper'
import CodeReviewer from './CodeReviewer'
import CodeExplainer from './CodeExplainer'
import SocraticMode from './SocraticMode'
import { cn } from '../../utils/cn'

interface Props {
  lesson: LessonDetail
}

const TABS = [
  { id: 'hint', label: '💡 Hint', title: 'Code Helper' },
  { id: 'review', label: '🔍 Review', title: 'Code Reviewer' },
  { id: 'explain', label: '📖 Explain', title: 'Code Explainer' },
  { id: 'socratic', label: '🧠 Teach Me', title: 'Socratic Mode' },
] as const

type TabId = typeof TABS[number]['id']

export default function AIPanel({ lesson }: Props) {
  const { aiPanelOpen, aiPanelMode, editorCode, currentExerciseIndex, closeAIPanel, openAIPanel } = useLessonStore()
  const [activeTab, setActiveTab] = useState<TabId>('hint')

  const exercise = lesson.exercises[currentExerciseIndex]

  const handleTabClick = (tab: TabId) => {
    if (aiPanelOpen && activeTab === tab) {
      closeAIPanel()
    } else {
      setActiveTab(tab)
      openAIPanel(tab)
    }
  }

  return (
    <>
      {/* Floating AI trigger buttons */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            title={tab.title}
            className={cn(
              'w-10 h-10 rounded-xl text-lg flex items-center justify-center shadow-md transition-all',
              aiPanelOpen && activeTab === tab.id
                ? 'bg-primary-600 text-white scale-110'
                : 'bg-white dark:bg-surface-dark text-gray-600 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 border border-gray-200 dark:border-gray-700'
            )}
          >
            {tab.label.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Slide-in panel */}
      <div className={cn(
        'fixed right-0 top-0 h-full w-96 bg-white dark:bg-surface-dark border-l border-gray-200 dark:border-gray-700 shadow-2xl z-30 flex flex-col transition-transform duration-300',
        aiPanelOpen ? 'translate-x-0' : 'translate-x-full'
      )}>
        {/* Panel header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">
            {TABS.find((t) => t.id === activeTab)?.title}
          </h2>
          <button onClick={closeAIPanel} className="btn-ghost w-8 h-8 rounded-lg text-gray-400">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-700">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 py-2 text-xs font-medium transition-colors',
                activeTab === tab.id
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Panel body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'hint' && <CodeHelper code={editorCode} exercise={exercise} />}
          {activeTab === 'review' && <CodeReviewer code={editorCode} exercise={exercise} />}
          {activeTab === 'explain' && <CodeExplainer code={editorCode} />}
          {activeTab === 'socratic' && <SocraticMode lesson={lesson} />}
        </div>
      </div>
    </>
  )
}
