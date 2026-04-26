import { useEffect, useRef } from 'react'
import DOMPurify from 'dompurify'
import type { DiagramData } from '../../types'
import ConceptVisual from './ConceptVisual'

interface Props {
  html: string
  diagramData: DiagramData | null
  slug?: string
}

export default function LessonContent({ html, diagramData, slug }: Props) {
  const diagramRef = useRef<HTMLDivElement>(null)

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

  const clean = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })

  return (
    <div className="space-y-6">
      {slug && <ConceptVisual slug={slug} />}
      {diagramData && (
        <div className="card p-4 flex justify-center overflow-x-auto">
          <div ref={diagramRef} className="max-w-full" />
        </div>
      )}
      <div className="lesson-content" dangerouslySetInnerHTML={{ __html: clean }} />
    </div>
  )
}
