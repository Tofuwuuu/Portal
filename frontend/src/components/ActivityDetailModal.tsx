import type { Activity } from '../types'
import { CalendarIcon, SparklesIcon } from './icons'

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

interface ActivityDetailModalProps {
  activity: Activity | null
  onClose: () => void
}

export default function ActivityDetailModal({ activity, onClose }: ActivityDetailModalProps) {
  if (!activity) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 border-b border-slate-100 bg-primary-50/50 px-5 py-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
            <SparklesIcon />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-primary">Activity</p>
            <h3 className="text-lg font-semibold text-slate-900">{activity.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-white"
          >
            Close
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary">
              <CalendarIcon className="h-3.5 w-3.5" />
              {formatDate(activity.date)}
            </span>
            {!activity.is_published && (
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-600">
                Unpublished
              </span>
            )}
            {activity.is_archived && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                Archived
              </span>
            )}
            {activity.is_published && !activity.is_archived && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                Published
              </span>
            )}
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Description
            </p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {activity.description}
            </p>
          </div>

          <div className="grid gap-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Posted by</p>
              <p className="mt-1 font-medium text-slate-800">
                {activity.creator_name || 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Created
              </p>
              <p className="mt-1 font-medium text-slate-800">
                {formatDateTime(activity.created_at)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Event date
              </p>
              <p className="mt-1 font-medium text-slate-800">{formatDate(activity.date)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</p>
              <p className="mt-1 font-medium text-slate-800">
                {activity.is_archived
                  ? 'Archived'
                  : activity.is_published
                    ? 'Published'
                    : 'Unpublished'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
