import { Link } from 'react-router-dom'
import type { Activity, Assignment, Meeting } from '../types'
import {
  getAssignmentStatus,
  getStatusLabel,
} from '../utils/assignmentStatus'
import { canJoinMeeting, formatMeetingTimeLabel } from '../utils/meetingTime'
import { CalendarIcon, ChevronRightIcon, ClockIcon, VideoIcon } from './icons'
import StatusBadge from './StatusBadge'

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function formatMeetingDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function formatMeetingTime(value: string) {
  return new Date(value).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function assignmentBadge(assignment: Assignment) {
  if (assignment.is_archived) return { label: 'Archived', tone: 'slate' as const }
  if (!assignment.is_published) return { label: 'Unpublished', tone: 'amber' as const }
  if (getAssignmentStatus(assignment) === 'graded') return { label: 'Completed', tone: 'green' as const }

  const today = new Date(new Date().toDateString())
  const due = new Date(assignment.due_date + 'T00:00:00')
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / 86400000)

  if (diffDays < 0) return { label: 'Overdue', tone: 'red' as const }
  if (diffDays <= 3) return { label: 'Due soon', tone: 'orange' as const }
  return { label: 'Active', tone: 'blue' as const }
}

function meetingBadge(meeting: Meeting) {
  if (meeting.time_status === 'live') return { label: 'Live', tone: 'red' as const }
  if (meeting.time_status === 'ended') return { label: 'Completed', tone: 'slate' as const }
  return { label: 'Upcoming', tone: 'blue' as const }
}

const assignmentAccent: Record<ReturnType<typeof assignmentBadge>['tone'], string> = {
  amber: 'border-l-amber-400 bg-amber-50/20',
  blue: 'border-l-blue-400 bg-blue-50/20',
  green: 'border-l-emerald-400 bg-emerald-50/20',
  orange: 'border-l-orange-400 bg-orange-50/20',
  red: 'border-l-red-400 bg-red-50/20',
  slate: 'border-l-slate-300 bg-slate-50/40',
}

interface CompactMeetingRowProps {
  meeting: Meeting
}

export function CompactMeetingRow({ meeting }: CompactMeetingRowProps) {
  const status = meetingBadge(meeting)
  const isLive = meeting.time_status === 'live'

  return (
    <div
      className={`group flex flex-col gap-3 rounded-lg border px-4 py-3 transition hover:-translate-y-0.5 sm:flex-row sm:items-center ${
        isLive
          ? 'border-red-200/80 bg-red-50/30 ring-1 ring-red-100/80'
          : 'border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-white hover:shadow-sm'
      }`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
            isLive ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
          }`}
        >
          <VideoIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-bold text-slate-950">{meeting.title}</h3>
            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-slate-500">
            <span className="inline-flex items-center gap-1">
              <CalendarIcon className="h-3.5 w-3.5" />
              {formatMeetingDate(meeting.starts_at)}
            </span>
            <span className="inline-flex items-center gap-1">
              <ClockIcon className="h-3.5 w-3.5" />
              {formatMeetingTime(meeting.starts_at)}
            </span>
            {meeting.duration_minutes > 0 && <span>{meeting.duration_minutes} min</span>}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {meeting.creator_name ? `Hosted by ${meeting.creator_name}` : formatMeetingTimeLabel(meeting)}
          </p>
        </div>
      </div>
      {canJoinMeeting(meeting) ? (
        <Link
          to={`/meetings/${meeting.id}/join`}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-white shadow-sm transition hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light/40"
        >
          Join
        </Link>
      ) : (
        <ChevronRightIcon className="hidden h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-primary sm:block" />
      )}
    </div>
  )
}

interface CompactAssignmentRowProps {
  assignment: Assignment
  onClick?: () => void
}

export function CompactAssignmentRow({ assignment, onClick }: CompactAssignmentRowProps) {
  const status = assignmentBadge(assignment)
  const submissionStatus = getAssignmentStatus(assignment)

  return (
    <article
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      className={`group rounded-lg border border-l-4 border-slate-100 bg-slate-50/50 px-4 py-3 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white hover:shadow-sm ${assignmentAccent[status.tone]} ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-bold text-slate-950">{assignment.title}</h3>
            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
          </div>
          <p className="mt-1 line-clamp-1 text-xs leading-5 text-slate-500">{assignment.description}</p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-slate-500">
            <span className="inline-flex items-center gap-1">
              <CalendarIcon className="h-3.5 w-3.5" />
              Due {formatDate(assignment.due_date)}
            </span>
            {assignment.creator_name && <span>Teacher: {assignment.creator_name}</span>}
            {typeof assignment.submission_count === 'number' && (
              <span>
                {assignment.submission_count} submission
                {assignment.submission_count === 1 ? '' : 's'}
              </span>
            )}
            {assignment.my_submission && <span>{getStatusLabel(submissionStatus)}</span>}
          </div>
        </div>
        <ChevronRightIcon className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-primary" />
      </div>
    </article>
  )
}

interface CompactActivityRowProps {
  activity: Activity
  onClick?: () => void
}

export function CompactActivityRow({ activity, onClick }: CompactActivityRowProps) {
  return (
    <article
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      className={`group rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white hover:shadow-sm ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <CalendarIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-bold text-slate-950">{activity.title}</h3>
              {!activity.is_published && <StatusBadge tone="amber">Unpublished</StatusBadge>}
              {activity.is_archived && <StatusBadge tone="slate">Archived</StatusBadge>}
            </div>
            <p className="mt-1 line-clamp-1 text-xs leading-5 text-slate-500">{activity.description}</p>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-slate-500">
              <span>{formatDate(activity.date)}</span>
              {activity.creator_name && <span>Posted by {activity.creator_name}</span>}
            </div>
          </div>
        </div>
        <ChevronRightIcon className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-primary" />
      </div>
    </article>
  )
}
