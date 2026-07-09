import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GraduationIcon } from '../components/icons'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-primary-dark via-primary to-primary-light p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <GraduationIcon className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold">School Portal</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-tight">
            Your school hub for activities &amp; assignments
          </h2>
          <p className="mt-4 max-w-md text-blue-100">
            Stay on top of school events, homework, and announcements — all in one place.
          </p>
        </div>
        <p className="text-sm text-blue-200">© School Portal</p>
      </div>

      <div className="flex w-full flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/40 to-white px-4 py-12 lg:w-1/2">
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
            <GraduationIcon className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold text-primary">School Portal</span>
        </div>

        <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-card">
          <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
          <p className="mt-1 text-sm text-slate-500">Welcome back! Enter your credentials.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@school.com"
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="input-field"
              />
            </div>
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-primary-light hover:text-primary">
              Register
            </Link>
          </p>
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-center text-xs text-slate-400">
            Teacher: <span className="font-medium text-slate-500">admin@admin.com</span> / admin
          </p>
        </div>
      </div>
    </div>
  )
}
