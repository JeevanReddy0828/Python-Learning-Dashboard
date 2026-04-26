import { useState } from 'react'
import { aiApi } from '../../api'
import { cn } from '../../utils/cn'

interface Flashcard {
  emoji: string
  concept: string
  tagline: string
  analogy: string
  code: string
  color: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'yellow'
}

const COLOR_MAP = {
  blue:   { card: 'from-blue-400 to-blue-600',    back: 'bg-blue-50 dark:bg-blue-900/30',   text: 'text-blue-700 dark:text-blue-300',   border: 'border-blue-200 dark:border-blue-700' },
  green:  { card: 'from-emerald-400 to-emerald-600', back: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-700' },
  purple: { card: 'from-violet-400 to-violet-600', back: 'bg-violet-50 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-700' },
  orange: { card: 'from-orange-400 to-orange-600', back: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-700' },
  pink:   { card: 'from-pink-400 to-pink-600',    back: 'bg-pink-50 dark:bg-pink-900/30',   text: 'text-pink-700 dark:text-pink-300',   border: 'border-pink-200 dark:border-pink-700' },
  yellow: { card: 'from-amber-400 to-amber-500',  back: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-700' },
}

function FlipCard({ card, index }: { card: Flashcard; index: number }) {
  const [flipped, setFlipped] = useState(false)
  const c = COLOR_MAP[card.color] ?? COLOR_MAP.blue

  return (
    <div
      className="cursor-pointer"
      style={{ perspective: '1000px', height: '220px' }}
      onClick={() => setFlipped((f) => !f)}
    >
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        {/* Front */}
        <div
          className={cn('absolute inset-0 rounded-2xl bg-gradient-to-br text-white flex flex-col items-center justify-center gap-3 p-4 select-none shadow-md', c.card)}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="text-5xl">{card.emoji}</span>
          <p className="text-lg font-bold text-center leading-tight">{card.concept}</p>
          <p className="text-xs text-white/80 text-center">{card.tagline}</p>
          <span className="absolute bottom-3 right-3 text-xs text-white/50">tap to flip</span>
          <span className="absolute top-3 left-3 text-xs bg-white/20 rounded-full w-6 h-6 flex items-center justify-center font-bold">
            {index + 1}
          </span>
        </div>

        {/* Back */}
        <div
          className={cn('absolute inset-0 rounded-2xl border-2 p-4 flex flex-col gap-2 select-none overflow-hidden', c.back, c.border)}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{card.emoji}</span>
            <span className={cn('text-sm font-bold', c.text)}>{card.concept}</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            <span className="font-semibold">💡 </span>{card.analogy}
          </p>
          {card.code && (
            <pre className="text-xs bg-gray-900 text-green-300 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap leading-relaxed mt-auto">
              {card.code}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VisualFlashcards() {
  const [topic, setTopic] = useState('')
  const [cards, setCards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(false)
  const [studyMode, setStudyMode] = useState(false)
  const [studyIndex, setStudyIndex] = useState(0)
  const [studyFlipped, setStudyFlipped] = useState(false)

  async function generate() {
    if (!topic.trim()) return
    setLoading(true)
    setCards([])

    const prompt = `Create 8 visual flashcards for memorizing "${topic}" in Python.
Return ONLY a JSON array (no markdown):
[{
  "emoji": "🧺",
  "concept": "Python List",
  "tagline": "Ordered, changeable collection",
  "analogy": "Like a shopping basket — add/remove items anytime, order matters",
  "code": "items = ['apple', 'milk']\\nitems.append('eggs')  # add to end",
  "color": "blue"
}]
Rules:
- emoji must visually represent the concept (be creative)
- analogy must be a vivid real-world comparison in 1 sentence
- code must be 1-3 lines, runnable, illustrative
- color is one of: blue, green, purple, orange, pink, yellow — vary them
- Return exactly 8 cards. No duplicate emojis. Return ONLY valid JSON array.`

    try {
      const res = await aiApi.chat(prompt, '', topic)
      const raw = res.data.response
      const match = raw.match(/\[[\s\S]*\]/)
      if (match) setCards(JSON.parse(match[0]))
    } catch {
      setCards(getDemoCards(topic))
    } finally {
      setLoading(false)
    }
  }

  if (studyMode && cards.length > 0) {
    const card = cards[studyIndex]
    const c = COLOR_MAP[card.color] ?? COLOR_MAP.blue
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => { setStudyMode(false); setStudyIndex(0); setStudyFlipped(false) }} className="btn-ghost text-sm">
            ← Grid view
          </button>
          <span className="text-sm text-gray-500">{studyIndex + 1} / {cards.length}</span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 transition-all duration-300"
            style={{ width: `${((studyIndex + 1) / cards.length) * 100}%` }}
          />
        </div>

        {/* Big study card */}
        <div
          className="cursor-pointer mx-auto max-w-sm"
          style={{ perspective: '1200px', height: '340px' }}
          onClick={() => setStudyFlipped((f) => !f)}
        >
          <div
            className="relative w-full h-full transition-transform duration-500"
            style={{ transformStyle: 'preserve-3d', transform: studyFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
          >
            <div
              className={cn('absolute inset-0 rounded-3xl bg-gradient-to-br text-white flex flex-col items-center justify-center gap-4 p-6 shadow-xl', c.card)}
              style={{ backfaceVisibility: 'hidden' }}
            >
              <span className="text-7xl">{card.emoji}</span>
              <p className="text-2xl font-bold text-center">{card.concept}</p>
              <p className="text-sm text-white/80 text-center">{card.tagline}</p>
              <p className="text-xs text-white/50 mt-4">tap to reveal</p>
            </div>
            <div
              className={cn('absolute inset-0 rounded-3xl border-2 p-6 flex flex-col gap-3 shadow-xl', c.back, c.border)}
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div className="flex items-center gap-2">
                <span className="text-3xl">{card.emoji}</span>
                <span className={cn('text-xl font-bold', c.text)}>{card.concept}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                <span className="font-semibold">💡 </span>{card.analogy}
              </p>
              {card.code && (
                <pre className="text-xs bg-gray-900 text-green-300 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap leading-relaxed flex-1">
                  {card.code}
                </pre>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setStudyIndex((i) => Math.max(i - 1, 0)); setStudyFlipped(false) }}
            disabled={studyIndex === 0}
            className="btn-secondary px-6 py-2"
          >
            ← Prev
          </button>
          <button
            onClick={() => { setStudyIndex((i) => Math.min(i + 1, cards.length - 1)); setStudyFlipped(false) }}
            disabled={studyIndex === cards.length - 1}
            className="btn-primary px-6 py-2"
          >
            Next →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-pink-500 to-violet-500 rounded-2xl p-5 text-white">
        <h2 className="text-xl font-bold mb-1">🃏 Visual Flashcards</h2>
        <p className="text-pink-100 text-sm">
          Emoji mnemonics + real-world analogies + code snippets. Tap any card to flip.
        </p>
      </div>

      <div className="card p-4 flex gap-3">
        <input
          className="input flex-1"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && generate()}
          placeholder="Topic (e.g. Python lists, decorators, async/await...)"
        />
        <button onClick={generate} disabled={loading || !topic.trim()} className="btn-primary px-5">
          {loading ? '⏳' : '✨ Generate'}
        </button>
      </div>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[220px] rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      )}

      {cards.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{cards.length} cards for <span className="font-semibold text-gray-700 dark:text-gray-300">{topic}</span></p>
            <button onClick={() => { setStudyMode(true); setStudyIndex(0); setStudyFlipped(false) }} className="btn-secondary text-sm px-4 py-1.5">
              📖 Study Mode
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {cards.map((card, i) => (
              <FlipCard key={i} card={card} index={i} />
            ))}
          </div>

          <p className="text-center text-xs text-gray-400">Tap any card to flip • Front: concept • Back: analogy + code</p>
        </>
      )}
    </div>
  )
}

function getDemoCards(topic: string): Flashcard[] {
  const demos: Flashcard[] = [
    { emoji: '📦', concept: 'Variable', tagline: 'Named storage box', analogy: `Like a labelled box — put your ${topic} data inside and retrieve it by name`, code: `x = 42\nname = "${topic}"`, color: 'blue' },
    { emoji: '🔁', concept: 'Loop', tagline: 'Repeat until done', analogy: 'Like a conveyor belt — processes each item one by one', code: `for item in ${topic}:\n    print(item)`, color: 'green' },
    { emoji: '🎯', concept: 'Function', tagline: 'Reusable action', analogy: 'Like a vending machine — put something in, get something out', code: `def process(x):\n    return x * 2`, color: 'purple' },
    { emoji: '🧺', concept: 'List', tagline: 'Ordered collection', analogy: 'Like a shopping basket — ordered and changeable', code: `items = [1, 2, 3]\nitems.append(4)`, color: 'orange' },
    { emoji: '🗺️', concept: 'Dictionary', tagline: 'Key-value pairs', analogy: 'Like a real dictionary — look up meaning by word', code: `d = {"key": "value"}\nprint(d["key"])`, color: 'pink' },
    { emoji: '🧪', concept: 'Condition', tagline: 'Make a decision', analogy: 'Like a traffic light — green means go, red means stop', code: `if x > 0:\n    print("positive")`, color: 'yellow' },
    { emoji: '🏗️', concept: 'Class', tagline: 'Blueprint for objects', analogy: 'Like an architectural blueprint — one design, many buildings', code: `class Dog:\n    def bark(self):\n        return "Woof!"`, color: 'blue' },
    { emoji: '⚡', concept: 'Exception', tagline: 'Handle the unexpected', analogy: 'Like a safety net under a trapeze — catches you when you fall', code: `try:\n    risky()\nexcept Error as e:\n    print(e)`, color: 'green' },
  ]
  return demos
}
