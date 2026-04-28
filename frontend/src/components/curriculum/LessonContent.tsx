import { useEffect, useRef } from 'react'
import hljs from 'highlight.js/lib/core'
import python from 'highlight.js/lib/languages/python'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import 'highlight.js/styles/atom-one-dark.min.css'
import DOMPurify from 'dompurify'
import type { DiagramData } from '../../types'
import ConceptVisual from './ConceptVisual'

hljs.registerLanguage('python', python)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('json', json)

interface Props {
  html: string
  diagramData: DiagramData | null
  slug?: string
}

export default function LessonContent({ html, diagramData, slug }: Props) {
  const diagramRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!diagramData || diagramData.type !== 'mermaid' || !diagramRef.current) return
    import('mermaid').then((mermaid) => {
      mermaid.default.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'loose' })
      const id = `mermaid-${Math.random().toString(36).slice(2)}`
      mermaid.default.render(id, diagramData.code).then(({ svg }) => {
        if (diagramRef.current) diagramRef.current.innerHTML = svg
      }).catch(() => {})
    })
  }, [diagramData])

  // Apply highlight.js to every <pre><code> block after render
  useEffect(() => {
    if (!contentRef.current) return
    contentRef.current.querySelectorAll<HTMLElement>('pre code').forEach((block) => {
      // avoid double-highlighting
      if (!block.dataset.highlighted) {
        hljs.highlightElement(block)
      }
    })
    // Style every <pre> wrapper to look great
    contentRef.current.querySelectorAll<HTMLElement>('pre').forEach((pre) => {
      pre.style.borderRadius = '12px'
      pre.style.fontSize = '14px'
      pre.style.lineHeight = '1.65'
      pre.style.overflowX = 'auto'
      pre.style.margin = '0'
    })
  }, [html])

  const clean = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })

  return (
    <div className="space-y-6">
      {slug && <ConceptVisual slug={slug} />}
      {diagramData && (
        <div className="card p-4 flex justify-center overflow-x-auto">
          <div ref={diagramRef} className="max-w-full" />
        </div>
      )}
      <div
        ref={contentRef}
        className="lesson-content"
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    </div>
  )
}
