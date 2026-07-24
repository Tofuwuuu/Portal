import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { meetingsApi } from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import PageLayout from '../components/PageLayout'
import PresenterPanel from '../components/meeting/PresenterPanel'
import { useAuth } from '../context/AuthContext'
import { useMeetingCall } from '../hooks/useMeetingCall'
import type { Meeting } from '../types'
import { canJoinMeeting } from '../utils/meetingTime'
import type { CallStatus } from '../utils/webrtc'

function statusLabel(status: CallStatus, remoteName: string | null): string {
  switch (status) {
    case 'connecting':
      return 'Connecting… (may take longer on mobile data)'
    case 'waiting':
      return 'Waiting for the other person...'
    case 'connected':
      return remoteName ? `Connected with ${remoteName}` : 'Connected'
    case 'peer-left':
      return 'The other person left the meeting.'
    case 'error':
      return 'Connection error'
    default:
      return ''
  }
}

function MeetingCallRoom({ meeting }: { meeting: Meeting }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isTeacher = user?.role === 'teacher'
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const remoteCornerVideoRef = useRef<HTMLVideoElement>(null)
  const sharePreviewRef = useRef<HTMLVideoElement>(null)

  const {
    localStream,
    remoteStream,
    status,
    errorMessage,
    micOn,
    camOn,
    sharing,
    sharePreviewStream,
    remoteName,
    presenterState,
    toggleMic,
    toggleCam,
    startShare,
    stopShare,
    sendPresenterUpdate,
    requestPresenterSync,
    leave,
  } = useMeetingCall({ meetingId: meeting.id, enabled: true })

  const presenting = presenterState.active

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
    if (remoteCornerVideoRef.current && remoteStream) {
      remoteCornerVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  useLayoutEffect(() => {
    const el = sharePreviewRef.current
    if (!el || !sharePreviewStream) return
    el.srcObject = sharePreviewStream
    void el.play().catch(() => {})
  }, [sharePreviewStream, sharing, presenting])

  const showDesktopInMain = sharing && !presenting
  const showRemoteInMain = !presenting && !showDesktopInMain

  const handleLeave = () => {
    leave()
    navigate('/meetings')
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-700 bg-slate-900 px-4 py-3 text-white">
        <div>
          <p className="text-sm text-slate-300">Live meeting</p>
          <h1 className="font-semibold">{meeting.title}</h1>
          <p className="text-xs text-slate-400">{user?.full_name}</p>
        </div>
        <Link
          to="/meetings"
          onClick={() => leave()}
          className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20"
        >
          Leave
        </Link>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="relative min-h-0 flex-1 bg-slate-950">
          {showDesktopInMain && (
            <div className="absolute inset-0 z-10 bg-black">
              <video
                ref={sharePreviewRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-contain"
              />
              {!sharePreviewStream && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <p className="text-sm text-slate-400">Starting screen share…</p>
                </div>
              )}
              <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent px-4 py-3">
                <p className="text-sm font-medium text-white">You are sharing your screen</p>
                <p className="mt-1 max-w-2xl text-xs text-slate-300">
                  This black area shows what the other person sees. Click and type in the window,
                  tab, or monitor you chose in the browser picker — you stay on this meeting tab.
                  For a website inside the portal, use <strong className="text-white">Share lesson</strong>.
                </p>
              </div>
            </div>
          )}

          <div className={showRemoteInMain ? 'relative h-full' : 'hidden'}>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="h-full w-full object-contain bg-black"
            />
            {!remoteStream && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80">
                <p className="max-w-sm px-4 text-center text-sm text-slate-400">
                  {status === 'waiting'
                    ? 'Waiting for the other person...'
                    : 'No remote video yet'}
                </p>
              </div>
            )}
          </div>

          <div className={presenting ? 'h-full' : 'hidden'}>
            <PresenterPanel
              state={presenterState}
              isTeacher={isTeacher}
              onUpdate={sendPresenterUpdate}
            />
          </div>

          {/* Small remote camera corner, shown only while presenting so the peer's face is still visible */}
          <div
            className={`absolute bottom-4 right-56 h-28 w-36 overflow-hidden rounded-xl border-2 border-slate-600 bg-slate-800 shadow-lg ${
              (presenting && remoteStream) || (showDesktopInMain && remoteStream) ? 'block' : 'hidden'
            }`}
          >
            <video
              ref={remoteCornerVideoRef}
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
          </div>

          <div className="absolute bottom-4 right-4 h-36 w-48 overflow-hidden rounded-xl border-2 border-slate-600 bg-slate-800 shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover mirror"
            />
          </div>
        </div>

        <div className="border-t border-slate-700 bg-slate-900 px-4 py-3">
          <p className="mb-3 text-center text-sm text-slate-300">
            {errorMessage ||
              (showDesktopInMain
                ? 'Sharing desktop in the lesson area'
                : presenting && !isTeacher
                  ? "Following teacher's presentation"
                  : statusLabel(status, remoteName))}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={toggleMic}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                micOn ? 'bg-slate-700 text-white' : 'bg-red-600 text-white'
              }`}
            >
              {micOn ? 'Mute' : 'Unmute'}
            </button>
            <button
              type="button"
              onClick={toggleCam}
              disabled={sharing}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                camOn ? 'bg-slate-700 text-white' : 'bg-red-600 text-white'
              } disabled:opacity-50`}
            >
              {camOn ? 'Camera off' : 'Camera on'}
            </button>

            {isTeacher && (
              <button
                type="button"
                onClick={() => {
                  if (!presenting && sharing) {
                    void stopShare()
                  }
                  sendPresenterUpdate({ action: presenting ? 'stop' : 'start' })
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium text-white ${
                  presenting ? 'bg-amber-600 hover:bg-amber-500' : 'bg-primary hover:bg-primary-dark'
                }`}
              >
                {presenting ? 'Stop presenting' : 'Share lesson'}
              </button>
            )}

            {!presenting &&
              (sharing ? (
                <button
                  type="button"
                  onClick={() => void stopShare()}
                  className="rounded-full bg-amber-600 px-4 py-2 text-sm font-medium text-white"
                >
                  Stop share
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (presenting) {
                      sendPresenterUpdate({ action: 'stop' })
                    }
                    void startShare()
                  }}
                  className="rounded-full bg-slate-700 px-4 py-2 text-sm font-medium text-white"
                  title="Share a window, tab, or whole screen — it appears in the large area above"
                >
                  Share desktop
                </button>
              ))}

            {!isTeacher && presenting && (
              <button
                type="button"
                onClick={requestPresenterSync}
                className="rounded-full bg-slate-700 px-4 py-2 text-sm font-medium text-white"
                title="Ask for the latest slide"
              >
                Resync
              </button>
            )}

            <button
              type="button"
              onClick={handleLeave}
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white"
            >
              Leave call
            </button>
          </div>
        </div>
      </div>
    </div>
  )
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

  if (!meeting.is_active) {
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

  return <MeetingCallRoom meeting={meeting} />
}
