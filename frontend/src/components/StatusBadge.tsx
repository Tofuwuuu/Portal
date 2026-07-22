import type { ReactNode } from 'react'

type StatusTone = 'blue' | 'green' | 'orange' | 'red' | 'slate' | 'amber'

const toneClasses: Record<StatusTone, string> = {
  blue: 'bg-blue-50 text-blue-700 ring-blue-100',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  orange: 'bg-orange-50 text-orange-700 ring-orange-100',
  red: 'bg-red-50 text-red-700 ring-red-100',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
}

interface StatusBadgeProps {
  children: ReactNode
  tone?: StatusTone
  className?: string
}

export default function StatusBadge({
  children,
  tone = 'slate',
  className = '',
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
