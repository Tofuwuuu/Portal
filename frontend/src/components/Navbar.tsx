import { Link, useLocation } from 'react-router-dom'
import { GraduationIcon } from './icons'
import { useAuth } from '../context/AuthContext'

const navLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/activities', label: 'Activities' },
  { to: '/assignments', label: 'Assignments' },
]

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <nav className="sticky top-0 z-50 border-b border-primary-dark/20 bg-gradient-to-r from-primary-dark via-primary to-primary-light shadow-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
            <GraduationIcon className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">School Portal</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden items-center gap-1 sm:flex">
            {navLinks.map((link) => {
              const active = location.pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-white/20 text-white shadow-sm'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>

          {user && (
            <div className="flex items-center gap-3 border-l border-white/20 pl-3 sm:pl-4">
              <div className="hidden items-center gap-2 sm:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white">
                  {initials(user.full_name)}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium leading-tight text-white">{user.full_name}</p>
                  <p className="text-xs capitalize text-blue-100">{user.role}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium text-white backdrop-blur transition hover:bg-white/25"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-t border-white/10 px-4 py-2 sm:hidden">
        {navLinks.map((link) => {
          const active = location.pathname === link.to
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${
                active ? 'bg-white/20 text-white' : 'text-blue-100'
              }`}
            >
              {link.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
