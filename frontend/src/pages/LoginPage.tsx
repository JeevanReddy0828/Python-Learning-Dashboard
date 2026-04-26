import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await login(email, password)
      toast.success('Welcome back! 🐍')
      navigate('/dashboard')
    } catch {
      toast.error('Invalid email or password')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Welcome back!</h2>
        <p className="text-gray-500 text-sm mt-1">Continue your Python journey</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
        <input
          className="input"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
        <input
          className="input"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <button type="submit" className="btn-primary w-full py-3 text-base" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In 🚀'}
      </button>

      <p className="text-center text-sm text-gray-500">
        New here?{' '}
        <Link to="/register" className="text-primary-600 font-medium hover:underline">
          Create account
        </Link>
      </p>
    </form>
  )
}
