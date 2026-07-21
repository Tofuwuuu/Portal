import type { ReactNode } from 'react'
import type { Assignment } from '../types'
import {
  getAssignmentStatus,
  getStatusBadgeClass,
  getStatusLabel,
} from '../utils/assignmentStatus'
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
  showSubmissionStatus?: boolean
  onClick?: () => void
}

export default function AssignmentCard({
  assignment,
  actions,
  showSubmissionStatus = true,
  onClick,
}: AssignmentCardProps) {
  const due = new Date(assignment.due_date + 'T00:00:00')
  const isOverdue = due < new Date(new Date().toDateString())
  const mySubmission = assignment.my_submission
  const status = getAssignmentStatus(assignment)

  return (
    <Card
      title={assignment.title}
      icon={<ClipboardIcon />}
      onClick={onClick}
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
          {showSubmissionStatus && status !== 'not_submitted' && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(status)}`}
            >
              {getStatusLabel(status)}
            </span>
          )}
          {showSubmissionStatus && status === 'not_submitted' && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              Not submitted
            </span>
          )}
          {typeof assignment.submission_count === 'number' &&
            assignment.submission_count > 0 && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                {assignment.submission_count} submission
                {assignment.submission_count === 1 ? '' : 's'}
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
      <p className="line-clamp-2">{assignment.description}</p>
      {mySubmission?.note && (
        <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          Your note: {mySubmission.note}
        </p>
      )}
      {mySubmission?.file_name && (
        <p className="mt-2 text-xs font-medium text-primary">File: {mySubmission.file_name}</p>
      )}
      {mySubmission?.grade != null && (
        <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2">
          <p className="text-xs font-semibold text-blue-800">Grade: {mySubmission.grade}/100</p>
          {mySubmission.feedback && (
            <p className="mt-1 text-xs text-slate-600">{mySubmission.feedback}</p>
          )}
        </div>
      )}
      {actions && (
        <div className="mt-3 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </Card>
  )
}
