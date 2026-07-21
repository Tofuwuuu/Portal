import type { ReactNode } from 'react'
import type { Meeting } from '../types'
import { formatMeetingTimeLabel, meetingTimeBadgeClass } from '../utils/meetingTime'
import Card from './Card'
import { CalendarIcon, VideoIcon } from './icons'

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

interface MeetingCardProps {
  meeting: Meeting
  actions?: ReactNode
}

export default function MeetingCard({ meeting, actions }: MeetingCardProps) {
  const timeLabel = formatMeetingTimeLabel(meeting)

  return (
    <Card
      title={meeting.title}
      icon={<VideoIcon />}
      badge={
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary">
            <CalendarIcon className="h-3.5 w-3.5" />
            {formatDateTime(meeting.starts_at)}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${meetingTimeBadgeClass(meeting)}`}
          >
            {timeLabel}
          </span>
          {meeting.duration_minutes > 0 && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
              {meeting.duration_minutes} min
            </span>
          )}
        </div>
      }
      footer={meeting.creator_name ? <>Hosted by {meeting.creator_name}</> : undefined}
    >
      <p>{meeting.description || 'Online class meeting via video.'}</p>
      {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
    </Card>
  )
}
