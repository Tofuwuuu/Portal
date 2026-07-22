import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { meetingsApi } from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import PageLayout from '../components/PageLayout'
import { useAuth } from '../context/AuthContext'
import type { Meeting } from '../types'
import { canJoinMeeting } from '../utils/meetingTime'

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

  const dailyDomain = import.meta.env.VITE_DAILY_DOMAIN as string | undefined

  const dailySrc = useMemo(() => {
    if (!meeting || !user || !dailyDomain) return ''
    const displayName = encodeURIComponent(user.full_name)
    return `https://${dailyDomain}.daily.co/${meeting.room_slug}?userName=${displayName}`
  }, [meeting, user, dailyDomain])

  if (loading) {
    return (
      <PageLayout title="Meetings" subtitle="Preparing your live classroom.">
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

  if (!dailyDomain) {
    return (
      <PageLayout title="Video not configured" subtitle="Daily.co is not set up for this app.">
        <div className="mx-auto max-w-lg py-16 text-center">
          <h1 className="text-xl font-semibold text-slate-900">Video not configured</h1>
          <p className="mt-2 text-sm text-slate-500">
            Set <code className="text-xs">VITE_DAILY_DOMAIN</code> in the frontend environment.
          </p>
          <Link to="/meetings" className="btn-primary mt-6 inline-flex">
            Back to Meetings
          </Link>
        </div>
      </PageLayout>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-700 bg-slate-900 px-4 py-3 text-white">
        <div>
          <p className="text-sm text-slate-300">Live meeting</p>
          <h1 className="font-semibold">{meeting.title}</h1>
        </div>
        <Link
          to="/meetings"
          className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20"
        >
          Leave
        </Link>
      </div>
      <iframe
        title={`Meeting: ${meeting.title}`}
        src={dailySrc}
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        className="min-h-0 w-full flex-1 border-0"
        style={{ height: 'calc(100vh - 57px)' }}
        allowFullScreen
      />
    </div>
  )
}
