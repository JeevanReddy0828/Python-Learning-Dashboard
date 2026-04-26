import { useState, useRef, useEffect } from 'react'
import { aiApi } from '../../api'

interface ConceptNode {
  id: string
  label: string
  emoji: string
  description: string
  color: string
  children?: ConceptNode[]
}

const PALETTE = [
  '#7C3AED', '#2563EB', '#059669', '#D97706', '#DC2626',
  '#7C3AED', '#0891B2', '#65A30D', '#EA580C', '#9333EA',
]

function polarToXY(angle: number, r: number, cx: number, cy: number) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  }
}

function MapSVG({ root }: { root: ConceptNode }) {
  const [hovered, setHovered] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const W = 700
  const H = 500
  const cx = W / 2
  const cy = H / 2
  const innerR = 90
  const outerR = 195

  const children = root.children ?? []
  const grandchildGroups: Array<{ parent: ConceptNode; nodes: ConceptNode[]; parentAngle: number }> = []

  children.forEach((child, i) => {
    const angle = (i / children.length) * 2 * Math.PI - Math.PI / 2
    if (child.children?.length) {
      grandchildGroups.push({ parent: child, nodes: child.children, parentAngle: angle })
    }
  })

  return (
    <div className="relative overflow-x-auto rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full max-w-2xl mx-auto" style={{ minHeight: 340 }}>
        {/* Edges: center → children */}
        {children.map((child, i) => {
          const angle = (i / children.length) * 2 * Math.PI - Math.PI / 2
          const pos = polarToXY(angle, innerR, cx, cy)
          const cpos = polarToXY(angle, outerR, cx, cy)
          return (
            <line
              key={`edge-${i}`}
              x1={pos.x} y1={pos.y}
              x2={cpos.x} y2={cpos.y}
              stroke={PALETTE[i % PALETTE.length]}
              strokeWidth={hovered === child.id ? 3 : 1.5}
              strokeOpacity={hovered && hovered !== child.id ? 0.3 : 0.7}
              strokeDasharray="4 3"
            />
          )
        })}

        {/* Edges: children → grandchildren */}
        {grandchildGroups.map(({ parent, nodes, parentAngle }) => {
          const ppos = polarToXY(parentAngle, outerR, cx, cy)
          const spread = 0.4
          return nodes.map((gc, gi) => {
            const angle = parentAngle + (gi - (nodes.length - 1) / 2) * spread
            const gcpos = polarToXY(angle, outerR + 90, cx, cy)
            return (
              <line
                key={`gc-edge-${parent.id}-${gi}`}
                x1={ppos.x} y1={ppos.y}
                x2={gcpos.x} y2={gcpos.y}
                stroke="#9CA3AF"
                strokeWidth={1}
                strokeOpacity={hovered && hovered !== parent.id ? 0.15 : 0.5}
                strokeDasharray="3 4"
              />
            )
          })
        })}

        {/* Grandchildren */}
        {grandchildGroups.map(({ parent, nodes, parentAngle }) =>
          nodes.map((gc, gi) => {
            const spread = 0.4
            const angle = parentAngle + (gi - (nodes.length - 1) / 2) * spread
            const pos = polarToXY(angle, outerR + 90, cx, cy)
            return (
              <g key={`gc-${parent.id}-${gi}`} transform={`translate(${pos.x},${pos.y})`}
                onMouseEnter={() => setHovered(parent.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <circle r={26} fill="white" stroke="#E5E7EB" strokeWidth={1.5} className="dark:stroke-gray-600" style={{ fill: 'var(--gc-bg, white)' }} />
                <text textAnchor="middle" dominantBaseline="central" fontSize={14}>{gc.emoji}</text>
                <text textAnchor="middle" y={36} fontSize={8} fill="#6B7280" className="font-medium">
                  {gc.label.length > 12 ? gc.label.slice(0, 11) + '…' : gc.label}
                </text>
              </g>
            )
          })
        )}

        {/* Child nodes */}
        {children.map((child, i) => {
          const angle = (i / children.length) * 2 * Math.PI - Math.PI / 2
          const pos = polarToXY(angle, outerR, cx, cy)
          const color = PALETTE[i % PALETTE.length]
          const isHov = hovered === child.id
          return (
            <g
              key={`node-${i}`}
              transform={`translate(${pos.x},${pos.y})`}
              className="cursor-pointer"
              onMouseEnter={() => setHovered(child.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <circle r={isHov ? 40 : 34} fill={color} fillOpacity={isHov ? 1 : 0.85} className="transition-all duration-200" />
              <text textAnchor="middle" dominantBaseline="central" dy={-8} fontSize={18}>{child.emoji}</text>
              <text textAnchor="middle" dy={12} fontSize={8.5} fill="white" fontWeight="600">
                {child.label.length > 10 ? child.label.slice(0, 9) + '…' : child.label}
              </text>

              {/* Tooltip */}
              {isHov && (
                <g>
                  <rect x={-80} y={46} width={160} height={38} rx={8} fill="#1F2937" fillOpacity={0.95} />
                  <text x={0} y={62} textAnchor="middle" fontSize={9} fill="#F9FAFB">
                    {child.description.length > 40 ? child.description.slice(0, 39) + '…' : child.description}
                  </text>
                </g>
              )}
            </g>
          )
        })}

        {/* Center node */}
        <g transform={`translate(${cx},${cy})`}>
          <circle r={innerR} fill="#7C3AED" />
          <circle r={innerR - 4} fill="#6D28D9" />
          <text textAnchor="middle" dominantBaseline="central" dy={-16} fontSize={28}>{root.emoji}</text>
          <text textAnchor="middle" dy={12} fontSize={11} fill="white" fontWeight="700">
            {root.label}
          </text>
          <text textAnchor="middle" dy={28} fontSize={8} fill="#C4B5FD">concept map</text>
        </g>
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 px-4 pb-4 justify-center">
        {children.map((child, i) => (
          <div
            key={child.id}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full text-white cursor-pointer transition-opacity"
            style={{ background: PALETTE[i % PALETTE.length], opacity: hovered && hovered !== child.id ? 0.4 : 1 }}
            onMouseEnter={() => setHovered(child.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <span>{child.emoji}</span>
            <span>{child.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ConceptMap() {
  const [topic, setTopic] = useState('')
  const [root, setRoot] = useState<ConceptNode | null>(null)
  const [loading, setLoading] = useState(false)

  async function generate() {
    if (!topic.trim()) return
    setLoading(true)
    setRoot(null)

    const prompt = `Create a concept mind map for learning "${topic}" in Python.
Return ONLY valid JSON (no markdown):
{
  "id": "root",
  "label": "${topic}",
  "emoji": "🐍",
  "description": "The core concept",
  "color": "#7C3AED",
  "children": [
    {
      "id": "c1",
      "label": "Sub-concept",
      "emoji": "📦",
      "description": "One sentence explanation of this sub-concept",
      "color": "#2563EB",
      "children": [
        { "id": "c1a", "label": "Detail", "emoji": "🔹", "description": "Brief detail", "color": "#93C5FD" }
      ]
    }
  ]
}
Rules:
- 6-8 children of the root (the main branches)
- Each child may have 2-3 grandchildren (specific details/examples)
- Emojis must be unique and visually represent the concept
- Descriptions are 1 short sentence
- Return ONLY valid JSON.`

    try {
      const res = await aiApi.chat(prompt, '', topic)
      const raw = res.data.response
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) setRoot(JSON.parse(match[0]))
    } catch {
      setRoot(getDemoMap(topic))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-2xl p-5 text-white">
        <h2 className="text-xl font-bold mb-1">🧠 Concept Mind Map</h2>
        <p className="text-indigo-100 text-sm">
          See how all the pieces connect. Hover nodes for details.
        </p>
      </div>

      <div className="card p-4 flex gap-3">
        <input
          className="input flex-1"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && generate()}
          placeholder="Topic (e.g. Python OOP, async programming, data structures...)"
        />
        <button onClick={generate} disabled={loading || !topic.trim()} className="btn-primary px-5">
          {loading ? '⏳' : '🗺️ Map It'}
        </button>
      </div>

      {loading && (
        <div className="rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" style={{ height: 380 }}>
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">Building your concept map...</div>
        </div>
      )}

      {root && <MapSVG root={root} />}
    </div>
  )
}

function getDemoMap(topic: string): ConceptNode {
  return {
    id: 'root',
    label: topic,
    emoji: '🐍',
    description: 'Core concept',
    color: '#7C3AED',
    children: [
      { id: 'c1', label: 'Syntax', emoji: '📝', description: 'The rules for writing valid code', color: '#2563EB', children: [{ id: 'c1a', label: 'Keywords', emoji: '🔑', description: 'Reserved words', color: '#93C5FD' }] },
      { id: 'c2', label: 'Variables', emoji: '📦', description: 'Named containers for data', color: '#059669', children: [{ id: 'c2a', label: 'Types', emoji: '🏷️', description: 'int, str, float, bool', color: '#6EE7B7' }] },
      { id: 'c3', label: 'Functions', emoji: '🎯', description: 'Reusable blocks of code', color: '#D97706', children: [{ id: 'c3a', label: 'Parameters', emoji: '📨', description: 'Inputs to a function', color: '#FCD34D' }] },
      { id: 'c4', label: 'Loops', emoji: '🔁', description: 'Repeat actions automatically', color: '#DC2626', children: [{ id: 'c4a', label: 'for / while', emoji: '⚙️', description: 'Two loop types', color: '#FCA5A5' }] },
      { id: 'c5', label: 'Data Structures', emoji: '🧺', description: 'Ways to organize data', color: '#7C3AED', children: [{ id: 'c5a', label: 'list, dict, set', emoji: '📊', description: 'Built-in collections', color: '#C4B5FD' }] },
      { id: 'c6', label: 'OOP', emoji: '🏗️', description: 'Object-Oriented Programming', color: '#0891B2', children: [{ id: 'c6a', label: 'Classes', emoji: '📐', description: 'Blueprints for objects', color: '#67E8F9' }] },
    ],
  }
}
