import { useState } from 'react'
import type { ExerciseSummary } from '../../types'
import { exercisesApi } from '../../api'
import { useGamificationStore } from '../../store/gamificationStore'
import CodeEditor from '../editor/CodeEditor'
import OutputPanel from '../editor/OutputPanel'
import { runPython } from '../../utils/pyodideRunner'

interface Props {
  exercise: ExerciseSummary & { instructions: string; starter_code: string | null; hints: string[] }
  onResult: (passed: boolean, feedback: string, xp: number) => void
}

export default function MiniProject({ exercise, onResult }: Props) {
  const [code, setCode] = useState(exercise.starter_code || '')
  const [output, setOutput] = useState<{ stdout: string; stderr: string } | null>(null)
  const [running, setRunning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [hintIdx, setHintIdx] = useState(-1)
  const { addXPEvent, triggerConfetti, addAchievements } = useGamificationStore()

  async function handleRun() {
    setRunning(true)
    const result = await runPython(code)
    setOutput({ stdout: result.stdout, stderr: result.stderr })
    setRunning(false)
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await exercisesApi.submit(exercise.id, { code })
      const { passed, feedback, xp_gained, new_achievements } = res.data
      if (passed) {
        addXPEvent(xp_gained, 'Project complete! 🚀')
        triggerConfetti('large')
        if (new_achievements.length > 0) addAchievements(new_achievements)
      }
      onResult(passed, feedback, xp_gained)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-purple-100 text-purple-700 badge">🚀 Mini Project</span>
          <span className="text-xs text-yellow-500 font-medium">+{exercise.xp_reward} XP</span>
        </div>
        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg mb-2">{exercise.title}</h3>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
          <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">{exercise.instructions}</pre>
        </div>

        <CodeEditor value={code} onChange={setCode} height="280px" />

        {output && <OutputPanel stdout={output.stdout} stderr={output.stderr} />}

        <div className="flex gap-3 mt-4">
          <button onClick={handleRun} disabled={running} className="btn-secondary flex-1">
            {running ? '⏳ Running...' : '▶ Run'}
          </button>
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1 py-3">
            {submitting ? 'Checking...' : '🚀 Submit Project'}
          </button>
        </div>

        {exercise.hints.length > 0 && (
          <div className="mt-3 flex gap-2">
            {exercise.hints.map((hint, i) => (
              <button
                key={i}
                onClick={() => setHintIdx(i)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  hintIdx >= i ? 'bg-amber-100 border-amber-300 text-amber-700' : 'border-gray-200 text-gray-500 hover:border-amber-300'
                }`}
              >
                💡 Hint {i + 1}
              </button>
            ))}
          </div>
        )}

        {hintIdx >= 0 && (
          <div className="mt-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-sm text-amber-700 dark:text-amber-300">
            {exercise.hints[hintIdx]}
          </div>
        )}
      </div>
    </div>
  )
}
