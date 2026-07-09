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

export default function ActivityCard({ activity }: { activity: Activity }) {
  return (
    <Card
      title={activity.title}
      icon={<SparklesIcon />}
      badge={
        <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary">
          <CalendarIcon className="h-3.5 w-3.5" />
          {formatDate(activity.date)}
        </span>
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
    </Card>
  )
}
