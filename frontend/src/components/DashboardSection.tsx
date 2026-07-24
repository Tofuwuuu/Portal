import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

interface DashboardSectionProps {
  title: string
  to?: string
  children: ReactNode
  /** Tighter padding for side-by-side columns */
  dense?: boolean
}

export default function DashboardSection({ title, to, children, dense }: DashboardSectionProps) {
  return (
    <section className="flex min-w-0 flex-col">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-4 w-1 shrink-0 rounded-full bg-primary-light" aria-hidden />
          <h2 className="truncate text-xs font-bold uppercase tracking-wide text-slate-700">
            {title}
          </h2>
        </div>
        {to && (
          <Link
            to={to}
            className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-primary-50"
          >
            View all
          </Link>
        )}
      </div>
      <div
        className={`min-w-0 rounded-xl border border-slate-200/90 bg-white shadow-sm ${
          dense ? 'p-3' : 'p-4'
        }`}
      >
        {children}
      </div>
    </section>
  )
}
