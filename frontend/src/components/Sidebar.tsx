import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  CalendarIcon,
  ClipboardIcon,
  GraduationIcon,
  HomeIcon,
  LogoutIcon,
  SparklesIcon,
  VideoIcon,
  XIcon,
} from './icons'

const navLinks = [
  { to: '/', label: 'Dashboard', icon: HomeIcon },
  { to: '/activities', label: 'Activities', icon: SparklesIcon },
  { to: '/assignments', label: 'Assignments', icon: ClipboardIcon },
  { to: '/meetings', label: 'Meetings', icon: VideoIcon },
]

function isActive(pathname: string, to: string) {
  return to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`)
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { logout } = useAuth()
  const location = useLocation()

  return (
    <div className="flex h-full flex-col bg-slate-950 text-white">
      <div className="flex items-center justify-between px-5 py-5">
        <Link to="/" onClick={onClose} className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-sm shadow-indigo-500/30">
            <GraduationIcon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold tracking-tight">School Portal</p>
            <p className="text-xs font-medium text-slate-400">Learning dashboard</p>
          </div>
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <XIcon />
          </button>
        )}
      </div>

      <div className="px-3">
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-xs text-slate-300">
          <CalendarIcon className="h-4 w-4 text-indigo-300" />
          <span>Today&apos;s school hub</span>
        </div>
        <nav className="space-y-1">
          {navLinks.map((link) => {
            const active = isActive(location.pathname, link.to)
            const Icon = link.icon
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  active
                    ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/30'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-white/10 p-3">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <LogoutIcon className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-900 bg-slate-950 lg:block">
        <SidebarContent />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/50"
            aria-label="Close navigation overlay"
            onClick={onClose}
          />
          <aside className="relative h-full w-72 max-w-[82vw] shadow-2xl">
            <SidebarContent onClose={onClose} />
          </aside>
        </div>
      )}
    </>
  )
}
