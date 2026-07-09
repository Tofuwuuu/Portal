import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/activities', label: 'Activities' },
  { to: '/assignments', label: 'Assignments' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <nav className="bg-primary text-white shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="text-xl font-bold tracking-tight">
          School Portal
        </Link>
        <div className="flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium transition hover:text-blue-200 ${
                location.pathname === link.to ? 'text-blue-200 underline' : ''
              }`}
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <div className="flex items-center gap-4 border-l border-blue-400 pl-4">
              <span className="text-sm text-blue-100">
                {user.full_name} ({user.role})
              </span>
              <button
                onClick={logout}
                className="rounded bg-white/10 px-3 py-1 text-sm hover:bg-white/20"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
