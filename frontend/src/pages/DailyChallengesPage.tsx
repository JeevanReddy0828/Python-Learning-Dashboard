import { useNavigate } from 'react-router-dom'

// Daily challenges are seeded from the mini_project exercises
export default function DailyChallengesPage() {
  const navigate = useNavigate()

  const challenges = [
    { title: 'FizzBuzz', description: 'Print numbers 1-20. For multiples of 3 print "Fizz", for 5 print "Buzz"', difficulty: 'Easy', xp: 30, icon: '🎯' },
    { title: 'Palindrome Checker', description: 'Write a function that returns True if a string is a palindrome', difficulty: 'Medium', xp: 50, icon: '🔄' },
    { title: 'List Flattener', description: 'Flatten a nested list [[1,2],[3,[4,5]]] into [1,2,3,4,5]', difficulty: 'Medium', xp: 60, icon: '📋' },
    { title: 'Word Counter', description: 'Count the frequency of each word in a string and return a dict', difficulty: 'Easy', xp: 35, icon: '📊' },
    { title: 'Caesar Cipher', description: 'Encode a message by shifting each letter by N positions', difficulty: 'Hard', xp: 80, icon: '🔐' },
  ]

  const diffColor = (d: string) => d === 'Easy' ? 'badge-success' : d === 'Medium' ? 'badge-warning' : 'bg-red-100 text-red-600 badge'

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Daily Challenges ⚡</h1>
      <p className="text-gray-500 mb-8">Quick coding challenges to keep your skills sharp. New challenges every day!</p>

      <div className="space-y-4">
        {challenges.map((c, i) => (
          <div key={i} className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <span className="text-3xl">{c.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">{c.title}</h3>
                <span className={diffColor(c.difficulty)}>{c.difficulty}</span>
              </div>
              <p className="text-sm text-gray-500">{c.description}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-semibold text-yellow-500">+{c.xp} XP</div>
              <button
                onClick={() => navigate('/modules')}
                className="btn-primary text-xs px-3 py-1.5 mt-1"
              >
                Start
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 card p-6 text-center bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20">
        <p className="text-2xl mb-2">🏆</p>
        <p className="font-semibold text-gray-800 dark:text-gray-100">Complete all 5 today for a bonus +50 XP!</p>
        <p className="text-sm text-gray-500 mt-1">Resets at midnight</p>
      </div>
    </div>
  )
}
