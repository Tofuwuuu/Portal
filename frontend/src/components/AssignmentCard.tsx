import type { Assignment } from '../types'
import Card from './Card'

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function AssignmentCard({ assignment }: { assignment: Assignment }) {
  const due = new Date(assignment.due_date + 'T00:00:00')
  const isOverdue = due < new Date(new Date().toDateString())

  return (
    <Card
      title={assignment.title}
      footer={assignment.creator_name ? `Assigned by ${assignment.creator_name}` : undefined}
    >
      <p className="mb-2">{assignment.description}</p>
      <p className={`font-medium ${isOverdue ? 'text-red-600' : 'text-primary-light'}`}>
        Due: {formatDate(assignment.due_date)}
        {isOverdue && ' (Overdue)'}
      </p>
    </Card>
  )
}
