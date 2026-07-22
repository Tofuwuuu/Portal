interface DateCounts {
  activities: number
  assignments: number
  meetings: number
}

interface DateStripProps {
  counts: Record<string, DateCounts>
}

function dateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function nearbyDates() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Array.from({ length: 10 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() + index - 2)
    return date
  })
}

export default function DateStrip({ counts }: DateStripProps) {
  const todayKey = dateKey(new Date())

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800">Schedule</h2>
          <p className="text-sm text-slate-500">Nearby dates from your current portal data</p>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {nearbyDates().map((date) => {
          const key = dateKey(date)
          const dayCounts = counts[key] || { activities: 0, assignments: 0, meetings: 0 }
          const selected = key === todayKey
          const hasItems = dayCounts.activities + dayCounts.assignments + dayCounts.meetings > 0

          return (
            <div
              key={key}
              className={`flex min-h-24 w-20 shrink-0 flex-col items-center justify-between rounded-2xl border px-3 py-3 text-center transition ${
                selected
                  ? 'border-indigo-500 bg-indigo-500 text-white shadow-sm shadow-indigo-500/25'
                  : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              <div>
                <p className={`text-xs font-semibold ${selected ? 'text-indigo-100' : 'text-slate-400'}`}>
                  {date.toLocaleDateString(undefined, { weekday: 'short' })}
                </p>
                <p className="mt-1 text-xl font-bold">{date.getDate()}</p>
              </div>
              <div className="flex min-h-2 items-center justify-center gap-1">
                {dayCounts.activities > 0 && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${selected ? 'bg-white' : 'bg-emerald-500'}`}
                    title={`${dayCounts.activities} activities`}
                  />
                )}
                {dayCounts.assignments > 0 && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${selected ? 'bg-white' : 'bg-orange-500'}`}
                    title={`${dayCounts.assignments} assignments`}
                  />
                )}
                {dayCounts.meetings > 0 && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${selected ? 'bg-white' : 'bg-blue-500'}`}
                    title={`${dayCounts.meetings} meetings`}
                  />
                )}
                {!hasItems && <span className="h-1.5 w-1.5 rounded-full bg-transparent" />}
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs font-medium text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Activities
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-orange-500" />
          Assignments
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          Meetings
        </span>
      </div>
    </section>
  )
}
