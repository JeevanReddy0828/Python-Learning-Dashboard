import { useState, useEffect, useRef, useCallback } from 'react'

type Phase = 'work' | 'short_break' | 'long_break'

const DURATIONS: Record<Phase, number> = {
  work: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
}

export function usePomodoro() {
  const [phase, setPhase] = useState<Phase>('work')
  const [timeLeft, setTimeLeft] = useState(DURATIONS.work)
  const [isActive, setIsActive] = useState(false)
  const [completedPomodoros, setCompletedPomodoros] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const notify = useCallback((message: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('PyLearn', { body: message, icon: '/icons/icon-192.png' })
    }
  }, [])

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!)
            setIsActive(false)

            if (phase === 'work') {
              const next = completedPomodoros + 1
              setCompletedPomodoros(next)
              const nextPhase = next % 4 === 0 ? 'long_break' : 'short_break'
              notify(nextPhase === 'long_break' ? '🎉 Long break time! You earned it.' : '☕ Take a 5-min break!')
              setPhase(nextPhase)
              setTimeLeft(DURATIONS[nextPhase])
            } else {
              notify('🔥 Break over! Time to focus.')
              setPhase('work')
              setTimeLeft(DURATIONS.work)
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isActive, phase, completedPomodoros, notify])

  const start = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    setIsActive(true)
  }, [])

  const pause = useCallback(() => setIsActive(false), [])

  const reset = useCallback(() => {
    setIsActive(false)
    setTimeLeft(DURATIONS[phase])
  }, [phase])

  const skipToPhase = useCallback((p: Phase) => {
    setIsActive(false)
    setPhase(p)
    setTimeLeft(DURATIONS[p])
  }, [])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const progress = 1 - timeLeft / DURATIONS[phase]

  return { phase, timeLeft, minutes, seconds, progress, isActive, completedPomodoros, start, pause, reset, skipToPhase }
}
