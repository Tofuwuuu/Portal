import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { meetingsApi } from '../api/client'
import CreateForm from '../components/CreateForm'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'
import MeetingCard from '../components/MeetingCard'
import PageHeader from '../components/PageHeader'
import PageLayout from '../components/PageLayout'
import { useAuth } from '../context/AuthContext'
import type { Meeting } from '../types'
import { canJoinMeeting } from '../utils/meetingTime'

function toApiDateTime(localValue: string) {
  if (!localValue) return localValue
  return new Date(localValue).toISOString()
}

export default function Meetings() {
  const { user } = useAuth()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)

  const loadMeetings = useCallback(async () => {
    const { data } = await meetingsApi.list()
    setMeetings(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadMeetings()
  }, [loadMeetings])

  const handleCreate = async (values: Record<string, string>) => {
    await meetingsApi.create({
      title: values.title,
      description: values.description || '',
      starts_at: toApiDateTime(values.starts_at),
      duration_minutes: values.duration_minutes ? Number(values.duration_minutes) : 60,
    })
    await loadMeetings()
  }

  const handleEnd = async (meeting: Meeting) => {
    if (!window.confirm(`End meeting "${meeting.title}"? Students will no longer see it.`)) return
    await meetingsApi.end(meeting.id)
    await loadMeetings()
  }

  const handleDelete = async (meeting: Meeting) => {
    if (!window.confirm(`Delete "${meeting.title}"?`)) return
    await meetingsApi.remove(meeting.id)
    await loadMeetings()
  }

  return (
    <PageLayout>
      <PageHeader title="Meetings" description="Online class meetings with video." />

      {user?.role === 'teacher' && (
        <CreateForm
          fields={[
            { name: 'title', label: 'Title' },
            { name: 'starts_at', label: 'Starts at', type: 'datetime-local' },
            { name: 'duration_minutes', label: 'Duration (minutes)', type: 'number', required: false },
            { name: 'description', label: 'Description', type: 'textarea', required: false },
          ]}
          onSubmit={handleCreate}
          submitLabel="Schedule Meeting"
        />
      )}

      {loading ? (
        <LoadingSpinner />
      ) : meetings.length === 0 ? (
        <EmptyState
          title="No meetings yet"
          description={
            user?.role === 'teacher'
              ? 'Schedule a meeting so students can join the video room.'
              : 'When a teacher schedules a class meeting, it will show up here.'
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {meetings.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              actions={
                <>
                  {canJoinMeeting(meeting) && (
                    <Link to={`/meetings/${meeting.id}/join`} className="btn-primary text-sm">
                      Join
                    </Link>
                  )}
                  {user?.role === 'teacher' && meeting.is_active && meeting.time_status !== 'ended' && (
                    <button
                      type="button"
                      onClick={() => handleEnd(meeting)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      End
                    </button>
                  )}
                  {user?.role === 'teacher' && (
                    <button
                      type="button"
                      onClick={() => handleDelete(meeting)}
                      className="rounded-lg border border-red-100 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  )}
                </>
              }
            />
          ))}
        </div>
      )}
    </PageLayout>
  )
}
