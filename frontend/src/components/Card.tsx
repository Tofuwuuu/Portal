import type { ReactNode } from 'react'

interface CardProps {
  title: string
  children: ReactNode
  footer?: ReactNode
}

export default function Card({ title, children, footer }: CardProps) {
  return (
    <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
      <h3 className="mb-2 text-lg font-semibold text-primary">{title}</h3>
      <div className="text-sm text-slate-600">{children}</div>
      {footer && <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400">{footer}</div>}
    </div>
  )
}
