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

export default function DebugChallenge({ exercise, onResult }: Props) {
  const [code, setCode] = useState(exercise.starter_code || '')
  const [output, setOutput] = useState<{ stdout: string; stderr: string } | null>(null)
  const [running, setRunning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [hintIndex, setHintIndex] = useState(-1)
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
        addXPEvent(xp_gained, 'Bug squashed! 🦟')
        triggerConfetti('medium')
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
          <span className="bg-red-100 text-red-600 badge">🐛 Debug Challenge</span>
          <span className="text-xs text-yellow-500 font-medium">+{exercise.xp_reward} XP</span>
        </div>
        <p className="text-gray-700 dark:text-gray-300 mb-2 font-medium">{exercise.title}</p>
        <p className="text-sm text-gray-500 mb-4">{exercise.instructions}</p>

        <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2 mb-3">
          🐛 This code has a bug — find and fix it!
        </div>

        <CodeEditor value={code} onChange={setCode} height="180px" />

        {output && <OutputPanel stdout={output.stdout} stderr={output.stderr} />}

        <div className="flex gap-3 mt-4">
          <button onClick={handleRun} disabled={running} className="btn-secondary flex-1">
            {running ? '⏳ Running...' : '▶ Test Fix'}
          </button>
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1">
            {submitting ? 'Checking...' : '🐛 Submit Fix'}
          </button>
          {exercise.hints.length > 0 && hintIndex < exercise.hints.length - 1 && (
            <button onClick={() => setHintIndex((h) => h + 1)} className="btn-ghost px-4">💡</button>
          )}
        </div>

        {hintIndex >= 0 && (
          <div className="mt-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-sm text-amber-700 dark:text-amber-300">
            💡 {exercise.hints[hintIndex]}
          </div>
        )}
      </div>
    </div>
  )
}
