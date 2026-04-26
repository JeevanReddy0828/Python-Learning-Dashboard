const MESSAGES = [
  "You're doing amazing! 🌟",
  "Great focus — keep it up! 🎯",
  "Look at you go! 🚀",
  "This is how champions learn 🏆",
  "Every line of code makes you stronger 💪",
  "You're in the zone! Stay with it 🔥",
  "Seriously, you're crushing this! 🎉",
  "Your brain is building new pathways right now 🧠",
]

interface Props {
  onDismiss: () => void
}

export default function MicroWin({ onDismiss }: Props) {
  const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)]

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-white dark:bg-surface-dark border-2 border-primary-200 dark:border-primary-800 rounded-2xl shadow-xl px-6 py-4 flex items-center gap-4 max-w-sm">
        <span className="text-3xl">🌟</span>
        <div className="flex-1">
          <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{msg}</p>
          <p className="text-xs text-gray-400 mt-0.5">You've been learning for 2 minutes straight!</p>
        </div>
        <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600 text-sm ml-2">✕</button>
      </div>
    </div>
  )
}
