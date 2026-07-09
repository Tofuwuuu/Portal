import type { ReactNode } from 'react'
import type { Assignment } from '../types'
import Card from './Card'
import { CalendarIcon, ClipboardIcon } from './icons'

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

interface AssignmentCardProps {
  assignment: Assignment
  actions?: ReactNode
}

export default function AssignmentCard({ assignment, actions }: AssignmentCardProps) {
  const due = new Date(assignment.due_date + 'T00:00:00')
  const isOverdue = due < new Date(new Date().toDateString())

  return (
    <Card
      title={assignment.title}
      icon={<ClipboardIcon />}
      badge={
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isOverdue ? 'bg-red-50 text-red-600' : 'bg-primary-50 text-primary'
            }`}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {isOverdue ? 'Overdue · ' : 'Due '}
            {formatDate(assignment.due_date)}
          </span>
          {!assignment.is_published && (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-600">
              Unpublished
            </span>
          )}
          {assignment.is_archived && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              Archived
            </span>
          )}
        </div>
      }
      footer={
        assignment.creator_name ? (
          <>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary-light" />
            Assigned by {assignment.creator_name}
          </>
        ) : undefined
      }
    >
      <p>{assignment.description}</p>
      {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
    </Card>
  )
}
