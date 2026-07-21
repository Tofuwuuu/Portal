import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { activitiesApi, assignmentsApi, meetingsApi } from '../api/client'
import ActivityCard from '../components/ActivityCard'
import ActivityDetailModal from '../components/ActivityDetailModal'
import AssignmentCard from '../components/AssignmentCard'
import AssignmentDetailModal from '../components/AssignmentDetailModal'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'
import MeetingCard from '../components/MeetingCard'
import PageLayout from '../components/PageLayout'
import SubmitAssignmentModal from '../components/SubmitAssignmentModal'
import { CalendarIcon, ClipboardIcon, VideoIcon } from '../components/icons'
import { useAuth } from '../context/AuthContext'
import type { Activity, Assignment, Meeting } from '../types'
import { canJoinMeeting } from '../utils/meetingTime'

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfWeek() {
  const d = startOfToday()
  d.setDate(d.getDate() + 7)
  return d
}

function parseDueDate(value: string) {
  return new Date(value + 'T00:00:00')
}

export default function Dashboard() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [totalActivities, setTotalActivities] = useState(0)
  const [totalAssignments, setTotalAssignments] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [submitting, setSubmitting] = useState<Assignment | null>(null)

  const reloadAssignments = async () => {
    const assignRes = await assignmentsApi.list()
    setAssignments(assignRes.data.slice(0, 3))
    setAllAssignments(assignRes.data)
    setTotalAssignments(assignRes.data.length)
  }

  useEffect(() => {
    Promise.all([activitiesApi.list(), assignmentsApi.list(), meetingsApi.list()])
      .then(([actRes, assignRes, meetRes]) => {
        setActivities(actRes.data.slice(0, 3))
        setAssignments(assignRes.data.slice(0, 3))
        setAllAssignments(assignRes.data)
        setMeetings(meetRes.data.filter((m) => m.is_active && m.time_status !== 'ended').slice(0, 3))
        setTotalActivities(actRes.data.length)
        setTotalAssignments(assignRes.data.length)
      })
      .finally(() => setLoading(false))
  }, [])

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const { dueThisWeek, overdue } = useMemo(() => {
    const today = startOfToday()
    const weekEnd = endOfWeek()
    const active = allAssignments.filter((a) => a.is_published && !a.is_archived)

    return {
      overdue: active.filter((a) => parseDueDate(a.due_date) < today),
      dueThisWeek: active.filter((a) => {
        const due = parseDueDate(a.due_date)
        return due >= today && due <= weekEnd
      }),
    }
  }, [allAssignments])

  return (
    <PageLayout>
      <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-primary-dark via-primary to-primary-light p-6 text-white shadow-lg sm:p-8">
        <p className="text-sm font-medium text-blue-100">{greeting()}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          Welcome back, {user?.full_name}
        </h1>
        <p className="mt-2 max-w-xl text-blue-100">
          Here&apos;s what&apos;s happening at school today.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalActivities}</p>
              <p className="text-xs text-blue-100">Activities</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
              <ClipboardIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalAssignments}</p>
              <p className="text-xs text-blue-100">Assignments</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
            <div>
              <p className="text-2xl font-bold">{dueThisWeek.length}</p>
              <p className="text-xs text-blue-100">Due this week</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
            <div>
              <p className="text-2xl font-bold">{overdue.length}</p>
              <p className="text-xs text-blue-100">Overdue</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-8">
          {meetings.length > 0 && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <VideoIcon className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-slate-900">Upcoming Meetings</h2>
                </div>
                <Link to="/meetings" className="section-link">
                  View all →
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {meetings.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    actions={
                      canJoinMeeting(meeting) ? (
                        <Link to={`/meetings/${meeting.id}/join`} className="btn-primary text-sm">
                          Join
                        </Link>
                      ) : undefined
                    }
                  />
                ))}
              </div>
            </section>
          )}

          <div className="grid gap-8 lg:grid-cols-2">
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-red-600">Overdue</h2>
                <Link to="/assignments" className="section-link">
                  View all →
                </Link>
              </div>
              {overdue.length === 0 ? (
                <EmptyState
                  title="Nothing overdue"
                  description="You're all caught up on past due dates."
                />
              ) : (
                <div className="space-y-4">
                  {overdue.slice(0, 3).map((a) => (
                    <AssignmentCard
                      key={a.id}
                      assignment={a}
                      onClick={() => setSelectedAssignment(a)}
                    />
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-primary">Due this week</h2>
                <Link to="/assignments" className="section-link">
                  View all →
                </Link>
              </div>
              {dueThisWeek.length === 0 ? (
                <EmptyState
                  title="No due dates this week"
                  description="Assignments due in the next 7 days will show here."
                />
              ) : (
                <div className="space-y-4">
                  {dueThisWeek.slice(0, 3).map((a) => (
                    <AssignmentCard
                      key={a.id}
                      assignment={a}
                      onClick={() => setSelectedAssignment(a)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <section>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-slate-900">Recent Activities</h2>
                </div>
                <Link to="/activities" className="section-link">
                  View all →
                </Link>
              </div>
              {activities.length === 0 ? (
                <EmptyState
                  title="No activities yet"
                  description="School events will appear here when posted."
                />
              ) : (
                <div className="space-y-4">
                  {activities.map((a) => (
                    <ActivityCard
                      key={a.id}
                      activity={a}
                      onClick={() => setSelectedActivity(a)}
                    />
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardIcon className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-slate-900">Upcoming Assignments</h2>
                </div>
                <Link to="/assignments" className="section-link">
                  View all →
                </Link>
              </div>
              {assignments.length === 0 ? (
                <EmptyState
                  title="No assignments yet"
                  description="Homework and tasks will show up here."
                />
              ) : (
                <div className="space-y-4">
                  {assignments.map((a) => (
                    <AssignmentCard
                      key={a.id}
                      assignment={a}
                      onClick={() => setSelectedAssignment(a)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      <ActivityDetailModal
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
      />
      <AssignmentDetailModal
        assignment={selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
        canSubmit={user?.role === 'student'}
        onSubmitClick={() => {
          if (!selectedAssignment) return
          setSubmitting(selectedAssignment)
          setSelectedAssignment(null)
        }}
      />
      <SubmitAssignmentModal
        isOpen={Boolean(submitting)}
        assignment={submitting}
        onClose={() => setSubmitting(null)}
        onSubmit={async (values) => {
          if (!submitting) return
          await assignmentsApi.submit(submitting.id, values)
          await reloadAssignments()
        }}
      />
    </PageLayout>
  )
}
