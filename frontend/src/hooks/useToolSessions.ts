import { useState, useCallback } from 'react'

export interface ToolSession {
  id: string
  title: string
  content: string        // JSON-stringified payload specific to each tool
  createdAt: string
}

const MAX_SESSIONS = 20

export function useToolSessions(toolId: string) {
  const storageKey = `tool_sessions_${toolId}`

  function load(): ToolSession[] {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '[]')
    } catch {
      return []
    }
  }

  const [sessions, setSessions] = useState<ToolSession[]>(load)

  const save = useCallback((title: string, content: string): ToolSession => {
    const session: ToolSession = {
      id: crypto.randomUUID(),
      title,
      content,
      createdAt: new Date().toISOString(),
    }
    setSessions((prev) => {
      const next = [session, ...prev].slice(0, MAX_SESSIONS)
      localStorage.setItem(storageKey, JSON.stringify(next))
      return next
    })
    return session
  }, [storageKey])

  const remove = useCallback((id: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id)
      localStorage.setItem(storageKey, JSON.stringify(next))
      return next
    })
  }, [storageKey])

  const clear = useCallback(() => {
    localStorage.removeItem(storageKey)
    setSessions([])
  }, [storageKey])

  return { sessions, save, remove, clear }
}
