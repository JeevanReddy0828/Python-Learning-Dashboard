interface Props {
  stdout: string
  stderr: string
}

export default function OutputPanel({ stdout, stderr }: Props) {
  const hasOutput = stdout || stderr
  if (!hasOutput) return null

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="bg-gray-800 px-4 py-2 text-xs text-gray-400 font-mono flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
        Output
      </div>
      <div className="bg-gray-900 p-4 font-mono text-sm max-h-48 overflow-y-auto">
        {stdout && (
          <pre className="text-green-300 whitespace-pre-wrap break-all">{stdout}</pre>
        )}
        {stderr && (
          <pre className="text-red-400 whitespace-pre-wrap break-all mt-2">{stderr}</pre>
        )}
      </div>
    </div>
  )
}
