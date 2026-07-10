import type { ReactNode } from 'react'

interface CardProps {
  title: string
  children: ReactNode
  footer?: ReactNode
  icon?: ReactNode
  badge?: ReactNode
  onClick?: () => void
}

export default function Card({ title, children, footer, icon, badge, onClick }: CardProps) {
  const clickable = Boolean(onClick)

  return (
    <article
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
      className={`group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-card transition duration-200 hover:border-blue-200 hover:shadow-card-hover ${
        clickable ? 'cursor-pointer' : ''
      }`}
    >
      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary-light to-primary opacity-0 transition group-hover:opacity-100" />
      <div className="flex items-start gap-4">
        {icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            {badge}
          </div>
          <div className="text-sm leading-relaxed text-slate-600">{children}</div>
          {footer && (
            <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-400">
              {footer}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
