import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import { useGamificationStore } from '../../store/gamificationStore'

export default function ConfettiCelebration() {
  const { showConfetti, confettiIntensity, clearConfetti } = useGamificationStore()

  useEffect(() => {
    if (!showConfetti) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) { clearConfetti(); return }

    if (confettiIntensity === 'small') {
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.8 }, colors: ['#7C3AED', '#10B981', '#F6C90E'] })
    } else if (confettiIntensity === 'medium') {
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.7 } })
    } else {
      // Large — full screen burst
      const duration = 2500
      const end = Date.now() + duration
      const frame = () => {
        confetti({ particleCount: 6, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#7C3AED', '#8B5CF6', '#F6C90E'] })
        confetti({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#10B981', '#059669', '#7C3AED'] })
        if (Date.now() < end) requestAnimationFrame(frame)
      }
      frame()
    }

    const timeout = setTimeout(clearConfetti, 3000)
    return () => clearTimeout(timeout)
  }, [showConfetti, confettiIntensity, clearConfetti])

  return null
}
