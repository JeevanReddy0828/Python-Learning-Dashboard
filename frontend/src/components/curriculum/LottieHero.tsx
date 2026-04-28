/**
 * Animated lesson hero banner.
 * Shows a gradient card with floating Python syntax tokens — all CSS, no network needed.
 * When a valid lottie-react animation path is configured per slug, it renders that instead.
 */
import { useRef } from 'react'
import Lottie, { LottieRefCurrentProps } from 'lottie-react'

// ── Lesson metadata ────────────────────────────────────────────────────────────

const META: Record<string, { emoji: string; label: string; gradient: string; tokens: string[] }> = {
  'what-is-a-variable':   { emoji: '📦', label: 'Variables store your data',       gradient: 'from-violet-600 to-purple-800',  tokens: ['score = 42','name = "Alice"','is_win = True','x = 3.14'] },
  'data-types-basics':    { emoji: '🏷️', label: 'Python has 4 core data types',   gradient: 'from-blue-600 to-indigo-800',    tokens: ['int','float','str','bool','type()'] },
  'string-power':         { emoji: '🔤', label: 'Strings are text sequences',      gradient: 'from-emerald-600 to-teal-800',   tokens: ['"Hello"','[0]','len()','upper()','split()'] },
  'user-input':           { emoji: '⌨️', label: 'Programs talk to people',         gradient: 'from-cyan-600 to-blue-800',      tokens: ['input()','print()','name = ?','>>> '] },
  'variables-practice':   { emoji: '🧪', label: 'Practice makes perfect',          gradient: 'from-purple-600 to-pink-800',    tokens: ['x + y','z = x * 2','total','swap'] },
  'if-else-basics':       { emoji: '🔀', label: 'Code can make decisions',         gradient: 'from-amber-600 to-orange-800',   tokens: ['if','elif','else','True','False'] },
  'for-loops':            { emoji: '🔁', label: 'Repeat automatically with for',   gradient: 'from-red-600 to-rose-800',       tokens: ['for x in','range()','enumerate()','break','continue'] },
  'while-loops':          { emoji: '♾️', label: 'Loop while a condition holds',    gradient: 'from-orange-600 to-red-800',     tokens: ['while','True','count += 1','break','not done'] },
  'what-is-a-function':   { emoji: '🎯', label: 'Bundle logic into functions',     gradient: 'from-green-600 to-emerald-800',  tokens: ['def f():','return','params','DRY','call'] },
  'lists-basics':         { emoji: '📋', label: 'Lists hold ordered collections',  gradient: 'from-violet-600 to-blue-800',    tokens: ['[]','append()','[0]','len()','sort()'] },
  'dictionaries-basics':  { emoji: '📖', label: 'Dictionaries use key→value',      gradient: 'from-teal-600 to-cyan-800',      tokens: ['{}','key','value','get()','items()'] },
  'classes-and-objects':  { emoji: '🏗️', label: 'Classes are object blueprints',  gradient: 'from-blue-700 to-violet-800',    tokens: ['class','__init__','self','instance','.method()'] },
  'reading-writing-files':{ emoji: '📁', label: 'Save data to files on disk',      gradient: 'from-yellow-600 to-amber-800',   tokens: ['open()','write()','read()','with','.txt'] },
  'try-except-errors':    { emoji: '🛡️', label: 'Handle errors without crashing',  gradient: 'from-red-600 to-pink-800',       tokens: ['try:','except','ValueError','finally','raise'] },
  'what-is-an-api':       { emoji: '🌐', label: 'APIs let programs talk online',   gradient: 'from-sky-600 to-blue-800',       tokens: ['requests.get()','JSON','status 200','API key','headers'] },
  'number-guessing-game': { emoji: '🎮', label: 'Build a real Python game!',       gradient: 'from-fuchsia-600 to-purple-800', tokens: ['random','while','guess','int(input())','🎉 Win!'] },
}

// ── Optional Lottie animation paths (add real lottie.host URLs here) ──────────
// Leave empty — FloatingBanner shows when no valid animation is configured.
const LOTTIE_PATHS: Record<string, string> = {
  // Example: 'what-is-a-function': 'https://lottie.host/YOUR-UUID/filename.json',
}

// ── Animated token banner (CSS-only, always works) ────────────────────────────

function FloatingBanner({ slug }: { slug: string }) {
  const meta = META[slug]
  if (!meta) return null

  return (
    <>
      <style>{`
        @keyframes lh-float {
          0%,100% { transform: translateY(0px) rotate(-3deg); opacity: .85; }
          50%      { transform: translateY(-12px) rotate(3deg); opacity: 1; }
        }
      `}</style>
      <div
        className={`relative rounded-2xl bg-gradient-to-br ${meta.gradient} p-6 overflow-hidden mb-2`}
        style={{ minHeight: 130 }}
      >
        {/* Floating syntax tokens */}
        {meta.tokens.map((tok, i) => (
          <span
            key={i}
            className="absolute bg-white/15 text-white font-mono rounded-xl px-3 py-1.5 border border-white/20 shadow-sm select-none pointer-events-none"
            style={{
              fontSize: tok.length <= 3 ? 18 : 11,
              fontWeight: tok.length <= 3 ? 700 : 600,
              left: `${8 + (i * 23) % 68}%`,
              top: `${10 + (i * 37) % 62}%`,
              animation: `lh-float ${2.1 + i * 0.45}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
              animationDirection: i % 2 === 0 ? 'normal' : 'reverse',
            }}
          >
            {tok}
          </span>
        ))}

        {/* Content */}
        <div className="relative z-10 flex items-center gap-4">
          <span
            className="text-5xl drop-shadow-lg select-none"
            style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}
          >
            {meta.emoji}
          </span>
          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-0.5">
              🎬 Visual Overview
            </p>
            <p className="text-white font-bold text-lg leading-tight">{meta.label}</p>
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/8 pointer-events-none"/>
        <div className="absolute -left-6 -bottom-8 w-32 h-32 rounded-full bg-white/8 pointer-events-none"/>
      </div>
    </>
  )
}

// ── Lottie player wrapper ──────────────────────────────────────────────────────

function LottieBanner({ animationData, slug }: { animationData: unknown; slug: string }) {
  const lottieRef = useRef<LottieRefCurrentProps>(null)
  const meta = META[slug]

  return (
    <div className="rounded-2xl border border-purple-100 dark:border-purple-900/40 bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-900 dark:to-purple-950/20 p-4 mb-2">
      <p className="text-xs font-semibold text-purple-500 uppercase tracking-wider mb-2 text-center">
        🎬 Visual Overview — {meta?.label}
      </p>
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop
        autoplay
        style={{ height: 200, width: '100%' }}
        rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
      />
    </div>
  )
}

// ── Main export ──────────────────────────────────────────────────────────────

export default function LottieHero({ slug }: { slug: string }) {
  const lottieUrl = LOTTIE_PATHS[slug]

  if (lottieUrl) {
    return <LottieBanner animationData={lottieUrl} slug={slug} />
  }

  return <FloatingBanner slug={slug} />
}
