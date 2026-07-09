import type { Activity } from '../types'
import Card from './Card'

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
      footer={activity.creator_name ? `Posted by ${activity.creator_name}` : undefined}
    >
      <p className="mb-2">{activity.description}</p>
      <p className="font-medium text-primary-light">Date: {formatDate(activity.date)}</p>
    </Card>
  )
}
