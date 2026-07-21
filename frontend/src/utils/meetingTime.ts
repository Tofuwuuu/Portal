import type { Meeting } from '../types'

export function formatMeetingTimeLabel(meeting: Meeting): string {
  if (meeting.time_status === 'ended') return 'Ended'
  if (meeting.time_status === 'live') return 'Live now'

  const starts = new Date(meeting.starts_at)
  const now = new Date()
  const diffMs = starts.getTime() - now.getTime()
  const diffMins = Math.round(diffMs / 60000)

  if (diffMins < 60) {
    if (diffMins <= 1) return 'Starts soon'
    return `Starts in ${diffMins}m`
  }

  const diffHours = Math.round(diffMins / 60)
  if (diffHours < 24) {
    return diffHours === 1 ? 'Starts in 1h' : `Starts in ${diffHours}h`
  }

  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (
    starts.getDate() === tomorrow.getDate() &&
    starts.getMonth() === tomorrow.getMonth() &&
    starts.getFullYear() === tomorrow.getFullYear()
  ) {
    return 'Starts tomorrow'
  }

  return starts.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function meetingTimeBadgeClass(meeting: Meeting): string {
  switch (meeting.time_status) {
    case 'live':
      return 'bg-red-50 text-red-700'
    case 'upcoming':
      return 'bg-primary-50 text-primary'
    case 'ended':
      return 'bg-slate-100 text-slate-500'
  }
}

export function canJoinMeeting(meeting: Meeting): boolean {
  return meeting.time_status === 'live'
}
