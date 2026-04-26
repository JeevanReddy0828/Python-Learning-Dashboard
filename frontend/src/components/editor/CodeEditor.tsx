import Editor from '@monaco-editor/react'
import { useUIStore } from '../../store/uiStore'

interface Props {
  value: string
  onChange: (value: string) => void
  height?: string
  readOnly?: boolean
  highlightLines?: number[]
}

export default function CodeEditor({ value, onChange, height = '240px', readOnly = false }: Props) {
  const darkMode = useUIStore((s) => s.darkMode)

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
      <Editor
        height={height}
        language="python"
        value={value}
        theme={darkMode ? 'vs-dark' : 'light'}
        onChange={(v) => onChange(v ?? '')}
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontLigatures: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          readOnly,
          lineNumbers: 'on',
          glyphMargin: false,
          folding: false,
          lineDecorationsWidth: 8,
          renderLineHighlight: 'all',
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
          tabSize: 4,
          padding: { top: 12, bottom: 12 },
        }}
      />
    </div>
  )
}
