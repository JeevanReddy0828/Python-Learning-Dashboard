import { useState, useRef } from 'react'
import { aiApi } from '../../api'
import type { LessonDetail } from '../../types'

/**
 * Socratic Mode — "Explain [topic] in simplest terms. Have me re-explain it back.
 * Point out gaps, re-teach what I miss, and repeat until I can explain it clearly."
 */

interface Message {
  role: 'ai' | 'user'
  content: string
}

interface Props {
  lesson: LessonDetail
}

export default function SocraticMode({ lesson }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState<'intro' | 'explain' | 'reexplain' | 'gaps' | 'mastered'>('intro')
  const bottomRef = useRef<HTMLDivElement>(null)
  const roundRef = useRef(0)

  const addMessage = (role: 'ai' | 'user', content: string) => {
    setMessages((prev) => [...prev, { role, content }])
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  async function startSession() {
    setLoading(true)
    setPhase('explain')
    const systemPrompt = `You are a Socratic Python tutor. The student is studying: "${lesson.title}".

Step 1: Explain this concept in the SIMPLEST possible terms (ELI5). Use an analogy. Keep it under 4 sentences.
Then ask: "Now YOU explain it back to me in your own words — don't look at the lesson!"`

    try {
      const res = await aiApi.chat(systemPrompt, '', lesson.title)
      addMessage('ai', res.data.response)
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    addMessage('user', userMsg)
    setLoading(true)

    let systemContext = ''

    if (phase === 'explain') {
      setPhase('reexplain')
      systemContext = `The student is explaining "${lesson.title}" back to you.
Their explanation: "${userMsg}"

Analyze their understanding:
1. Point out 1-2 specific gaps or misconceptions (be gentle and encouraging)
2. Re-teach those specific points in 2-3 sentences
3. Ask them to try explaining again — specifically the parts they got wrong

If their explanation is mostly correct (>80%), say "Excellent! You've got it!" and give them a ⭐ mastery badge summary.`
    } else if (phase === 'reexplain') {
      roundRef.current++
      if (roundRef.current >= 2) {
        setPhase('mastered')
        systemContext = `The student has explained "${lesson.title}" ${roundRef.current + 1} times.
Latest explanation: "${userMsg}"

Evaluate: Do they understand the core concept?
- If yes (score ≥ 80%): Congratulate them warmly! Tell them exactly what they got right. Give a ⭐ mastery summary in bullet points.
- If still missing key points: Gently correct one last time, then wrap up with what they DO understand.
End with an encouraging message like "You're making great progress! 🎉"`
      } else {
        systemContext = `The student is re-explaining "${lesson.title}".
Their attempt: "${userMsg}"

Identify remaining gaps. Re-teach briefly. Ask them to explain one more time.
Be encouraging — they're working hard!`
      }
    } else {
      systemContext = `Continue the Socratic tutoring session on "${lesson.title}".
Student message: "${userMsg}"
Be encouraging and helpful.`
    }

    try {
      const history = messages.map((m) => `${m.role === 'ai' ? 'Tutor' : 'Student'}: ${m.content}`).join('\n')
      const res = await aiApi.chat(systemContext, history, lesson.title)
      addMessage('ai', res.data.response)

      if (phase === 'mastered' || res.data.response.includes('⭐') || res.data.response.toLowerCase().includes("you've got it")) {
        setPhase('mastered')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Info */}
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 mb-4 text-sm">
        <p className="font-semibold text-purple-700 dark:text-purple-300 mb-1">🧠 Socratic Learning Mode</p>
        <p className="text-gray-600 dark:text-gray-400 text-xs">
          AI explains the concept → you explain it back → AI finds gaps → repeat until you truly understand it.
        </p>
      </div>

      {messages.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-4xl mb-3">🧠</p>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Ready to truly master <strong>{lesson.title}</strong>?
          </p>
          <button onClick={startSession} disabled={loading} className="btn-primary px-6 py-3">
            {loading ? 'Starting...' : 'Start Teaching Me'}
          </button>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-0">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === 'ai'
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-gray-800 dark:text-gray-200 rounded-tl-sm'
                    : 'bg-primary-600 text-white rounded-tr-sm'
                }`}>
                  {msg.role === 'ai' && <span className="text-xs text-primary-400 font-semibold block mb-1">🤖 Pybot</span>}
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-primary-50 dark:bg-primary-900/30 rounded-2xl px-4 py-3 rounded-tl-sm">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Mastered badge */}
          {phase === 'mastered' && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 mb-3 text-center text-sm">
              ⭐ Concept mastered! Great job explaining it in your own words.
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2 shrink-0">
            <input
              className="input flex-1 text-sm py-2"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Explain the concept in your own words..."
              disabled={loading}
            />
            <button onClick={sendMessage} disabled={!input.trim() || loading} className="btn-primary px-4 shrink-0">
              ↑
            </button>
          </div>
        </>
      )}
    </div>
  )
}
