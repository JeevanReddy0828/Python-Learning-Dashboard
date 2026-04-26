interface Props {
  streak: number
}

export default function StreakCounter({ streak }: Props) {
  const emoji = streak >= 7 ? '🔥' : streak >= 3 ? '⚡' : streak >= 1 ? '✨' : '💤'
  return (
    <div className="flex items-center gap-2">
      <span className="text-xl">{emoji}</span>
      <div>
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{streak} day streak</span>
        {streak === 0 && <p className="text-xs text-gray-400">Start today!</p>}
        {streak > 0 && <p className="text-xs text-gray-400">Keep it going!</p>}
      </div>
    </div>
  )
}
