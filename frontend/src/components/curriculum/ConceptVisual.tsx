import { useEffect, useState } from 'react'

interface Props {
  slug: string
}

// ── individual animated visuals ──────────────────────────────────────────────

function VariableVisual() {
  const [val, setVal] = useState(42)
  useEffect(() => {
    const values = [42, 'hello', true, 3.14, 99]
    let i = 0
    const id = setInterval(() => { i = (i + 1) % values.length; setVal(values[i] as number) }, 1800)
    return () => clearInterval(id)
  }, [])
  return (
    <svg viewBox="0 0 480 180" className="w-full max-w-lg mx-auto">
      <defs>
        <filter id="shadow"><feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.15"/></filter>
      </defs>
      {/* RAM shelf */}
      <rect x="60" y="40" width="360" height="100" rx="12" fill="#EDE9FE" stroke="#7C3AED" strokeWidth="2"/>
      <text x="240" y="28" textAnchor="middle" fontSize="11" fill="#6D28D9" fontWeight="600">COMPUTER MEMORY</text>
      {/* Box */}
      <rect x="130" y="60" width="220" height="60" rx="10" fill="white" stroke="#7C3AED" strokeWidth="2.5" filter="url(#shadow)"/>
      {/* Label tag */}
      <rect x="155" y="50" width="60" height="22" rx="6" fill="#7C3AED"/>
      <text x="185" y="65" textAnchor="middle" fontSize="11" fill="white" fontWeight="700">score</text>
      {/* Value — animated */}
      <text x="240" y="97" textAnchor="middle" fontSize="22" fill="#7C3AED" fontWeight="800"
        style={{ transition: 'all 0.4s' }}>
        {String(val)}
      </text>
      {/* Arrow pointing to box */}
      <line x1="60" y1="165" x2="165" y2="125" stroke="#10B981" strokeWidth="2" strokeDasharray="4"/>
      <text x="40" y="170" fontSize="11" fill="#10B981" fontWeight="600">score = {String(val)}</text>
    </svg>
  )
}

function DataTypesVisual() {
  const types = [
    { name: 'int', example: '42', color: '#7C3AED', bg: '#EDE9FE' },
    { name: 'float', example: '3.14', color: '#2563EB', bg: '#DBEAFE' },
    { name: 'str', example: '"hi"', color: '#059669', bg: '#D1FAE5' },
    { name: 'bool', example: 'True', color: '#D97706', bg: '#FEF3C7' },
  ]
  const [active, setActive] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setActive(a => (a + 1) % types.length), 1600)
    return () => clearInterval(id)
  }, [])
  return (
    <svg viewBox="0 0 480 160" className="w-full max-w-lg mx-auto">
      {types.map((t, i) => {
        const x = 40 + i * 105
        const isActive = i === active
        return (
          <g key={t.name} style={{ transition: 'all 0.3s' }}>
            <rect x={x} y={isActive ? 30 : 40} width="90" height="90" rx="14"
              fill={t.bg} stroke={t.color} strokeWidth={isActive ? 3 : 1.5}
              style={{ filter: isActive ? `drop-shadow(0 4px 8px ${t.color}44)` : 'none', transition: 'all 0.3s' }}/>
            <text x={x + 45} y={isActive ? 70 : 80} textAnchor="middle" fontSize="14"
              fill={t.color} fontWeight="700" style={{ transition: 'all 0.3s' }}>{t.example}</text>
            <text x={x + 45} y={isActive ? 95 : 105} textAnchor="middle" fontSize="11"
              fill={t.color} fontWeight="600" style={{ transition: 'all 0.3s' }}>{t.name}</text>
          </g>
        )
      })}
      <text x="240" y="150" textAnchor="middle" fontSize="11" fill="#6B7280">Python picks the right type automatically!</text>
    </svg>
  )
}

function StringVisual() {
  const word = 'Python'
  const [revealed, setRevealed] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setRevealed(r => r < word.length ? r + 1 : 0), 400)
    return () => clearInterval(id)
  }, [])
  const colors = ['#7C3AED','#2563EB','#059669','#D97706','#DC2626','#7C3AED']
  return (
    <svg viewBox="0 0 480 170" className="w-full max-w-lg mx-auto">
      <text x="240" y="30" textAnchor="middle" fontSize="12" fill="#6B7280">Strings are sequences of characters</text>
      {/* Beads */}
      {[...word].map((ch, i) => {
        const x = 80 + i * 56
        const visible = i < revealed
        return (
          <g key={i} style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.3s' }}>
            <circle cx={x} cy="80" r="24" fill={colors[i]} opacity={0.9}/>
            <text x={x} y="86" textAnchor="middle" fontSize="18" fill="white" fontWeight="700">{ch}</text>
            {/* index label */}
            <text x={x} y="125" textAnchor="middle" fontSize="10" fill="#9CA3AF">[{i}]</text>
            {/* connecting line */}
            {i > 0 && <line x1={x - 56 + 24} y1="80" x2={x - 24} y2="80" stroke="#E5E7EB" strokeWidth="2"/>}
          </g>
        )
      })}
      <text x="240" y="155" textAnchor="middle" fontSize="12" fill="#7C3AED" fontWeight="600">word = "Python" → 6 characters, index 0–5</text>
    </svg>
  )
}

function UserInputVisual() {
  const prompts = ['What is your name? ', 'Enter your age: ', 'Pick a color: ']
  const answers = ['Alice', '17', 'purple']
  const [step, setStep] = useState(0)
  const [typed, setTyped] = useState('')
  useEffect(() => {
    setTyped('')
    const ans = answers[step % answers.length]
    let i = 0
    const typing = setInterval(() => {
      i++; setTyped(ans.slice(0, i))
      if (i >= ans.length) { clearInterval(typing); setTimeout(() => setStep(s => s + 1), 1000) }
    }, 120)
    return () => clearInterval(typing)
  }, [step])
  const idx = step % prompts.length
  return (
    <svg viewBox="0 0 480 160" className="w-full max-w-lg mx-auto">
      {/* Terminal window */}
      <rect x="60" y="20" width="360" height="120" rx="12" fill="#1E1E2E"/>
      <circle cx="85" cy="40" r="6" fill="#FF5F56"/>
      <circle cx="105" cy="40" r="6" fill="#FFBD2E"/>
      <circle cx="125" cy="40" r="6" fill="#27C93F"/>
      <text x="240" y="45" textAnchor="middle" fontSize="10" fill="#6B7280">terminal</text>
      {/* prompt text */}
      <text x="85" y="80" fontSize="13" fill="#A6E22E" fontFamily="monospace">{'>>> '}</text>
      <text x="120" y="80" fontSize="13" fill="#E6DB74" fontFamily="monospace">{prompts[idx]}</text>
      {/* typed answer */}
      <text x="120" y="105" fontSize="14" fill="#CFCFCF" fontFamily="monospace">{typed}<tspan fill="#AE81FF">|</tspan></text>
    </svg>
  )
}

function IfElseVisual() {
  const [answer, setAnswer] = useState<boolean | null>(null)
  useEffect(() => {
    const id = setInterval(() => setAnswer(a => a === null ? true : a === true ? false : null), 1500)
    return () => clearInterval(id)
  }, [])
  const trueColor = answer === true ? '#059669' : '#D1FAE5'
  const falseColor = answer === false ? '#DC2626' : '#FEE2E2'
  return (
    <svg viewBox="0 0 480 200" className="w-full max-w-lg mx-auto">
      {/* Question diamond */}
      <polygon points="240,20 330,80 240,140 150,80" fill="#FEF3C7" stroke="#D97706" strokeWidth="2.5"/>
      <text x="240" y="75" textAnchor="middle" fontSize="12" fill="#92400E" fontWeight="700">age &gt;= 18</text>
      <text x="240" y="93" textAnchor="middle" fontSize="10" fill="#B45309">?</text>
      {/* True branch */}
      <line x1="150" y1="80" x2="80" y2="80" stroke="#059669" strokeWidth="2"/>
      <line x1="80" y1="80" x2="80" y2="155" stroke="#059669" strokeWidth="2"/>
      <rect x="40" y="155" width="80" height="35" rx="8" fill={trueColor} stroke="#059669" strokeWidth="2"
        style={{ transition: 'fill 0.4s' }}/>
      <text x="80" y="178" textAnchor="middle" fontSize="11" fill="#065F46" fontWeight="700">"Adult"</text>
      <text x="80" y="140" textAnchor="middle" fontSize="10" fill="#059669">True</text>
      {/* False branch */}
      <line x1="330" y1="80" x2="400" y2="80" stroke="#DC2626" strokeWidth="2"/>
      <line x1="400" y1="80" x2="400" y2="155" stroke="#DC2626" strokeWidth="2"/>
      <rect x="360" y="155" width="80" height="35" rx="8" fill={falseColor} stroke="#DC2626" strokeWidth="2"
        style={{ transition: 'fill 0.4s' }}/>
      <text x="400" y="178" textAnchor="middle" fontSize="11" fill="#991B1B" fontWeight="700">"Minor"</text>
      <text x="400" y="140" textAnchor="middle" fontSize="10" fill="#DC2626">False</text>
      {/* Blinking indicator */}
      {answer !== null && (
        <circle cx={answer ? 80 : 400} cy="172" r="6" fill="white" opacity="0.5">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="0.8s" repeatCount="indefinite"/>
        </circle>
      )}
    </svg>
  )
}

function ForLoopVisual() {
  const [pos, setPos] = useState(0)
  const items = ['🍎', '🍌', '🍇', '🍊', '🍓']
  useEffect(() => {
    const id = setInterval(() => setPos(p => (p + 1) % items.length), 800)
    return () => clearInterval(id)
  }, [])
  return (
    <svg viewBox="0 0 480 180" className="w-full max-w-lg mx-auto">
      {/* Conveyor belt */}
      <rect x="50" y="110" width="380" height="16" rx="8" fill="#D1D5DB"/>
      {/* Belt lines */}
      {[0,1,2,3,4,5,6].map(i => <line key={i} x1={60 + i*52} y1="110" x2={70 + i*52} y2="126" stroke="#9CA3AF" strokeWidth="2"/>)}
      {/* Items on belt */}
      {items.map((fruit, i) => {
        const beltX = 90 + ((i - pos + items.length) % items.length) * 72
        const processing = beltX > 80 && beltX < 120
        return (
          <g key={i} style={{ transform: `translateX(${beltX}px)`, transition: 'transform 0.7s ease' }}>
            <text x={0} y={processing ? 80 : 100} textAnchor="middle" fontSize={processing ? 32 : 22}
              style={{ transition: 'all 0.3s' }}>{fruit}</text>
          </g>
        )
      })}
      {/* Processor */}
      <rect x="80" y="50" width="70" height="55" rx="10" fill="#7C3AED" opacity="0.9"/>
      <text x="115" y="72" textAnchor="middle" fontSize="9" fill="white" fontWeight="700">for fruit</text>
      <text x="115" y="88" textAnchor="middle" fontSize="9" fill="#C4B5FD">in fruits:</text>
      <text x="115" y="103" textAnchor="middle" fontSize="8" fill="white">print(fruit)</text>
      {/* Current item label */}
      <text x="240" y="160" textAnchor="middle" fontSize="12" fill="#6B7280">Processing each item one by one →</text>
    </svg>
  )
}

function WhileLoopVisual() {
  const [count, setCount] = useState(0)
  const max = 5
  useEffect(() => {
    const id = setInterval(() => setCount(c => c < max ? c + 1 : 0), 700)
    return () => clearInterval(id)
  }, [])
  const angle = (count / max) * 360
  const r = 60
  const cx = 240, cy = 90
  const rad = (deg: number) => (deg - 90) * Math.PI / 180
  const arc = (deg: number) => ({ x: cx + r * Math.cos(rad(deg)), y: cy + r * Math.sin(rad(deg)) })
  const end = arc(angle)
  const large = angle > 180 ? 1 : 0
  return (
    <svg viewBox="0 0 480 180" className="w-full max-w-lg mx-auto">
      {/* Track circle */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E5E7EB" strokeWidth="10"/>
      {/* Progress arc */}
      {count > 0 && (
        <path d={`M ${cx} ${cy - r} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`}
          fill="none" stroke="#7C3AED" strokeWidth="10" strokeLinecap="round"/>
      )}
      {/* Center text */}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="22" fill="#7C3AED" fontWeight="800">{count}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="#9CA3AF">of {max}</text>
      {/* Condition check */}
      <rect x="310" y="55" width="130" height="70" rx="10" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.5"/>
      <text x="375" y="76" textAnchor="middle" fontSize="11" fill="#92400E" fontWeight="700">while count &lt; 5</text>
      <text x="375" y="95" textAnchor="middle" fontSize="11" fill="#059669">{count < max ? '✓ keep going' : '✗ stop!'}</text>
      <text x="375" y="115" textAnchor="middle" fontSize="11" fill="#6B7280">count = {count}</text>
      {/* Arrow from circle back */}
      <path d="M 180 90 Q 155 130 180 150 Q 200 165 240 165 Q 280 165 300 150 Q 325 130 300 90"
        fill="none" stroke="#10B981" strokeWidth="2" strokeDasharray="6,3"/>
      <polygon points="302,84 296,94 308,94" fill="#10B981"/>
    </svg>
  )
}

function FunctionVisual() {
  const examples = [
    { input: '5', output: '25', name: 'square(n)' },
    { input: '"alice"', output: '"ALICE"', name: 'shout(text)' },
    { input: '[1,2,3]', output: '6', name: 'total(nums)' },
  ]
  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState<'in'|'proc'|'out'>('in')
  useEffect(() => {
    const seq: Array<'in'|'proc'|'out'> = ['in','proc','out']
    let p = 0
    const id = setInterval(() => {
      p++
      if (p < seq.length) { setPhase(seq[p]) }
      else { p = 0; setPhase('in'); setStep(s => (s + 1) % examples.length) }
    }, 900)
    return () => clearInterval(id)
  }, [])
  const ex = examples[step]
  return (
    <svg viewBox="0 0 480 160" className="w-full max-w-lg mx-auto">
      {/* Input */}
      <rect x="20" y="55" width="110" height="50" rx="10" fill="#DBEAFE" stroke="#2563EB" strokeWidth="2"
        style={{ opacity: phase === 'in' ? 1 : 0.4, transition: 'opacity 0.4s' }}/>
      <text x="75" y="76" textAnchor="middle" fontSize="10" fill="#1E40AF">INPUT</text>
      <text x="75" y="96" textAnchor="middle" fontSize="14" fill="#1E40AF" fontWeight="700">{ex.input}</text>
      {/* Arrow in */}
      <line x1="130" y1="80" x2="165" y2="80" stroke="#2563EB" strokeWidth="2.5"
        style={{ opacity: phase === 'proc' ? 1 : 0.2, transition: 'opacity 0.4s' }}/>
      <polygon points="162,74 172,80 162,86" fill="#2563EB"
        style={{ opacity: phase === 'proc' ? 1 : 0.2, transition: 'opacity 0.4s' }}/>
      {/* Function box */}
      <rect x="165" y="40" width="150" height="80" rx="14" fill="#7C3AED"
        style={{ filter: phase === 'proc' ? 'drop-shadow(0 0 12px #7C3AED88)' : 'none', transition: 'filter 0.4s' }}/>
      <text x="240" y="72" textAnchor="middle" fontSize="11" fill="#C4B5FD">def</text>
      <text x="240" y="92" textAnchor="middle" fontSize="13" fill="white" fontWeight="700">{ex.name}</text>
      <text x="240" y="108" textAnchor="middle" fontSize="9" fill="#A78BFA">📦 magic happens</text>
      {/* Arrow out */}
      <line x1="315" y1="80" x2="350" y2="80" stroke="#059669" strokeWidth="2.5"
        style={{ opacity: phase === 'out' ? 1 : 0.2, transition: 'opacity 0.4s' }}/>
      <polygon points="347,74 357,80 347,86" fill="#059669"
        style={{ opacity: phase === 'out' ? 1 : 0.2, transition: 'opacity 0.4s' }}/>
      {/* Output */}
      <rect x="350" y="55" width="110" height="50" rx="10" fill="#D1FAE5" stroke="#059669" strokeWidth="2"
        style={{ opacity: phase === 'out' ? 1 : 0.4, transition: 'opacity 0.4s' }}/>
      <text x="405" y="76" textAnchor="middle" fontSize="10" fill="#065F46">OUTPUT</text>
      <text x="405" y="96" textAnchor="middle" fontSize="14" fill="#065F46" fontWeight="700">{ex.output}</text>
      <text x="240" y="148" textAnchor="middle" fontSize="11" fill="#6B7280">Functions take input → do work → return output</text>
    </svg>
  )
}

function ListVisual() {
  const items = ['🍕', '🎮', '🎵', '📚']
  const [count, setCount] = useState(1)
  useEffect(() => {
    const id = setInterval(() => setCount(c => c < items.length ? c + 1 : 1), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <svg viewBox="0 0 480 160" className="w-full max-w-lg mx-auto">
      <text x="240" y="22" textAnchor="middle" fontSize="12" fill="#6B7280">my_list = [item0, item1, item2, …]</text>
      {/* List container */}
      <rect x="60" y="35" width={count * 90} height="80" rx="12" fill="#EDE9FE" stroke="#7C3AED" strokeWidth="2"
        style={{ transition: 'width 0.5s ease' }}/>
      {items.slice(0, count).map((item, i) => (
        <g key={i} style={{ opacity: i < count ? 1 : 0, transition: 'opacity 0.4s' }}>
          <rect x={68 + i * 86} y="43" width="74" height="64" rx="8" fill="white" stroke="#A78BFA" strokeWidth="1.5"/>
          <text x={105 + i * 86} y="82" textAnchor="middle" fontSize="26">{item}</text>
          <text x={105 + i * 86} y="102" textAnchor="middle" fontSize="10" fill="#7C3AED">[{i}]</text>
        </g>
      ))}
      <text x="240" y="145" textAnchor="middle" fontSize="11" fill="#7C3AED" fontWeight="600">
        len(my_list) = {count}
      </text>
    </svg>
  )
}

function DictVisual() {
  const pairs = [
    { key: 'name', val: '"Alice"', color: '#7C3AED', bg: '#EDE9FE' },
    { key: 'age', val: '17', color: '#2563EB', bg: '#DBEAFE' },
    { key: 'score', val: '100', color: '#059669', bg: '#D1FAE5' },
  ]
  const [active, setActive] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setActive(a => (a + 1) % pairs.length), 1400)
    return () => clearInterval(id)
  }, [])
  return (
    <svg viewBox="0 0 480 180" className="w-full max-w-lg mx-auto">
      <text x="240" y="22" textAnchor="middle" fontSize="12" fill="#6B7280">Dictionary = labeled storage drawers</text>
      {pairs.map((p, i) => {
        const y = 35 + i * 48
        const isActive = i === active
        return (
          <g key={i}>
            {/* Drawer */}
            <rect x="80" y={y} width="320" height="38" rx="8" fill={isActive ? p.bg : '#F9FAFB'}
              stroke={isActive ? p.color : '#E5E7EB'} strokeWidth={isActive ? 2.5 : 1.5}
              style={{ transition: 'all 0.4s' }}/>
            {/* Key label */}
            <rect x="88" y={y + 8} width="80" height="22" rx="6" fill={p.color} opacity={isActive ? 1 : 0.5}
              style={{ transition: 'opacity 0.4s' }}/>
            <text x="128" y={y + 24} textAnchor="middle" fontSize="11" fill="white" fontWeight="700">{p.key}</text>
            {/* Arrow */}
            <text x="185" y={y + 24} textAnchor="middle" fontSize="14" fill="#9CA3AF">→</text>
            {/* Value */}
            <text x="310" y={y + 24} textAnchor="middle" fontSize="14" fill={p.color} fontWeight="700"
              style={{ transition: 'color 0.4s' }}>{p.val}</text>
          </g>
        )
      })}
      <text x="240" y="175" textAnchor="middle" fontSize="11" fill="#6B7280">Access: person["name"] → "Alice"</text>
    </svg>
  )
}

function ClassVisual() {
  const [phase, setPhase] = useState<'blueprint'|'obj1'|'obj2'>('blueprint')
  useEffect(() => {
    const seq: Array<'blueprint'|'obj1'|'obj2'> = ['blueprint', 'obj1', 'obj2']
    let i = 0
    const id = setInterval(() => { i = (i + 1) % seq.length; setPhase(seq[i]) }, 1400)
    return () => clearInterval(id)
  }, [])
  return (
    <svg viewBox="0 0 480 190" className="w-full max-w-lg mx-auto">
      {/* Blueprint */}
      <rect x="20" y="30" width="140" height="120" rx="12" fill="#DBEAFE" stroke="#2563EB" strokeWidth="2.5"
        style={{ opacity: 1 }}/>
      <text x="90" y="52" textAnchor="middle" fontSize="11" fill="#1E40AF" fontWeight="700">class Dog:</text>
      <text x="90" y="70" textAnchor="middle" fontSize="10" fill="#3B82F6">  name</text>
      <text x="90" y="86" textAnchor="middle" fontSize="10" fill="#3B82F6">  breed</text>
      <text x="90" y="102" textAnchor="middle" fontSize="10" fill="#3B82F6">  bark()</text>
      <text x="90" y="118" textAnchor="middle" fontSize="10" fill="#3B82F6">  fetch()</text>
      <text x="90" y="142" textAnchor="middle" fontSize="9" fill="#6B7280">BLUEPRINT</text>
      {/* Arrow */}
      <line x1="160" y1="90" x2="200" y2="70" stroke="#7C3AED" strokeWidth="2" strokeDasharray="5"/>
      <line x1="160" y1="90" x2="200" y2="140" stroke="#7C3AED" strokeWidth="2" strokeDasharray="5"/>
      {/* Objects */}
      {['obj1','obj2'].map((key, i) => {
        const y = 30 + i * 85
        const names = ['Buddy', 'Max']
        const breeds = ['Labrador', 'Poodle']
        const isActive = phase === key
        return (
          <rect key={key} x="200" y={y} width="120" height="70" rx="10"
            fill={isActive ? '#EDE9FE' : '#F9FAFB'} stroke={isActive ? '#7C3AED' : '#E5E7EB'}
            strokeWidth={isActive ? 2.5 : 1.5} style={{ transition: 'all 0.4s' }}>
            <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="0s"/>
          </rect>
        )
      })}
      {[0, 1].map(i => {
        const y = 30 + i * 85
        const names = ['Buddy', 'Max']
        const breeds = ['Labrador', 'Poodle']
        const isActive = phase === `obj${i+1}`
        return (
          <g key={i}>
            <text x="260" y={y + 22} textAnchor="middle" fontSize="10" fill="#7C3AED" fontWeight="700">🐕 {names[i]}</text>
            <text x="260" y={y + 40} textAnchor="middle" fontSize="10" fill="#6B7280">{breeds[i]}</text>
            <text x="260" y={y + 58} textAnchor="middle" fontSize="10" fill="#10B981">OBJECT</text>
          </g>
        )
      })}
      <text x="350" y="90" textAnchor="middle" fontSize="20">🐕</text>
      <text x="350" y="90" fontSize="30" textAnchor="middle" style={{ opacity: phase === 'obj1' ? 1 : 0, transition: 'opacity 0.4s' }}>🦴</text>
      <text x="350" y="150" textAnchor="middle" fontSize="20">🐕</text>
      <text x="240" y="180" textAnchor="middle" fontSize="11" fill="#6B7280">One class → many different objects!</text>
    </svg>
  )
}

function FileIOVisual() {
  const [phase, setPhase] = useState<'write'|'saved'|'read'>('write')
  useEffect(() => {
    const seq: Array<'write'|'saved'|'read'> = ['write','saved','read']
    let i = 0
    const id = setInterval(() => { i = (i + 1) % seq.length; setPhase(seq[i]) }, 1500)
    return () => clearInterval(id)
  }, [])
  return (
    <svg viewBox="0 0 480 160" className="w-full max-w-lg mx-auto">
      {/* Python code */}
      <rect x="20" y="30" width="140" height="100" rx="10" fill="#1E1E2E"/>
      <text x="30" y="54" fontSize="10" fill="#A6E22E" fontFamily="monospace">open("notes.txt"</text>
      <text x="30" y="72" fontSize="10" fill="#66D9E8" fontFamily="monospace">  , "w") as f:</text>
      <text x="30" y="90" fontSize="10" fill="#E6DB74" fontFamily="monospace">  f.write("Hello")</text>
      {/* Arrow write */}
      <line x1="160" y1="80" x2="210" y2="80" stroke={phase === 'write' ? '#059669' : '#E5E7EB'} strokeWidth="2.5"
        style={{ transition: 'stroke 0.4s' }}/>
      <polygon points="207,74 217,80 207,86" fill={phase === 'write' ? '#059669' : '#E5E7EB'}
        style={{ transition: 'fill 0.4s' }}/>
      <text x="185" y="70" textAnchor="middle" fontSize="9" fill={phase === 'write' ? '#059669' : '#9CA3AF'}>write</text>
      {/* File */}
      <rect x="210" y="45" width="80" height="70" rx="8" fill={phase === 'saved' ? '#D1FAE5' : '#F3F4F6'}
        stroke={phase !== 'write' ? '#059669' : '#D1D5DB'} strokeWidth="2"
        style={{ transition: 'all 0.4s' }}/>
      <rect x="210" y="45" width="20" height="20" rx="2" fill={phase !== 'write' ? '#059669' : '#D1D5DB'}
        style={{ transition: 'fill 0.4s' }}/>
      <text x="250" y="90" textAnchor="middle" fontSize="10" fill="#374151" fontWeight="600">notes.txt</text>
      <text x="250" y="106" textAnchor="middle" fontSize="9" fill="#6B7280">"Hello"</text>
      {/* Arrow read */}
      <line x1="290" y1="80" x2="340" y2="80" stroke={phase === 'read' ? '#7C3AED' : '#E5E7EB'} strokeWidth="2.5"
        style={{ transition: 'stroke 0.4s' }}/>
      <polygon points="337,74 347,80 337,86" fill={phase === 'read' ? '#7C3AED' : '#E5E7EB'}
        style={{ transition: 'fill 0.4s' }}/>
      <text x="315" y="70" textAnchor="middle" fontSize="9" fill={phase === 'read' ? '#7C3AED' : '#9CA3AF'}>read</text>
      {/* Output */}
      <rect x="340" y="55" width="110" height="50" rx="10" fill={phase === 'read' ? '#EDE9FE' : '#F9FAFB'}
        stroke={phase === 'read' ? '#7C3AED' : '#E5E7EB'} strokeWidth="2"
        style={{ transition: 'all 0.4s' }}/>
      <text x="395" y="76" textAnchor="middle" fontSize="9" fill="#7C3AED">data =</text>
      <text x="395" y="95" textAnchor="middle" fontSize="12" fill="#7C3AED" fontWeight="700">"Hello"</text>
      <text x="240" y="145" textAnchor="middle" fontSize="11" fill="#6B7280">Files persist data even when the program stops</text>
    </svg>
  )
}

function TryExceptVisual() {
  const [phase, setPhase] = useState<'normal'|'error'|'caught'>('normal')
  useEffect(() => {
    const seq: Array<'normal'|'error'|'caught'> = ['normal','error','caught']
    let i = 0
    const id = setInterval(() => { i = (i + 1) % seq.length; setPhase(seq[i]) }, 1500)
    return () => clearInterval(id)
  }, [])
  return (
    <svg viewBox="0 0 480 180" className="w-full max-w-lg mx-auto">
      {/* Code falling */}
      <text x="240" y="30" textAnchor="middle" fontSize="28"
        style={{ transform: `translateY(${phase === 'error' ? '20px' : '0'}px)`, transition: 'transform 0.4s' }}>
        {phase === 'error' ? '💥' : '⚙️'}
      </text>
      <text x="240" y="50" textAnchor="middle" fontSize="11" fill="#6B7280">
        {phase === 'normal' ? 'try: int("hello")' : phase === 'error' ? 'ValueError!' : 'except ValueError: caught!'}
      </text>
      {/* Net */}
      <path d="M 80 120 Q 240 160 400 120" fill="none" stroke={phase === 'caught' ? '#059669' : '#D1D5DB'}
        strokeWidth="4" strokeLinecap="round" style={{ transition: 'stroke 0.4s' }}/>
      <path d="M 80 120 Q 100 145 120 120 Q 140 145 160 120 Q 180 145 200 120 Q 220 145 240 120 Q 260 145 280 120 Q 300 145 320 120 Q 340 145 360 120 Q 380 145 400 120"
        fill="none" stroke={phase === 'caught' ? '#059669' : '#D1D5DB'} strokeWidth="2"
        style={{ transition: 'stroke 0.4s' }}/>
      {/* Net poles */}
      <line x1="80" y1="90" x2="80" y2="125" stroke="#9CA3AF" strokeWidth="3"/>
      <line x1="400" y1="90" x2="400" y2="125" stroke="#9CA3AF" strokeWidth="3"/>
      <text x="80" y="82" textAnchor="middle" fontSize="9" fill="#9CA3AF">except</text>
      <text x="400" y="82" textAnchor="middle" fontSize="9" fill="#9CA3AF">except</text>
      {/* Status */}
      <rect x="150" y="148" width="180" height="28" rx="8" fill={phase === 'caught' ? '#D1FAE5' : '#FEE2E2'}
        style={{ transition: 'fill 0.4s' }}/>
      <text x="240" y="168" textAnchor="middle" fontSize="12" fill={phase === 'caught' ? '#059669' : '#DC2626'}
        fontWeight="700" style={{ transition: 'color 0.4s' }}>
        {phase === 'caught' ? '✓ Error caught safely!' : phase === 'error' ? '⚠️ Error flying...' : '✓ Running normally'}
      </text>
    </svg>
  )
}

function APIVisual() {
  const [phase, setPhase] = useState<'req'|'server'|'res'>('req')
  useEffect(() => {
    const seq: Array<'req'|'server'|'res'> = ['req','server','res']
    let i = 0
    const id = setInterval(() => { i = (i + 1) % seq.length; setPhase(seq[i]) }, 1200)
    return () => clearInterval(id)
  }, [])
  const packetX = phase === 'req' ? 130 : phase === 'server' ? 240 : 350
  return (
    <svg viewBox="0 0 480 170" className="w-full max-w-lg mx-auto">
      {/* Client */}
      <rect x="20" y="50" width="100" height="80" rx="12" fill="#DBEAFE" stroke="#2563EB" strokeWidth="2"/>
      <text x="70" y="84" textAnchor="middle" fontSize="20">💻</text>
      <text x="70" y="105" textAnchor="middle" fontSize="10" fill="#1E40AF" fontWeight="600">Your App</text>
      <text x="70" y="120" textAnchor="middle" fontSize="9" fill="#6B7280">requests.get()</text>
      {/* Server */}
      <rect x="360" y="50" width="100" height="80" rx="12" fill="#D1FAE5" stroke="#059669" strokeWidth="2"/>
      <text x="410" y="84" textAnchor="middle" fontSize="20">🌐</text>
      <text x="410" y="105" textAnchor="middle" fontSize="10" fill="#065F46" fontWeight="600">API Server</text>
      <text x="410" y="120" textAnchor="middle" fontSize="9" fill="#6B7280">returns JSON</text>
      {/* Road */}
      <line x1="120" y1="90" x2="360" y2="90" stroke="#E5E7EB" strokeWidth="3" strokeDasharray="8,4"/>
      {/* Packet */}
      <rect x={packetX - 22} y="74" width="44" height="32" rx="8"
        fill={phase === 'res' ? '#D1FAE5' : '#EDE9FE'} stroke={phase === 'res' ? '#059669' : '#7C3AED'}
        strokeWidth="2" style={{ transition: 'all 0.5s ease' }}/>
      <text x={packetX} y="95" textAnchor="middle" fontSize="10" fontWeight="700"
        fill={phase === 'res' ? '#059669' : '#7C3AED'} style={{ transition: 'all 0.5s' }}>
        {phase === 'req' ? '📤 GET' : phase === 'server' ? '⚙️' : '📥 JSON'}
      </text>
      {/* Labels */}
      <text x="240" y="140" textAnchor="middle" fontSize="11" fill="#6B7280">
        {phase === 'req' ? 'Sending request...' : phase === 'server' ? 'Server processing...' : 'Data received! ✓'}
      </text>
      <text x="240" y="158" textAnchor="middle" fontSize="10" fill="#7C3AED">
        {phase === 'res' ? '{"weather": "sunny", "temp": 22}' : ''}
      </text>
    </svg>
  )
}

function MiniProjectVisual() {
  const [guess, setGuess] = useState(50)
  const secret = 73
  const [arrow, setArrow] = useState<'up'|'down'|'correct'>('up')
  useEffect(() => {
    const guesses = [50, 75, 62, 69, 73]
    let i = 0
    const id = setInterval(() => {
      i = (i + 1) % guesses.length
      const g = guesses[i]
      setGuess(g)
      setArrow(g < secret ? 'up' : g > secret ? 'down' : 'correct')
    }, 1000)
    return () => clearInterval(id)
  }, [])
  const barW = (guess / 100) * 300
  return (
    <svg viewBox="0 0 480 180" className="w-full max-w-lg mx-auto">
      <text x="240" y="28" textAnchor="middle" fontSize="14" fill="#7C3AED" fontWeight="700">🎮 Number Guessing Game</text>
      {/* Range bar */}
      <rect x="90" y="55" width="300" height="16" rx="8" fill="#E5E7EB"/>
      <rect x="90" y="55" width={barW} height="16" rx="8" fill="#7C3AED" style={{ transition: 'width 0.6s ease' }}/>
      <text x="90" y="88" fontSize="11" fill="#9CA3AF">1</text>
      <text x="385" y="88" fontSize="11" fill="#9CA3AF">100</text>
      {/* Secret marker */}
      <line x1={90 + secret * 3} y1="48" x2={90 + secret * 3} y2="78" stroke="#DC2626" strokeWidth="2" strokeDasharray="4"/>
      <text x={90 + secret * 3} y="44" textAnchor="middle" fontSize="9" fill="#DC2626">secret</text>
      {/* Guess marker */}
      <circle cx={90 + guess * 3} cy="63" r="9" fill="white" stroke="#7C3AED" strokeWidth="2.5"
        style={{ transition: 'cx 0.6s ease' }}/>
      {/* Feedback */}
      <rect x="160" y="100" width="160" height="45" rx="10" fill={arrow === 'correct' ? '#D1FAE5' : '#FEF3C7'}
        stroke={arrow === 'correct' ? '#059669' : '#D97706'} strokeWidth="2"
        style={{ transition: 'all 0.4s' }}/>
      <text x="240" y="120" textAnchor="middle" fontSize="13" fontWeight="700"
        fill={arrow === 'correct' ? '#059669' : '#92400E'} style={{ transition: 'color 0.4s' }}>
        {arrow === 'up' ? `⬆️  Go higher! (${guess})` : arrow === 'down' ? `⬇️  Go lower! (${guess})` : `🎉 Correct! It's ${secret}!`}
      </text>
      <text x="240" y="138" textAnchor="middle" fontSize="10" fill="#6B7280">Guess: {guess} | Secret: {arrow === 'correct' ? secret : '???'}</text>
    </svg>
  )
}

function VariablesPracticeVisual() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 600)
    return () => clearInterval(id)
  }, [])
  const vars = [
    { name: 'x', val: 5 + (tick % 3), color: '#7C3AED' },
    { name: 'y', val: 10 - (tick % 4), color: '#2563EB' },
    { name: 'z', val: ((5 + (tick % 3)) + (10 - (tick % 4))), color: '#059669' },
  ]
  return (
    <svg viewBox="0 0 480 160" className="w-full max-w-lg mx-auto">
      <text x="240" y="22" textAnchor="middle" fontSize="12" fill="#6B7280">Variables change — that's the whole point!</text>
      {vars.map((v, i) => (
        <g key={v.name}>
          <rect x={60 + i * 135} y="35" width="110" height="80" rx="14" fill="white" stroke={v.color} strokeWidth="2.5"
            style={{ filter: `drop-shadow(0 3px 6px ${v.color}33)` }}/>
          <text x={115 + i * 135} y="62" textAnchor="middle" fontSize="11" fill={v.color} fontWeight="600">{v.name} =</text>
          <text x={115 + i * 135} y="92" textAnchor="middle" fontSize="28" fill={v.color} fontWeight="800">{v.val}</text>
        </g>
      ))}
      <text x="240" y="148" textAnchor="middle" fontSize="11" fill="#059669" fontWeight="600">z = x + y = {vars[2].val}</text>
    </svg>
  )
}

// ── SQL & Data visuals ───────────────────────────────────────────────────────

// ── SQL & Data Visuals ────────────────────────────────────────────────────────

function SqlDBThinkVisual() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setStep(s => (s + 1) % 4), 1600)
    return () => clearInterval(id)
  }, [])
  const highlight = (idx: number) => idx === step ? '#7C3AED' : '#9CA3AF'
  const fillH = (idx: number) => idx === step ? '#EDE9FE' : '#F9FAFB'
  return (
    <svg viewBox="0 0 480 180" className="w-full max-w-lg mx-auto">
      {/* Departments table */}
      <rect x="20" y="30" width="140" height="120" rx="8" fill={fillH(0)} stroke={highlight(0)} strokeWidth="2"/>
      <rect x="20" y="30" width="140" height="28" rx="8" fill={highlight(0)}/>
      <text x="90" y="50" textAnchor="middle" fontSize="11" fill="white" fontWeight="700">departments</text>
      {['10 | Engineering','20 | Sales','30 | HR'].map((r,i)=>(
        <text key={i} x="90" y={72+i*20} textAnchor="middle" fontSize="10" fill="#374151">{r}</text>
      ))}
      {/* Employees table */}
      <rect x="170" y="30" width="150" height="120" rx="8" fill={fillH(1)} stroke={highlight(1)} strokeWidth="2"/>
      <rect x="170" y="30" width="150" height="28" rx="8" fill={highlight(1)}/>
      <text x="245" y="50" textAnchor="middle" fontSize="11" fill="white" fontWeight="700">employees</text>
      {['1 | Alice | dept 10','2 | Bob   | dept 20','3 | Carol | dept 10'].map((r,i)=>(
        <text key={i} x="245" y={72+i*20} textAnchor="middle" fontSize="10" fill="#374151">{r}</text>
      ))}
      {/* FK arrow */}
      <line x1="160" y1="92" x2="170" y2="92" stroke={highlight(2)} strokeWidth="2.5" markerEnd="url(#arr)"/>
      <defs><marker id="arr" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill={highlight(2)}/></marker></defs>
      {/* Roles table */}
      <rect x="330" y="30" width="130" height="120" rx="8" fill={fillH(3)} stroke={highlight(3)} strokeWidth="2"/>
      <rect x="330" y="30" width="130" height="28" rx="8" fill={highlight(3)}/>
      <text x="395" y="50" textAnchor="middle" fontSize="11" fill="white" fontWeight="700">roles</text>
      {['1 | Engineer','2 | Manager','3 | Analyst'].map((r,i)=>(
        <text key={i} x="395" y={72+i*20} textAnchor="middle" fontSize="10" fill="#374151">{r}</text>
      ))}
      <line x1="320" y1="92" x2="330" y2="92" stroke={highlight(2)} strokeWidth="2.5" markerEnd="url(#arr)"/>
      {/* Label */}
      <text x="240" y="168" textAnchor="middle" fontSize="11" fill="#6B7280">
        {['Tables store data','FK links employees→dept','FK links employees→roles','Keys = relational power'][step]}
      </text>
    </svg>
  )
}

function SqlSelectVisual() {
  const cols = ['employee_id','first_name','last_name','department','salary','hire_date']
  const [selected, setSelected] = useState([1,3,4])
  useEffect(() => {
    const combos = [[1,3,4],[0,1,2],[1,4],[0,1,2,3,4,5]]
    let i = 0
    const id = setInterval(() => { i=(i+1)%combos.length; setSelected(combos[i]) }, 1800)
    return () => clearInterval(id)
  }, [])
  return (
    <svg viewBox="0 0 480 180" className="w-full max-w-lg mx-auto">
      <text x="240" y="22" textAnchor="middle" fontSize="11" fill="#6B7280">SELECT picks only the columns you need</text>
      {cols.map((c,i) => {
        const x = 16 + i*77
        const sel = selected.includes(i)
        return (
          <g key={c}>
            <rect x={x} y="35" width="70" height="100" rx="8"
              fill={sel ? '#EDE9FE' : '#F3F4F6'} stroke={sel ? '#7C3AED' : '#D1D5DB'}
              strokeWidth={sel ? 2.5 : 1.5}
              style={{ filter: sel ? 'drop-shadow(0 2px 6px #7C3AED44)' : 'none', transition: 'all 0.4s' }}/>
            <text x={x+35} y="55" textAnchor="middle" fontSize="9" fill={sel?'#7C3AED':'#9CA3AF'} fontWeight={sel?700:400}
              style={{ transition: 'all 0.4s' }}>{c.replace('_','\n')}</text>
            {sel && <text x={x+35} y="95" textAnchor="middle" fontSize="18" fill="#7C3AED">✓</text>}
            <text x={x+35} y="122" textAnchor="middle" fontSize="9" fill="#9CA3AF">col {i+1}</text>
          </g>
        )
      })}
      <text x="240" y="165" textAnchor="middle" fontSize="11" fill="#7C3AED" fontWeight="600">
        SELECT {selected.map(i=>cols[i]).join(', ')}
      </text>
    </svg>
  )
}

function SqlWhereVisual() {
  const rows = [
    { name:'Alice', dept:'Eng', salary:85000 },
    { name:'Bob',   dept:'Sales', salary:62000 },
    { name:'Carol', dept:'Eng', salary:90000 },
    { name:'Dave',  dept:'HR',  salary:55000 },
    { name:'Eve',   dept:'Eng', salary:78000 },
  ]
  const [threshold, setThreshold] = useState(70000)
  useEffect(() => {
    const vals = [70000, 80000, 60000, 90000, 55000]
    let i = 0
    const id = setInterval(() => { i=(i+1)%vals.length; setThreshold(vals[i]) }, 1800)
    return () => clearInterval(id)
  }, [])
  return (
    <svg viewBox="0 0 480 180" className="w-full max-w-lg mx-auto">
      <text x="240" y="18" textAnchor="middle" fontSize="11" fill="#6B7280">
        {`WHERE salary > ${threshold.toLocaleString()}`}
      </text>
      {rows.map((r,i) => {
        const pass = r.salary > threshold
        const y = 30 + i * 28
        return (
          <g key={r.name} style={{ opacity: pass ? 1 : 0.35, transition: 'all 0.4s' }}>
            <rect x="40" y={y} width="400" height="24" rx="6"
              fill={pass ? '#D1FAE5' : '#F3F4F6'} stroke={pass ? '#10B981' : '#E5E7EB'} strokeWidth="1.5"/>
            <text x="100" y={y+16} textAnchor="middle" fontSize="11" fill={pass?'#065F46':'#9CA3AF'} fontWeight={pass?600:400}>{r.name}</text>
            <text x="220" y={y+16} textAnchor="middle" fontSize="11" fill={pass?'#065F46':'#9CA3AF'}>{r.dept}</text>
            <text x="340" y={y+16} textAnchor="middle" fontSize="11" fill={pass?'#065F46':'#9CA3AF'} fontWeight="600">
              ${r.salary.toLocaleString()}
            </text>
            <text x="435" y={y+16} textAnchor="middle" fontSize="14">{pass ? '✅' : '❌'}</text>
          </g>
        )
      })}
    </svg>
  )
}

function SqlSortingVisual() {
  const items = [
    { name:'Carol', salary:90000 },
    { name:'Alice', salary:85000 },
    { name:'Eve',   salary:78000 },
    { name:'Bob',   salary:62000 },
    { name:'Dave',  salary:55000 },
  ]
  const [mode, setMode] = useState<'unsorted'|'asc'|'desc'|'limit3'>('unsorted')
  useEffect(() => {
    const modes: Array<'unsorted'|'asc'|'desc'|'limit3'> = ['unsorted','desc','asc','limit3']
    let i=0
    const id = setInterval(() => { i=(i+1)%modes.length; setMode(modes[i]) }, 1800)
    return () => clearInterval(id)
  }, [])
  const shuffled = [...items].sort(() => 0.17)
  const asc  = [...items].sort((a,b)=>a.salary-b.salary)
  const desc = [...items].sort((a,b)=>b.salary-a.salary)
  const display = mode==='unsorted' ? shuffled : mode==='asc' ? asc : mode==='desc' ? desc : desc.slice(0,3)
  const labels: Record<string, string> = {
    unsorted: 'No ORDER BY — random order',
    asc: 'ORDER BY salary ASC',
    desc: 'ORDER BY salary DESC',
    limit3: 'ORDER BY salary DESC LIMIT 3',
  }
  return (
    <svg viewBox="0 0 480 180" className="w-full max-w-lg mx-auto">
      <text x="240" y="18" textAnchor="middle" fontSize="11" fill="#7C3AED" fontWeight="600">{labels[mode]}</text>
      {display.map((r,i) => (
        <g key={r.name+mode} style={{ transition: 'all 0.5s' }}>
          <rect x="80" y={28+i*28} width="320" height="24" rx="7"
            fill={mode==='limit3' ? '#EDE9FE' : '#F9FAFB'} stroke={mode==='limit3'?'#7C3AED':'#E5E7EB'} strokeWidth="1.5"/>
          <text x="200" y={44+i*28} textAnchor="middle" fontSize="12" fill="#374151" fontWeight="500">{r.name}</text>
          <text x="340" y={44+i*28} textAnchor="middle" fontSize="12" fill="#7C3AED" fontWeight="700">${r.salary.toLocaleString()}</text>
        </g>
      ))}
    </svg>
  )
}

function SqlAggregatesVisual() {
  const rows = [85000, 62000, 90000, 55000, 78000]
  const [phase, setPhase] = useState<'rows'|'count'|'sum'|'avg'>('rows')
  useEffect(() => {
    const phases: Array<'rows'|'count'|'sum'|'avg'> = ['rows','count','sum','avg']
    let i=0
    const id = setInterval(() => { i=(i+1)%phases.length; setPhase(phases[i]) }, 2000)
    return () => clearInterval(id)
  }, [])
  const total = rows.reduce((a,b)=>a+b,0)
  const avg = Math.round(total/rows.length)
  return (
    <svg viewBox="0 0 480 180" className="w-full max-w-lg mx-auto">
      {phase==='rows' && rows.map((v,i)=>(
        <g key={i}>
          <rect x={36+i*84} y="40" width="72" height="90" rx="8" fill="#EDE9FE" stroke="#7C3AED" strokeWidth="1.5"/>
          <text x={72+i*84} y="92" textAnchor="middle" fontSize="13" fill="#7C3AED" fontWeight="700">${(v/1000).toFixed(0)}k</text>
        </g>
      ))}
      {phase!=='rows' && (
        <g>
          <rect x="160" y="30" width="160" height="100" rx="14" fill="#D1FAE5" stroke="#10B981" strokeWidth="3"
            style={{ filter: 'drop-shadow(0 4px 12px #10B98144)' }}/>
          <text x="240" y="70" textAnchor="middle" fontSize="13" fill="#065F46" fontWeight="700">
            {phase==='count' ? 'COUNT(*)' : phase==='sum' ? 'SUM(salary)' : 'AVG(salary)'}
          </text>
          <text x="240" y="105" textAnchor="middle" fontSize="26" fill="#065F46" fontWeight="800">
            {phase==='count' ? '5' : phase==='sum' ? `$${(total/1000).toFixed(0)}k` : `$${(avg/1000).toFixed(0)}k`}
          </text>
        </g>
      )}
      <text x="240" y="168" textAnchor="middle" fontSize="11" fill="#6B7280">
        {phase==='rows' ? '5 individual rows' : `${phase.toUpperCase()}() collapses rows into one answer`}
      </text>
    </svg>
  )
}

function SqlJoinsDeepVisual() {
  const [joinType, setJoinType] = useState<'inner'|'left'|'full'>('inner')
  useEffect(() => {
    const types: Array<'inner'|'left'|'full'> = ['inner','left','full']
    let i=0
    const id = setInterval(() => { i=(i+1)%types.length; setJoinType(types[i]) }, 2000)
    return () => clearInterval(id)
  }, [])
  const leftRows  = ['Alice (dept 10)','Bob (dept 20)','Carol (no dept)']
  const rightRows = ['10: Engineering','20: Sales']
  const matched   = ['Alice → Engineering','Bob → Sales']
  const leftOnly  = ['Carol → NULL']
  const display = joinType==='inner' ? matched
                : joinType==='left'  ? [...matched, ...leftOnly]
                : [...matched, ...leftOnly, 'NULL ← Finance']
  const colors: Record<string, string> = { inner:'#10B981', left:'#3B82F6', full:'#8B5CF6' }
  return (
    <svg viewBox="0 0 480 190" className="w-full max-w-lg mx-auto">
      <text x="240" y="18" textAnchor="middle" fontSize="12" fill={colors[joinType]} fontWeight="700">
        {joinType.toUpperCase()} JOIN
      </text>
      {/* Left table */}
      {leftRows.map((r,i)=>(
        <rect key={i} x="10" y={32+i*28} width="140" height="24" rx="6"
          fill={joinType!=='inner'||i<2?'#EDE9FE':'#F3F4F6'} stroke="#7C3AED" strokeWidth="1"/>
      ))}
      {leftRows.map((r,i)=>(
        <text key={i} x="80" y={48+i*28} textAnchor="middle" fontSize="9.5" fill="#374151">{r}</text>
      ))}
      {/* Right table */}
      {rightRows.map((r,i)=>(
        <rect key={i} x="330" y={46+i*28} width="140" height="24" rx="6" fill="#D1FAE5" stroke="#10B981" strokeWidth="1"/>
      ))}
      {rightRows.map((r,i)=>(
        <text key={i} x="400" y={62+i*28} textAnchor="middle" fontSize="9.5" fill="#374151">{r}</text>
      ))}
      {/* Result */}
      {display.map((r,i)=>(
        <g key={i}>
          <rect x="155" y={118+i*26} width="170" height="22" rx="6"
            fill={r.includes('NULL')?'#FEF3C7':'#F0FDF4'} stroke={r.includes('NULL')?'#D97706':'#10B981'} strokeWidth="1.5"/>
          <text x="240" y={133+i*26} textAnchor="middle" fontSize="9.5" fill="#374151">{r}</text>
        </g>
      ))}
      <text x="240" y="100" textAnchor="middle" fontSize="10" fill={colors[joinType]} fontWeight="600">Result ({display.length} rows)</text>
    </svg>
  )
}

function SqlCTEVisual() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setStep(s=>(s+1)%3), 1800)
    return () => clearInterval(id)
  }, [])
  const steps = [
    { label: 'WITH dept_avg AS (', color: '#7C3AED', y: 30 },
    { label: '  SELECT dept, AVG(salary)', color: '#3B82F6', y: 78 },
    { label: 'SELECT * FROM dept_avg...', color: '#10B981', y: 126 },
  ]
  return (
    <svg viewBox="0 0 480 175" className="w-full max-w-lg mx-auto">
      <text x="240" y="18" textAnchor="middle" fontSize="11" fill="#6B7280">CTEs: name a query, reuse it</text>
      {steps.map((s,i)=>{
        const active = i===step
        return (
          <g key={i}>
            <rect x="60" y={s.y} width="360" height="40" rx="10"
              fill={active?s.color+'22':'#F9FAFB'} stroke={active?s.color:'#E5E7EB'} strokeWidth={active?2.5:1.5}
              style={{ transition:'all 0.4s', filter: active?`drop-shadow(0 3px 8px ${s.color}44)`:'none' }}/>
            <text x="240" y={s.y+25} textAnchor="middle" fontSize="12" fill={active?s.color:'#9CA3AF'}
              fontWeight={active?700:400} style={{ transition:'all 0.4s', fontFamily:'monospace' }}>
              {s.label}
            </text>
            {i<steps.length-1 && <line x1="240" y1={s.y+40} x2="240" y2={steps[i+1].y} stroke="#D1D5DB" strokeWidth="1.5" strokeDasharray="4"/>}
          </g>
        )
      })}
      <text x="240" y="170" textAnchor="middle" fontSize="11" fill="#6B7280">
        {['Step 1: Define the CTE','Step 2: Build the query','Step 3: Use it like a table'][step]}
      </text>
    </svg>
  )
}

function SqlWindowVisual() {
  const rows = [
    { name:'Carol', dept:'Eng', salary:90000 },
    { name:'Alice', dept:'Eng', salary:85000 },
    { name:'Eve',   dept:'Eng', salary:78000 },
    { name:'Bob',   dept:'Sales', salary:62000 },
    { name:'Dave',  dept:'Sales', salary:55000 },
  ]
  const [highlighted, setHighlighted] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setHighlighted(h=>(h+1)%rows.length), 900)
    return () => clearInterval(id)
  }, [])
  const rank = rows.map((r,i) => {
    const deptRows = rows.filter(x=>x.dept===r.dept).sort((a,b)=>b.salary-a.salary)
    return deptRows.findIndex(x=>x.name===r.name)+1
  })
  return (
    <svg viewBox="0 0 480 175" className="w-full max-w-lg mx-auto">
      <text x="240" y="18" textAnchor="middle" fontSize="11" fill="#6B7280">ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC)</text>
      {/* Header */}
      <rect x="20" y="24" width="440" height="22" rx="6" fill="#7C3AED"/>
      {['Name','Dept','Salary','RANK'].map((h,i)=>
        <text key={h} x={[75,175,295,420][i]} y="39" textAnchor="middle" fontSize="11" fill="white" fontWeight="700">{h}</text>
      )}
      {rows.map((r,i)=>{
        const active = i===highlighted
        const deptColor = r.dept==='Eng' ? '#EDE9FE' : '#D1FAE5'
        const deptStroke = r.dept==='Eng' ? '#7C3AED' : '#10B981'
        return (
          <g key={r.name}>
            <rect x="20" y={48+i*24} width="440" height="22" rx="5"
              fill={active ? deptColor : '#F9FAFB'} stroke={active?deptStroke:'#E5E7EB'} strokeWidth={active?2:1}
              style={{ transition:'all 0.3s' }}/>
            {['name','dept','salary','rank'].map((k,j)=>{
              const val = k==='rank' ? rank[i] : k==='salary' ? `$${(r.salary/1000).toFixed(0)}k` : r[k as 'name'|'dept']
              return <text key={k} x={[75,175,295,420][j]} y={63+i*24} textAnchor="middle" fontSize="11"
                fill={active?deptStroke:'#6B7280'} fontWeight={k==='rank'?700:400} style={{ transition:'all 0.3s' }}>{val}</text>
            })}
            {active && <rect x="390" y={50+i*24} width="64" height="18" rx="5" fill={deptStroke} opacity="0.2"/>}
          </g>
        )
      })}
    </svg>
  )
}

function SqlDataQualityVisual() {
  const rows = [
    { email:'alice@co.com',  dept:10,  updated:'2024-01-15', issues:[] },
    { email:'bob@co.com',    dept:null, updated:'2024-01-20', issues:['NULL dept'] },
    { email:'alice@co.com',  dept:10,  updated:'2024-01-15', issues:['Duplicate email'] },
    { email:'',              dept:20,  updated:'2023-05-01', issues:['Empty email','Stale 90d+'] },
    { email:'carol@co.com',  dept:30,  updated:'2024-02-01', issues:[] },
  ]
  const [scanRow, setScanRow] = useState(-1)
  useEffect(() => {
    let i = -1
    const id = setInterval(() => { i=(i+1)%rows.length; setScanRow(i) }, 700)
    return () => clearInterval(id)
  }, [])
  return (
    <svg viewBox="0 0 480 180" className="w-full max-w-lg mx-auto">
      <text x="240" y="15" textAnchor="middle" fontSize="11" fill="#6B7280">Data Quality Scan — detecting issues</text>
      {rows.map((r,i)=>{
        const bad = r.issues.length > 0
        const scanning = i===scanRow
        const done = i<scanRow
        return (
          <g key={i}>
            <rect x="20" y={22+i*30} width="340" height="24" rx="7"
              fill={done&&bad?'#FEE2E2':done&&!bad?'#D1FAE5':scanning?'#FEF3C7':'#F9FAFB'}
              stroke={done&&bad?'#EF4444':done&&!bad?'#10B981':scanning?'#D97706':'#E5E7EB'}
              strokeWidth={scanning?2.5:1.5} style={{ transition:'all 0.3s' }}/>
            <text x="200" y={38+i*30} textAnchor="middle" fontSize="10" fill="#374151">
              {r.email || '(empty)'} | dept:{r.dept??'NULL'}
            </text>
            {done && <text x="380" y={38+i*30} textAnchor="middle" fontSize="14">{bad?'❌':'✅'}</text>}
            {done && bad && <text x="430" y={38+i*30} fontSize="9" fill="#EF4444">{r.issues[0]}</text>}
            {scanning && <text x="380" y={38+i*30} fontSize="13">🔍</text>}
          </g>
        )
      })}
    </svg>
  )
}

function SqlViewVisual() {
  const [phase, setPhase] = useState<'query'|'save'|'use'>('query')
  useEffect(() => {
    const phases: Array<'query'|'save'|'use'> = ['query','save','use']
    let i=0
    const id = setInterval(()=>{ i=(i+1)%phases.length; setPhase(phases[i]) }, 2000)
    return () => clearInterval(id)
  }, [])
  return (
    <svg viewBox="0 0 480 180" className="w-full max-w-lg mx-auto">
      {/* Query box */}
      <rect x="20" y="30" width="200" height="100" rx="10"
        fill={phase==='query'?'#EDE9FE':'#F9FAFB'} stroke={phase==='query'?'#7C3AED':'#D1D5DB'}
        strokeWidth={phase==='query'?2.5:1.5} style={{ transition:'all 0.4s' }}/>
      <text x="120" y="55" textAnchor="middle" fontSize="10" fill="#6B7280" fontFamily="monospace">SELECT * FROM emp</text>
      <text x="120" y="73" textAnchor="middle" fontSize="10" fill="#6B7280" fontFamily="monospace">WHERE status=&apos;active&apos;</text>
      <text x="120" y="91" textAnchor="middle" fontSize="10" fill="#6B7280" fontFamily="monospace">JOIN departments...</text>
      <text x="120" y="118" textAnchor="middle" fontSize="11" fill="#7C3AED" fontWeight="600">Complex Query</text>
      {/* Arrow + save */}
      {(phase==='save'||phase==='use') && (
        <>
          <line x1="220" y1="80" x2="260" y2="80" stroke="#10B981" strokeWidth="2.5" strokeDasharray="4"/>
          <text x="240" y="75" textAnchor="middle" fontSize="9" fill="#10B981">CREATE VIEW</text>
        </>
      )}
      {/* View box */}
      <rect x="260" y="50" width="200" height="60" rx="10"
        fill={phase==='save'||phase==='use'?'#D1FAE5':'#F3F4F6'}
        stroke={phase==='save'||phase==='use'?'#10B981':'#D1D5DB'}
        strokeWidth={phase==='use'?3:1.5} style={{ transition:'all 0.5s',
        filter: phase==='use'?'drop-shadow(0 4px 10px #10B98155)':'none' }}/>
      <text x="360" y="78" textAnchor="middle" fontSize="13" fill={phase==='use'?'#065F46':'#9CA3AF'}
        fontWeight={phase==='use'?700:400} fontFamily="monospace">active_employees</text>
      <text x="360" y="98" textAnchor="middle" fontSize="10" fill={phase==='use'?'#065F46':'#9CA3AF'}>Saved View</text>
      {/* Use */}
      {phase==='use' && (
        <text x="360" y="148" textAnchor="middle" fontSize="11" fill="#10B981" fontWeight="600">
          SELECT * FROM active_employees;
        </text>
      )}
      <text x="240" y="170" textAnchor="middle" fontSize="11" fill="#6B7280">
        {phase==='query'?'Complex query to simplify':phase==='save'?'Saved as a named view':'Use like a table — forever!'}
      </text>
    </svg>
  )
}

function SqlDebuggingVisual() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const id = setInterval(()=>setStep(s=>(s+1)%4), 1800)
    return () => clearInterval(id)
  }, [])
  const counts = [500, 500, 1200, 1200]
  const labels = ['Before JOIN: 500 rows','Add LEFT JOIN...','After JOIN: 1200 rows — EXPLOSION!','Root cause: key not unique!']
  const colors = ['#10B981','#D97706','#EF4444','#7C3AED']
  const width = [80, 80, 192, 192]
  return (
    <svg viewBox="0 0 480 175" className="w-full max-w-lg mx-auto">
      <text x="240" y="18" textAnchor="middle" fontSize="11" fill="#6B7280">Debugging: sanity-check row counts</text>
      {/* Bar chart */}
      <rect x="160" y="170" width="160" height="2" fill="#E5E7EB"/>
      <rect x="80" y={130-width[step]} width="120" height={width[step]} rx="6"
        fill={colors[step]+'44'} stroke={colors[step]} strokeWidth="2"
        style={{ transition:'all 0.5s' }}/>
      <text x="140" y={128-width[step]} textAnchor="middle" fontSize="13" fill={colors[step]} fontWeight="700">
        {counts[step]}
      </text>
      <text x="140" y="160" textAnchor="middle" fontSize="10" fill="#6B7280">row count</text>
      {/* Diff indicator */}
      {step>=2 && (
        <g>
          <rect x="270" y="60" width="160" height="60" rx="10" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2"/>
          <text x="350" y="87" textAnchor="middle" fontSize="12" fill="#EF4444" fontWeight="700">+700 rows</text>
          <text x="350" y="108" textAnchor="middle" fontSize="10" fill="#EF4444">Row explosion!</text>
        </g>
      )}
      <text x="240" y="170" textAnchor="middle" fontSize="11" fill={colors[step]} fontWeight="600">{labels[step]}</text>
    </svg>
  )
}

function SqlPythonPGVisual() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const id = setInterval(()=>setStep(s=>(s+1)%4), 1800)
    return () => clearInterval(id)
  }, [])
  const stages = [
    { label:'Python Script', icon:'🐍', color:'#7C3AED', x:30 },
    { label:'psycopg2', icon:'🔌', color:'#3B82F6', x:150 },
    { label:'PostgreSQL', icon:'🐘', color:'#10B981', x:270 },
    { label:'Results / pandas', icon:'🐼', color:'#D97706', x:370 },
  ]
  return (
    <svg viewBox="0 0 480 175" className="w-full max-w-lg mx-auto">
      <text x="240" y="18" textAnchor="middle" fontSize="11" fill="#6B7280">Python ↔ PostgreSQL pipeline</text>
      {stages.map((s,i)=>{
        const active = i===step
        return (
          <g key={i}>
            <rect x={s.x} y="30" width="90" height="90" rx="12"
              fill={active?s.color+'22':'#F9FAFB'} stroke={active?s.color:'#E5E7EB'}
              strokeWidth={active?3:1.5} style={{ transition:'all 0.4s',
              filter: active?`drop-shadow(0 4px 12px ${s.color}44)`:'none' }}/>
            <text x={s.x+45} y="70" textAnchor="middle" fontSize="22">{s.icon}</text>
            <text x={s.x+45} y="100" textAnchor="middle" fontSize="9" fill={active?s.color:'#9CA3AF'} fontWeight={active?700:400}
              style={{ transition:'all 0.4s' }}>{s.label}</text>
            {i<stages.length-1 && (
              <line x1={s.x+90} y1="75" x2={stages[i+1].x} y2="75"
                stroke={i<step?'#10B981':'#E5E7EB'} strokeWidth="2.5"
                strokeDasharray={i===step?'6':'none'} style={{ transition:'all 0.4s' }}/>
            )}
          </g>
        )
      })}
      {/* Code snippet */}
      <rect x="80" y="135" width="320" height="28" rx="8" fill="#1F2937"/>
      <text x="240" y="153" textAnchor="middle" fontSize="10" fill="#10B981" fontFamily="monospace">
        {['import psycopg2','cur.execute("SELECT...", (val,))','rows = cur.fetchall()','df = pd.read_sql(sql, conn)'][step]}
      </text>
    </svg>
  )
}

const VISUAL_MAP: Record<string, () => JSX.Element> = {
  'what-is-a-variable': VariableVisual,
  'data-types-basics': DataTypesVisual,
  'string-power': StringVisual,
  'user-input': UserInputVisual,
  'variables-practice': VariablesPracticeVisual,
  'if-else-basics': IfElseVisual,
  'for-loops': ForLoopVisual,
  'while-loops': WhileLoopVisual,
  'what-is-a-function': FunctionVisual,
  'lists-basics': ListVisual,
  'dictionaries-basics': DictVisual,
  'classes-and-objects': ClassVisual,
  'reading-writing-files': FileIOVisual,
  'try-except-errors': TryExceptVisual,
  'what-is-an-api': APIVisual,
  'number-guessing-game': MiniProjectVisual,
  'sql-how-databases-think': SqlDBThinkVisual,
  'sql-select-from':         SqlSelectVisual,
  'sql-where-filtering':     SqlWhereVisual,
  'sql-sorting-limiting':    SqlSortingVisual,
  'sql-aggregates':          SqlAggregatesVisual,
  'sql-joins-deep-dive':     SqlJoinsDeepVisual,
  'sql-ctes-subqueries':     SqlCTEVisual,
  'sql-window-functions':    SqlWindowVisual,
  'sql-data-quality':        SqlDataQualityVisual,
  'sql-views':               SqlViewVisual,
  'sql-debugging':           SqlDebuggingVisual,
  'sql-python-postgresql':   SqlPythonPGVisual,
}

// ── main export ──────────────────────────────────────────────────────────────

export default function ConceptVisual({ slug }: Props) {
  const Visual = VISUAL_MAP[slug]
  if (!Visual) return null

  return (
    <div className="bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-900 dark:to-purple-950/20
                    border border-purple-100 dark:border-purple-900/40 rounded-2xl p-4 mb-2">
      <p className="text-xs font-semibold text-purple-500 uppercase tracking-wider mb-3 text-center">
        🎬 Visual — watch it animate
      </p>
      <Visual />
    </div>
  )
}
