import { useState, useCallback, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Position,
  Handle,
  NodeProps,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { aiApi } from '../../api'

// ── Types ────────────────────────────────────────────────────────────────────

interface ConceptNode {
  id: string
  label: string
  emoji: string
  description: string
  color: string
  children?: ConceptNode[]
}

// ── Custom Nodes ─────────────────────────────────────────────────────────────

function RootNode({ data }: NodeProps) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-full text-white font-bold shadow-lg"
      style={{ width: 120, height: 120, background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', border: '4px solid #A78BFA' }}
    >
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      <span style={{ fontSize: 32 }}>{data.emoji as string}</span>
      <span style={{ fontSize: 11, textAlign: 'center', maxWidth: 90, lineHeight: 1.2, marginTop: 4 }}>{data.label as string}</span>
    </div>
  )
}

function ChildNode({ data }: NodeProps) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl text-white shadow-md cursor-pointer transition-transform hover:scale-105"
      style={{ width: 100, height: 100, background: data.color as string, border: `3px solid ${data.color}99` }}
      title={data.description as string}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      <span style={{ fontSize: 26 }}>{data.emoji as string}</span>
      <span style={{ fontSize: 9.5, textAlign: 'center', maxWidth: 84, lineHeight: 1.2, marginTop: 3, fontWeight: 600, padding: '0 4px' }}>
        {data.label as string}
      </span>
    </div>
  )
}

function GrandchildNode({ data }: NodeProps) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-xl bg-white dark:bg-gray-800 shadow text-gray-700 dark:text-gray-200 px-2 py-1.5 text-xs font-medium border"
      style={{ border: `2px solid ${data.color}66`, maxWidth: 130 }}
      title={data.description as string}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <span style={{ fontSize: 14, flexShrink: 0 }}>{data.emoji as string}</span>
      <span style={{ lineHeight: 1.25 }}>{data.label as string}</span>
    </div>
  )
}

const nodeTypes = { root: RootNode, child: ChildNode, grandchild: GrandchildNode }

// ── Graph builder ─────────────────────────────────────────────────────────────

const PALETTE = ['#7C3AED', '#2563EB', '#059669', '#D97706', '#DC2626', '#0891B2', '#65A30D', '#EA580C', '#9333EA', '#BE185D']

function buildGraph(root: ConceptNode): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  nodes.push({
    id: 'root',
    type: 'root',
    position: { x: 0, y: 0 },
    data: { label: root.label, emoji: root.emoji, description: root.description, color: '#7C3AED' },
  })

  const children = root.children ?? []
  const angleStep = (2 * Math.PI) / Math.max(children.length, 1)
  const outerR = 280

  children.forEach((child, i) => {
    const angle = i * angleStep - Math.PI / 2
    const cx = Math.cos(angle) * outerR
    const cy = Math.sin(angle) * outerR
    const color = PALETTE[i % PALETTE.length]

    nodes.push({
      id: child.id,
      type: 'child',
      position: { x: cx - 50, y: cy - 50 },
      data: { label: child.label, emoji: child.emoji, description: child.description, color },
    })

    edges.push({
      id: `e-root-${child.id}`,
      source: 'root',
      target: child.id,
      animated: false,
      style: { stroke: color, strokeWidth: 2, strokeDasharray: '6 4' },
    })

    const grandchildren = child.children ?? []
    grandchildren.forEach((gc, gi) => {
      const spread = 0.55
      const gcAngle = angle + (gi - (grandchildren.length - 1) / 2) * spread
      const gcR = outerR + 160
      const gcx = Math.cos(gcAngle) * gcR
      const gcy = Math.sin(gcAngle) * gcR

      nodes.push({
        id: gc.id,
        type: 'grandchild',
        position: { x: gcx - 65, y: gcy - 18 },
        data: { label: gc.label, emoji: gc.emoji, description: gc.description, color },
      })

      edges.push({
        id: `e-${child.id}-${gc.id}`,
        source: child.id,
        target: gc.id,
        style: { stroke: `${color}88`, strokeWidth: 1.5 },
      })
    })
  })

  return { nodes, edges }
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  onGenerated?: (title: string, content: string) => void
  restored?: string
}

export default function ConceptMap({ onGenerated, restored }: Props) {
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(() => {
    if (restored) try { return JSON.parse(restored).nodes ?? [] } catch { return [] }
    return []
  })
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(() => {
    if (restored) try { return JSON.parse(restored).edges ?? [] } catch { return [] }
    return []
  })
  const [hasMap, setHasMap] = useState(!!restored)

  const generate = useCallback(async () => {
    if (!topic.trim()) return
    setLoading(true)
    setHasMap(false)

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
      "description": "One sentence explanation",
      "color": "#2563EB",
      "children": [
        { "id": "c1a", "label": "Detail", "emoji": "🔹", "description": "Brief detail", "color": "#93C5FD" }
      ]
    }
  ]
}
Rules:
- 5-7 children of the root (main branches)
- Each child may have 1-2 grandchildren
- Unique emojis for each node
- Return ONLY valid JSON.`

    try {
      const res = await aiApi.chat(prompt, '', topic)
      const raw = res.data.response
      const match = raw.match(/\{[\s\S]*\}/)
      const root: ConceptNode = match ? JSON.parse(match[0]) : getDemoMap(topic)
      const graph = buildGraph(root)
      setNodes(graph.nodes)
      setEdges(graph.edges)
      setHasMap(true)
      onGenerated?.(topic, JSON.stringify({ nodes: graph.nodes, edges: graph.edges }))
    } catch {
      const graph = buildGraph(getDemoMap(topic))
      setNodes(graph.nodes)
      setEdges(graph.edges)
      setHasMap(true)
      onGenerated?.(topic, JSON.stringify({ nodes: graph.nodes, edges: graph.edges }))
    } finally {
      setLoading(false)
    }
  }, [topic, setNodes, setEdges])

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-2xl p-5 text-white">
        <h2 className="text-xl font-bold mb-1">🕸️ Interactive Concept Map</h2>
        <p className="text-indigo-100 text-sm">
          Drag nodes around, zoom in/out, and see how every concept connects. Powered by React Flow.
        </p>
      </div>

      <div className="card p-4 flex gap-3">
        <input
          className="input flex-1"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && generate()}
          placeholder="Topic (e.g. Python OOP, for loops, dictionaries...)"
        />
        <button onClick={generate} disabled={loading || !topic.trim()} className="btn-primary px-5">
          {loading ? '⏳' : '🗺️ Map It'}
        </button>
      </div>

      {loading && (
        <div className="rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center justify-center" style={{ height: 480 }}>
          <span className="text-gray-400 text-sm">Building your concept map with AI…</span>
        </div>
      )}

      {hasMap && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ height: 520 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.3}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#E5E7EB" />
            <Controls showInteractive={false} className="rounded-xl overflow-hidden" />
            <MiniMap
              nodeColor={(n) => (n.type === 'root' ? '#7C3AED' : (n.data?.color as string) ?? '#9CA3AF')}
              maskColor="rgba(0,0,0,0.05)"
              className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700"
            />
          </ReactFlow>
        </div>
      )}

      {!hasMap && !loading && (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-3 text-gray-400" style={{ height: 240 }}>
          <span className="text-5xl">🕸️</span>
          <p className="text-sm">Enter a Python topic above to generate an interactive concept map</p>
          <div className="flex gap-2 flex-wrap justify-center">
            {['Variables', 'OOP', 'Loops', 'Functions', 'Dictionaries'].map(t => (
              <button key={t} onClick={() => { setTopic(t); }} className="text-xs bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 transition-colors">
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function getDemoMap(topic: string): ConceptNode {
  return {
    id: 'root', label: topic, emoji: '🐍', description: 'Core concept', color: '#7C3AED',
    children: [
      { id: 'c1', label: 'Syntax', emoji: '📝', description: 'Rules for writing valid code', color: '#2563EB', children: [{ id: 'c1a', label: 'Keywords', emoji: '🔑', description: 'Reserved words like if, for, def', color: '#93C5FD' }] },
      { id: 'c2', label: 'Variables', emoji: '📦', description: 'Named containers for data', color: '#059669', children: [{ id: 'c2a', label: 'Types', emoji: '🏷️', description: 'int, str, float, bool', color: '#6EE7B7' }] },
      { id: 'c3', label: 'Functions', emoji: '🎯', description: 'Reusable blocks of code', color: '#D97706', children: [{ id: 'c3a', label: 'Parameters', emoji: '📨', description: 'Inputs passed to a function', color: '#FCD34D' }] },
      { id: 'c4', label: 'Loops', emoji: '🔁', description: 'Repeat actions automatically', color: '#DC2626', children: [{ id: 'c4a', label: 'for / while', emoji: '⚙️', description: 'The two loop styles', color: '#FCA5A5' }] },
      { id: 'c5', label: 'Collections', emoji: '🧺', description: 'Ways to group data', color: '#7C3AED', children: [{ id: 'c5a', label: 'list, dict, set', emoji: '📊', description: 'Built-in collection types', color: '#C4B5FD' }] },
      { id: 'c6', label: 'OOP', emoji: '🏗️', description: 'Object-Oriented Programming', color: '#0891B2', children: [{ id: 'c6a', label: 'Classes', emoji: '📐', description: 'Blueprints for objects', color: '#67E8F9' }] },
    ],
  }
}
