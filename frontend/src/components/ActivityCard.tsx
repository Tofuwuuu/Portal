import type { ReactNode } from 'react'
import type { Activity } from '../types'
import Card from './Card'
import { CalendarIcon, SparklesIcon } from './icons'

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

interface ActivityCardProps {
  activity: Activity
  actions?: ReactNode
}

export default function ActivityCard({ activity, actions }: ActivityCardProps) {
  return (
    <Card
      title={activity.title}
      icon={<SparklesIcon />}
      badge={
        <div className="flex flex-wrap items-center gap-2">
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
        </div>
      }
      footer={
        activity.creator_name ? (
          <>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary-light" />
            Posted by {activity.creator_name}
          </>
        ) : undefined
      }
    >
      <p>{activity.description}</p>
      {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
    </Card>
  )
}
