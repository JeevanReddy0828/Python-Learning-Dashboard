import { useState, useRef, useEffect } from 'react'
import { aiApi } from '../../api'

interface Message {
  role: 'ai' | 'user'
  text: string
  phase?: Phase
}

type Phase = 'intro' | 'explain' | 'reexplain' | 'mastered'

const PHASE_LABELS: Record<Phase, string> = {
  intro: 'Introducing concept',
  explain: 'You explain it',
  reexplain: 'Filling gaps',
  mastered: 'Mastered!',
}

interface Props {
  onGenerated?: (title: string, content: string) => void
}

export default function SocraticStandalone({ onGenerated }: Props) {
  const [topic, setTopic] = useState('')
  const [started, setStarted] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState<Phase>('intro')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function startSession() {
    if (!topic.trim()) return
    setStarted(true)
    setLoading(true)
    onGenerated?.(topic, JSON.stringify({ topic, startedAt: new Date().toISOString() }))

    const prompt = `You are a Socratic Python tutor. The student wants to learn "${topic}".

1. Briefly explain the concept in 2-3 simple sentences (ADHD-friendly, no jargon).
2. End with: "Now YOU explain it back to me in your own words. Don't look at my explanation!"

Keep it under 100 words.`

    try {
      const res = await aiApi.chat(prompt, '', topic)
      setMessages([{ role: 'ai', text: res.data.response, phase: 'intro' }])
      setPhase('explain')
    } catch {
      setMessages([{
        role: 'ai',
        text: `Let's learn about "${topic}"! Explain it back to me in your own words — even if you're not sure. Just try!`,
        phase: 'intro',
      }])
      setPhase('explain')
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userText = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text: userText }])
    setLoading(true)

    const history = messages.map((m) => `${m.role === 'ai' ? 'Tutor' : 'Student'}: ${m.text}`).join('\n')

    let prompt: string
    if (phase === 'explain') {
      prompt = `You are a Socratic Python tutor. Topic: "${topic}".

Conversation so far:
${history}

Student just said: "${userText}"

Evaluate their explanation:
- If mostly correct (≥70%): celebrate briefly, point out 1 thing they could add, move to a follow-up question. End with a deeper question about ${topic}.
- If missing key ideas: gently note what's missing (not more than 2 gaps), give a tiny hint, ask them to try again.
- Keep response under 80 words. Be encouraging and ADHD-friendly.
- If they got it well, end with: [MASTERED]`

      setPhase('reexplain')
    } else {
      prompt = `You are a Socratic Python tutor. Topic: "${topic}".

Conversation so far:
${history}

Student just said: "${userText}"

Continue the Socratic dialogue:
- Acknowledge what's right
- Ask one specific follow-up question to deepen understanding
- Keep under 60 words
- If they've shown strong understanding across multiple exchanges, end with: [MASTERED]`
    }

    try {
      const res = await aiApi.chat(prompt, '', topic)
      const text = res.data.response
      const isMastered = text.includes('[MASTERED]')
      const cleanText = text.replace('[MASTERED]', '').trim()
      const nextPhase: Phase = isMastered ? 'mastered' : phase
      setMessages((prev) => [...prev, { role: 'ai', text: cleanText, phase: nextPhase }])
      if (isMastered) setPhase('mastered')
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', text: 'Keep going! What else do you know about this topic?' }])
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setStarted(false)
    setMessages([])
    setPhase('intro')
    setTopic('')
    setInput('')
  }

  if (!started) {
    return (
      <div className="space-y-5">
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-5 text-white">
          <h2 className="text-xl font-bold mb-1">🧠 Socratic Learning Mode</h2>
          <p className="text-violet-100 text-sm">
            Learn a concept, then teach it back. The best way to know if you really understand something.
          </p>
        </div>

        <div className="card p-5 space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">How it works:</p>
            <ol className="text-sm text-gray-500 space-y-1 list-decimal list-inside">
              <li>AI explains a Python concept simply</li>
              <li>You explain it back in your own words</li>
              <li>AI finds the gaps and asks follow-ups</li>
              <li>Repeat until you've truly mastered it</li>
            </ol>
          </div>

          <input
            className="input"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && startSession()}
            placeholder="What do you want to master? (e.g. Python decorators, list comprehensions...)"
          />

          <button onClick={startSession} disabled={!topic.trim()} className="btn-primary w-full py-3">
            🧠 Start Socratic Session
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-900 dark:text-gray-100">🧠 {topic}</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            phase === 'mastered'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
          }`}>
            {PHASE_LABELS[phase]}
          </span>
        </div>
        <button onClick={reset} className="btn-ghost text-xs px-3 py-1.5">New topic</button>
      </div>

      {/* Messages */}
      <div className="card p-4 space-y-3 max-h-[50vh] overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'ai'
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                : 'bg-primary-600 text-white'
            }`}>
              {msg.role === 'ai' && (
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-1">
                  {msg.phase === 'mastered' ? '✅ Tutor' : '🤖 Tutor'}
                </p>
              )}
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {phase === 'mastered' && (
          <div className="text-center py-3">
            <p className="text-2xl mb-1">🎉</p>
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">You've mastered this concept!</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {phase !== 'mastered' && (
        <div className="flex gap-2">
          <input
            className="input flex-1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Explain it in your own words..."
            disabled={loading}
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()} className="btn-primary px-4">
            Send
          </button>
        </div>
      )}

      {phase === 'mastered' && (
        <button onClick={reset} className="btn-primary w-full">
          🧠 Learn Something New
        </button>
      )}
    </div>
  )
}
