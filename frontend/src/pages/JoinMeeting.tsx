import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { meetingsApi } from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
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

  const jitsiSrc = useMemo(() => {
    if (!meeting || !user) return ''
    const displayName = encodeURIComponent(user.full_name)
    return `https://meet.jit.si/${meeting.room_slug}#userInfo.displayName="${displayName}"&config.prejoinConfig.enabled=true`
  }, [meeting, user])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="p-8">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="text-xl font-semibold text-slate-900">Unable to join</h1>
          <p className="mt-2 text-sm text-slate-500">{error || 'Meeting unavailable.'}</p>
          <Link to="/meetings" className="btn-primary mt-6 inline-flex">
            Back to Meetings
          </Link>
        </div>
      </div>
    )
  }

  if (!meeting.is_active && user?.role !== 'teacher') {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="text-xl font-semibold text-slate-900">Meeting ended</h1>
          <p className="mt-2 text-sm text-slate-500">This meeting is no longer available.</p>
          <Link to="/meetings" className="btn-primary mt-6 inline-flex">
            Back to Meetings
          </Link>
        </div>
      </div>
    )
  }

  if (user?.role !== 'teacher' && !canJoinMeeting(meeting)) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="text-xl font-semibold text-slate-900">Not live yet</h1>
          <p className="mt-2 text-sm text-slate-500">
            This meeting has not started or has already ended. Check the Meetings page for the
            schedule.
          </p>
          <Link to="/meetings" className="btn-primary mt-6 inline-flex">
            Back to Meetings
          </Link>
        </div>
      </div>
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
        src={jitsiSrc}
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        className="min-h-0 w-full flex-1 border-0"
        style={{ height: 'calc(100vh - 57px)' }}
        allowFullScreen
      />
    </div>
  )
}
