import { useAuth } from '../context/AuthContext'
import { BellIcon, MenuIcon } from './icons'

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

interface TopHeaderProps {
  title: string
  subtitle?: string
  onMenuClick: () => void
}

export default function TopHeader({ title, subtitle, onMenuClick }: TopHeaderProps) {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-50 lg:hidden"
            aria-label="Open navigation"
          >
            <MenuIcon />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
              {title}
            </h1>
            {subtitle && <p className="mt-0.5 truncate text-sm text-slate-500">{subtitle}</p>}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"
            aria-label="Notifications"
          >
            <BellIcon className="h-5 w-5" />
          </button>
          {user && (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700">
                {initials(user.full_name)}
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="max-w-36 truncate text-sm font-semibold leading-tight text-slate-900">
                  {user.full_name}
                </p>
                <p className="text-xs capitalize leading-tight text-slate-500">{user.role}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
