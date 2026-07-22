import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

interface DashboardSectionProps {
  title: string
  to?: string
  children: ReactNode
}

export default function DashboardSection({ title, to, children }: DashboardSectionProps) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800">{title}</h2>
        {to && (
          <Link to={to} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
            View all
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}
