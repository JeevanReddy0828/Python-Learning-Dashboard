import { useState } from 'react'
import { cn } from '../utils/cn'
import LearningPlanGenerator from '../components/learning/LearningPlanGenerator'
import QuickReference from '../components/learning/QuickReference'
import LevelRoadmap from '../components/learning/LevelRoadmap'
import SocraticStandalone from '../components/learning/SocraticStandalone'

const TABS = [
  { id: 'plan', icon: '⚡', label: '20-Hour Plan', description: '10 focused sessions, 80/20 principle' },
  { id: 'reference', icon: '📄', label: 'Quick Reference', description: 'Single-page cheat sheet' },
  { id: 'roadmap', icon: '🗺️', label: 'Skill Roadmap', description: '5 levels from beginner to expert' },
  { id: 'socratic', icon: '🧠', label: 'Socratic Mode', description: 'Teach it back to learn it deep' },
] as const

type TabId = typeof TABS[number]['id']

export default function LearningToolsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('plan')

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Learning Tools</h1>
        <p className="text-sm text-gray-500 mt-1">AI-powered frameworks to accelerate your Python learning</p>
      </div>

      {/* Tab bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex flex-col items-center gap-1 p-4 rounded-2xl border-2 text-center transition-all',
              activeTab === tab.id
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 bg-white dark:bg-surface-dark'
            )}
          >
            <span className="text-2xl">{tab.icon}</span>
            <span className={cn(
              'text-xs font-semibold',
              activeTab === tab.id ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'
            )}>
              {tab.label}
            </span>
            <span className="text-xs text-gray-400 hidden sm:block">{tab.description}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'plan' && <LearningPlanGenerator />}
        {activeTab === 'reference' && <QuickReference />}
        {activeTab === 'roadmap' && <LevelRoadmap />}
        {activeTab === 'socratic' && <SocraticStandalone />}
      </div>
    </div>
  )
}
