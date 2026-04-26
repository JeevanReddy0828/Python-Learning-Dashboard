// Pyodide in-browser Python runner
// Loads once and caches the instance for fast subsequent runs

declare global {
  interface Window {
    loadPyodide: (opts: { indexURL: string }) => Promise<PyodideInstance>
    pyodideInstance: PyodideInstance | null
  }
}

interface PyodideInstance {
  runPythonAsync: (code: string) => Promise<unknown>
  setStdout: (opts: { batched: (s: string) => void }) => void
  setStderr: (opts: { batched: (s: string) => void }) => void
}

export interface RunResult {
  stdout: string
  stderr: string
  execution_time: number
  timed_out: boolean
}

let pyodideLoadPromise: Promise<PyodideInstance> | null = null

async function loadPyodideInstance(): Promise<PyodideInstance> {
  if (window.pyodideInstance) return window.pyodideInstance

  if (!pyodideLoadPromise) {
    pyodideLoadPromise = (async () => {
      // Dynamically inject the Pyodide script tag if not already loaded
      if (!window.loadPyodide) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js'
          script.onload = () => resolve()
          script.onerror = reject
          document.head.appendChild(script)
        })
      }
      const pyodide = await window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/',
      })
      window.pyodideInstance = pyodide
      return pyodide
    })()
  }

  return pyodideLoadPromise
}

export async function runPython(code: string, timeoutMs = 10000): Promise<RunResult> {
  const pyodide = await loadPyodideInstance()

  let stdout = ''
  let stderr = ''

  pyodide.setStdout({ batched: (s: string) => { stdout += s + '\n' } })
  pyodide.setStderr({ batched: (s: string) => { stderr += s + '\n' } })

  const start = performance.now()
  let timed_out = false

  try {
    await Promise.race([
      pyodide.runPythonAsync(code),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('TimeoutError')), timeoutMs)
      ),
    ])
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'TimeoutError') {
      timed_out = true
      stderr = `Code took too long to run (limit: ${timeoutMs / 1000}s). Check for infinite loops!`
    } else {
      stderr += (e as Error).message || String(e)
    }
  }

  return {
    stdout: stdout.trimEnd(),
    stderr: stderr.trimEnd(),
    execution_time: Math.round(performance.now() - start),
    timed_out,
  }
}

export function isPyodideLoaded(): boolean {
  return !!window.pyodideInstance
}
