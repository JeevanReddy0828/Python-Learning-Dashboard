export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 dark:from-background-dark dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🐍</div>
          <h1 className="text-3xl font-bold text-primary-700 dark:text-primary-300">PyLearn</h1>
          <p className="text-gray-500 mt-1 text-sm">ADHD-Friendly Python Learning</p>
        </div>
        <div className="card p-8 shadow-xl">
          {children}
        </div>
      </div>
    </div>
  )
}
