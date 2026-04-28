/**
 * Shows how many students are currently studying this lesson/module.
 * Uses Supabase Realtime Presence — degrades to nothing when not configured.
 */
import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { joinPresence, supabaseEnabled } from '../../lib/supabase'

interface Props {
  lessonSlug: string
}

export default function StudyingNow({ lessonSlug }: Props) {
  const { user } = useAuthStore()
  const [count, setCount] = useState(0)
  const [names, setNames] = useState<string[]>([])

  useEffect(() => {
    if (!user || !supabaseEnabled) return
    const cleanup = joinPresence(
      user.id,
      user.display_name,
      lessonSlug,
      (n, users) => {
        // don't count the current user
        const others = users.filter(u => u.user_id !== user.id)
        setCount(others.length)
        setNames(others.slice(0, 3).map(u => u.display_name.split(' ')[0]))
      },
    )
    return cleanup
  }, [user, lessonSlug])

  if (!supabaseEnabled || count === 0) return null

  return (
    <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-1.5">
      {/* Animated green dot */}
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"/>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"/>
      </span>
      <span>
        <strong>{count}</strong> {count === 1 ? 'student' : 'students'} studying now
        {names.length > 0 && ` — ${names.join(', ')}`}
      </span>
      <span className="text-xs text-emerald-400/60 ml-1">via Supabase</span>
    </div>
  )
}
