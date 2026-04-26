import { create } from 'zustand'
import type { LessonDetail, ExecutionResult } from '../types'

type AIPanelMode = 'hint' | 'review' | 'explain' | 'chat' | null

interface LessonStore {
  currentLesson: LessonDetail | null
  currentExerciseIndex: number
  editorCode: string
  lastOutput: ExecutionResult | null
  isRunning: boolean
  aiPanelOpen: boolean
  aiPanelMode: AIPanelMode
  hintLevel: number
  setLesson: (lesson: LessonDetail) => void
  setCode: (code: string) => void
  setOutput: (result: ExecutionResult | null) => void
  setRunning: (running: boolean) => void
  setExerciseIndex: (index: number) => void
  openAIPanel: (mode: AIPanelMode) => void
  closeAIPanel: () => void
  incrementHint: () => void
  resetHint: () => void
}

export const useLessonStore = create<LessonStore>((set) => ({
  currentLesson: null,
  currentExerciseIndex: 0,
  editorCode: '',
  lastOutput: null,
  isRunning: false,
  aiPanelOpen: false,
  aiPanelMode: null,
  hintLevel: 1,

  setLesson: (lesson) => set({ currentLesson: lesson, currentExerciseIndex: 0, editorCode: '', lastOutput: null }),
  setCode: (code) => set({ editorCode: code }),
  setOutput: (result) => set({ lastOutput: result }),
  setRunning: (running) => set({ isRunning: running }),
  setExerciseIndex: (index) => set({ currentExerciseIndex: index, editorCode: '', lastOutput: null, hintLevel: 1 }),
  openAIPanel: (mode) => set({ aiPanelOpen: true, aiPanelMode: mode }),
  closeAIPanel: () => set({ aiPanelOpen: false, aiPanelMode: null }),
  incrementHint: () => set((s) => ({ hintLevel: Math.min(s.hintLevel + 1, 3) })),
  resetHint: () => set({ hintLevel: 1 }),
}))
