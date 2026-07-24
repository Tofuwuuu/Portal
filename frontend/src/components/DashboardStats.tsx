import type { ReactNode } from 'react'

interface DashboardStat {
  label: string
  value: number
  icon: ReactNode
  tone: 'blue' | 'green' | 'orange' | 'red'
}

const toneClasses: Record<DashboardStat['tone'], string> = {
  blue: 'bg-blue-50 text-blue-700 ring-blue-100',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  orange: 'bg-orange-50 text-orange-700 ring-orange-100',
  red: 'bg-red-50 text-red-700 ring-red-100',
}

interface DashboardStatsProps {
  stats: DashboardStat[]
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card-hover"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-950">{stat.value}</p>
              <p className="mt-1 text-xs font-semibold uppercase text-slate-500">{stat.label}</p>
            </div>
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ring-1 ${toneClasses[stat.tone]}`}
            >
              {stat.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
