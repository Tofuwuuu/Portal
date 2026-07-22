import { useEffect, useMemo, useState } from 'react'
import { activitiesApi, assignmentsApi, meetingsApi } from '../api/client'
import ActivityDetailModal from '../components/ActivityDetailModal'
import AssignmentDetailModal from '../components/AssignmentDetailModal'
import DashboardSection from '../components/DashboardSection'
import {
  CompactActivityRow,
  CompactAssignmentRow,
  CompactMeetingRow,
} from '../components/DashboardRows'
import DashboardStats from '../components/DashboardStats'
import DateStrip from '../components/DateStrip'
import LoadingSpinner from '../components/LoadingSpinner'
import PageLayout from '../components/PageLayout'
import StatusBadge from '../components/StatusBadge'
import SubmitAssignmentModal from '../components/SubmitAssignmentModal'
import { CalendarIcon, ClipboardIcon, ClockIcon } from '../components/icons'
import { useAuth } from '../context/AuthContext'
import type { Activity, Assignment, Meeting } from '../types'
import { getAssignmentStatus } from '../utils/assignmentStatus'

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

function dateKeyFromDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dateKeyFromIso(value: string) {
  return dateKeyFromDate(new Date(value))
}

function sortByDueDate(a: Assignment, b: Assignment) {
  return parseDueDate(a.due_date).getTime() - parseDueDate(b.due_date).getTime()
}

function sortByStart(a: Meeting, b: Meeting) {
  return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
}

function CompactEmpty({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
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
    setAllAssignments(assignRes.data)
    setTotalAssignments(assignRes.data.length)
  }

  useEffect(() => {
    Promise.all([activitiesApi.list(), assignmentsApi.list(), meetingsApi.list()])
      .then(([actRes, assignRes, meetRes]) => {
        setActivities(actRes.data)
        setAllAssignments(assignRes.data)
        setMeetings(meetRes.data)
        setTotalActivities(actRes.data.length)
        setTotalAssignments(assignRes.data.length)
      })
      .finally(() => setLoading(false))
  }, [])

  const activeAssignments = useMemo(
    () => allAssignments.filter((a) => a.is_published && !a.is_archived),
    [allAssignments]
  )

  const { dueThisWeek, overdue } = useMemo(() => {
    const today = startOfToday()
    const weekEnd = endOfWeek()

    return {
      overdue: activeAssignments.filter((a) => parseDueDate(a.due_date) < today),
      dueThisWeek: activeAssignments.filter((a) => {
        const due = parseDueDate(a.due_date)
        return due >= today && due <= weekEnd
      }),
    }
  }, [activeAssignments])

  const upcomingAssignments = useMemo(() => {
    const today = startOfToday()
    return activeAssignments
      .filter((a) => parseDueDate(a.due_date) >= today)
      .slice()
      .sort(sortByDueDate)
  }, [activeAssignments])

  const upcomingMeetings = useMemo(
    () =>
      meetings
        .filter((m) => m.is_active && m.time_status !== 'ended')
        .slice()
        .sort(sortByStart),
    [meetings]
  )

  const scheduleCounts = useMemo(() => {
    const counts: Record<string, { activities: number; assignments: number; meetings: number }> = {}
    const ensure = (key: string) => {
      counts[key] ||= { activities: 0, assignments: 0, meetings: 0 }
      return counts[key]
    }

    activities
      .filter((activity) => !activity.is_archived)
      .forEach((activity) => {
        ensure(activity.date).activities += 1
      })

    activeAssignments.forEach((assignment) => {
      ensure(assignment.due_date).assignments += 1
    })

    upcomingMeetings.forEach((meeting) => {
      ensure(dateKeyFromIso(meeting.starts_at)).meetings += 1
    })

    return counts
  }, [activities, activeAssignments, upcomingMeetings])

  const completedAssignments = activeAssignments.filter(
    (assignment) => getAssignmentStatus(assignment) === 'graded'
  )

  return (
    <PageLayout>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-5">
          <DashboardStats
            stats={[
              {
                label: 'Activities',
                value: totalActivities,
                icon: <CalendarIcon className="h-5 w-5" />,
                tone: 'blue',
              },
              {
                label: 'Assignments',
                value: totalAssignments,
                icon: <ClipboardIcon className="h-5 w-5" />,
                tone: 'green',
              },
              {
                label: 'Due this week',
                value: dueThisWeek.length,
                icon: <ClockIcon className="h-5 w-5" />,
                tone: 'orange',
              },
              {
                label: 'Overdue',
                value: overdue.length,
                icon: <ClipboardIcon className="h-5 w-5" />,
                tone: 'red',
              },
            ]}
          />

          <DateStrip counts={scheduleCounts} />

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              <DashboardSection title="Upcoming Meetings" to="/meetings">
                {upcomingMeetings.length === 0 ? (
                  <CompactEmpty
                    title="No upcoming meetings"
                    description="Live and upcoming meetings will appear here."
                  />
                ) : (
                  <div className="space-y-3">
                    {upcomingMeetings.slice(0, 4).map((meeting) => (
                      <CompactMeetingRow key={meeting.id} meeting={meeting} />
                    ))}
                  </div>
                )}
              </DashboardSection>

              <DashboardSection title="Due This Week" to="/assignments">
                {dueThisWeek.length === 0 ? (
                  <CompactEmpty
                    title="No due dates this week"
                    description="Assignments due in the next 7 days will show here."
                  />
                ) : (
                  <div className="space-y-3">
                    {dueThisWeek
                      .slice()
                      .sort(sortByDueDate)
                      .slice(0, 4)
                      .map((assignment) => (
                        <CompactAssignmentRow
                          key={assignment.id}
                          assignment={assignment}
                          onClick={() => setSelectedAssignment(assignment)}
                        />
                      ))}
                  </div>
                )}
              </DashboardSection>

              <DashboardSection title="Recent Activities" to="/activities">
                {activities.length === 0 ? (
                  <CompactEmpty
                    title="No activities yet"
                    description="School events will appear here when posted."
                  />
                ) : (
                  <div className="space-y-3">
                    {activities.slice(0, 4).map((activity) => (
                      <CompactActivityRow
                        key={activity.id}
                        activity={activity}
                        onClick={() => setSelectedActivity(activity)}
                      />
                    ))}
                  </div>
                )}
              </DashboardSection>
            </div>

            <aside className="space-y-5">
              <DashboardSection title="Upcoming" to="/assignments">
                <div className="space-y-3">
                  {upcomingMeetings[0] ? (
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-2 px-1">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Next meeting
                        </p>
                        <StatusBadge tone="blue">{upcomingMeetings[0].time_status}</StatusBadge>
                      </div>
                      <CompactMeetingRow meeting={upcomingMeetings[0]} />
                    </div>
                  ) : (
                    <CompactEmpty
                      title="No next meeting"
                      description="Scheduled meetings will show here."
                    />
                  )}

                  {upcomingAssignments[0] && (
                    <div>
                      <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Next assignment
                      </p>
                      <CompactAssignmentRow
                        assignment={upcomingAssignments[0]}
                        onClick={() => setSelectedAssignment(upcomingAssignments[0])}
                      />
                    </div>
                  )}
                </div>
              </DashboardSection>

              <DashboardSection title="Assignment Overview" to="/assignments">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xl font-bold text-slate-950">{activeAssignments.length}</p>
                    <p className="text-xs font-medium text-slate-500">Active</p>
                  </div>
                  <div className="rounded-xl bg-orange-50 p-3">
                    <p className="text-xl font-bold text-orange-700">{dueThisWeek.length}</p>
                    <p className="text-xs font-medium text-orange-700">Due this week</p>
                  </div>
                  <div className="rounded-xl bg-red-50 p-3">
                    <p className="text-xl font-bold text-red-700">{overdue.length}</p>
                    <p className="text-xs font-medium text-red-700">Overdue</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3">
                    <p className="text-xl font-bold text-emerald-700">
                      {completedAssignments.length}
                    </p>
                    <p className="text-xs font-medium text-emerald-700">Completed</p>
                  </div>
                </div>
              </DashboardSection>

              <DashboardSection title="Needs Attention" to="/assignments">
                {overdue.length === 0 ? (
                  <CompactEmpty
                    title="Nothing overdue"
                    description="You're all caught up on past due dates."
                  />
                ) : (
                  <div className="space-y-3">
                    {overdue
                      .slice()
                      .sort(sortByDueDate)
                      .slice(0, 3)
                      .map((assignment) => (
                        <CompactAssignmentRow
                          key={assignment.id}
                          assignment={assignment}
                          onClick={() => setSelectedAssignment(assignment)}
                        />
                      ))}
                  </div>
                )}
              </DashboardSection>
            </aside>
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
