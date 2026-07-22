import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { meetingsApi } from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import PageLayout from '../components/PageLayout'
import { useAuth } from '../context/AuthContext'
import type { Meeting } from '../types'
import { canJoinMeeting, formatMeetingTimeLabel, meetingTimeBadgeClass } from '../utils/meetingTime'

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function JoinMeeting() {
  const { id } = useParams()
  const { user } = useAuth()
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const meetingId = Number(id)
    if (!meetingId) {
      setError('Invalid meeting')
      setLoading(false)
      return
    }

    meetingsApi
      .get(meetingId)
      .then(({ data }) => setMeeting(data))
      .catch(() => setError('Meeting not found or has ended.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <PageLayout title="Meetings" subtitle="Loading meeting details.">
        <LoadingSpinner />
      </PageLayout>
    )
  }

  if (error || !meeting) {
    return (
      <PageLayout title="Unable to join" subtitle="The meeting could not be opened.">
        <div className="mx-auto max-w-lg py-16 text-center">
          <h1 className="text-xl font-semibold text-slate-900">Unable to join</h1>
          <p className="mt-2 text-sm text-slate-500">{error || 'Meeting unavailable.'}</p>
          <Link to="/meetings" className="btn-primary mt-6 inline-flex">
            Back to Meetings
          </Link>
        </div>
      </PageLayout>
    )
  }

  if (!meeting.is_active && user?.role !== 'teacher') {
    return (
      <PageLayout title="Meeting ended" subtitle="This meeting is no longer available.">
        <div className="mx-auto max-w-lg py-16 text-center">
          <h1 className="text-xl font-semibold text-slate-900">Meeting ended</h1>
          <p className="mt-2 text-sm text-slate-500">This meeting is no longer available.</p>
          <Link to="/meetings" className="btn-primary mt-6 inline-flex">
            Back to Meetings
          </Link>
        </div>
      </PageLayout>
    )
  }

  if (user?.role !== 'teacher' && !canJoinMeeting(meeting)) {
    return (
      <PageLayout title="Not live yet" subtitle="Check the meeting schedule for the start time.">
        <div className="mx-auto max-w-lg py-16 text-center">
          <h1 className="text-xl font-semibold text-slate-900">Not live yet</h1>
          <p className="mt-2 text-sm text-slate-500">
            This meeting has not started or has already ended. Check the Meetings page for the
            schedule.
          </p>
          <Link to="/meetings" className="btn-primary mt-6 inline-flex">
            Back to Meetings
          </Link>
        </div>
      </PageLayout>
    )
  }

  const timeLabel = formatMeetingTimeLabel(meeting)

  return (
    <PageLayout title={meeting.title} subtitle="Meeting room">
      <div className="mx-auto max-w-2xl">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="border-b border-slate-100 bg-primary-50/50 px-6 py-5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${meetingTimeBadgeClass(meeting)}`}
              >
                {timeLabel}
              </span>
              {meeting.duration_minutes > 0 && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {meeting.duration_minutes} min
                </span>
              )}
            </div>
            <h1 className="mt-3 text-2xl font-bold text-slate-900">{meeting.title}</h1>
            {meeting.creator_name && (
              <p className="mt-1 text-sm text-slate-500">Hosted by {meeting.creator_name}</p>
            )}
          </div>

          <div className="space-y-5 p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Starts at
              </p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {formatDateTime(meeting.starts_at)}
              </p>
            </div>

            {meeting.description ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Description
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {meeting.description}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No additional details for this meeting.</p>
            )}

            <div className="flex justify-end border-t border-slate-100 pt-4">
              <Link to="/meetings" className="btn-primary">
                Back to Meetings
              </Link>
            </div>
          </div>
        </article>
      </div>
    </PageLayout>
  )
}
