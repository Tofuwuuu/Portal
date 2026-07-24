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
import SubmitAssignmentModal from '../components/SubmitAssignmentModal'
import { Link } from 'react-router-dom'
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

function CompactEmpty({
  title,
  description,
  compact = false,
}: {
  title: string
  description: string
  compact?: boolean
}) {
  if (compact) {
    return (
      <p className="py-2 text-center text-sm leading-relaxed text-slate-500">
        <span className="font-semibold text-slate-700">{title}</span>
        <span className="mx-1">·</span>
        {description}
      </p>
    )
  }

  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-5 text-center">
      <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
        <ClipboardIcon className="h-4 w-4" />
      </div>
      <p className="text-sm font-bold text-slate-700">{title}</p>
      <p className="mt-0.5 text-xs text-slate-500">{description}</p>
    </div>
  )
}

function OverviewTile({
  label,
  value,
  className,
}: {
  label: string
  value: number
  className: string
}) {
  return (
    <div className={`rounded-lg border p-3 ${className}`}>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase">{label}</p>
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

  const liveMeeting = upcomingMeetings.find((m) => m.time_status === 'live')
  const meetingsForList = liveMeeting
    ? upcomingMeetings.filter((m) => m.id !== liveMeeting.id)
    : upcomingMeetings

  const nextAssignment = upcomingAssignments[0]
  const priorityAssignment = overdue[0] ?? nextAssignment

  return (
    <PageLayout>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-6">
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

          {liveMeeting && (
            <section className="overflow-hidden rounded-xl border border-red-200 bg-gradient-to-br from-red-50 via-white to-white p-1 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-100/80 px-4 py-2">
                <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                  Live now — join meeting
                </p>
                <Link
                  to={`/meetings/${liveMeeting.id}/join`}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Open classroom
                </Link>
              </div>
              <div className="p-3">
                <CompactMeetingRow meeting={liveMeeting} />
              </div>
            </section>
          )}

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)]">
            <div className="flex min-w-0 flex-col gap-6">
              <DashboardSection title="Upcoming Meetings" to="/meetings">
                {meetingsForList.length === 0 ? (
                  <CompactEmpty
                    compact={Boolean(liveMeeting)}
                    title="No other meetings scheduled"
                    description={
                      liveMeeting
                        ? 'Your live session is highlighted above.'
                        : 'Live and upcoming meetings will appear here.'
                    }
                  />
                ) : (
                  <div className="space-y-2.5">
                    {meetingsForList.slice(0, 4).map((meeting) => (
                      <CompactMeetingRow key={meeting.id} meeting={meeting} />
                    ))}
                  </div>
                )}
              </DashboardSection>

              <div className="grid min-w-0 gap-6 md:grid-cols-2">
                <DashboardSection title="Due This Week" to="/assignments" dense>
                  {dueThisWeek.length === 0 ? (
                    <CompactEmpty
                      compact
                      title="Nothing due this week"
                      description="New due dates will show here."
                    />
                  ) : (
                    <div className="space-y-2.5">
                      {dueThisWeek
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

                <DashboardSection title="Recent Activities" to="/activities" dense>
                  {activities.length === 0 ? (
                    <CompactEmpty
                      compact
                      title="No activities yet"
                      description="Events will appear when posted."
                    />
                  ) : (
                    <div className="space-y-2.5">
                      {activities.slice(0, 3).map((activity) => (
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
            </div>

            <aside className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pb-2">
              <DashboardSection title="Focus Queue" to="/assignments">
                {priorityAssignment ? (
                  <div className="space-y-2">
                    <p className="px-0.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                      {overdue.length > 0 ? 'Most urgent' : 'Next up'}
                    </p>
                    <CompactAssignmentRow
                      assignment={priorityAssignment}
                      onClick={() => setSelectedAssignment(priorityAssignment)}
                    />
                    {nextAssignment &&
                      priorityAssignment.id !== nextAssignment.id &&
                      overdue.length > 0 && (
                        <>
                          <p className="pt-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                            Next due
                          </p>
                          <CompactAssignmentRow
                            assignment={nextAssignment}
                            onClick={() => setSelectedAssignment(nextAssignment)}
                          />
                        </>
                      )}
                  </div>
                ) : (
                  <CompactEmpty
                    compact
                    title="All clear"
                    description="No assignments need action right now."
                  />
                )}
              </DashboardSection>

              <DashboardSection title="Assignment Overview" to="/assignments" dense>
                <div className="grid grid-cols-2 gap-2.5">
                  <OverviewTile
                    label="Active"
                    value={activeAssignments.length}
                    className="border-slate-200 bg-slate-50 text-slate-700"
                  />
                  <OverviewTile
                    label="Due this week"
                    value={dueThisWeek.length}
                    className="border-orange-100 bg-orange-50 text-orange-700"
                  />
                  <OverviewTile
                    label="Overdue"
                    value={overdue.length}
                    className="border-red-100 bg-red-50 text-red-700"
                  />
                  <OverviewTile
                    label="Completed"
                    value={completedAssignments.length}
                    className="border-emerald-100 bg-emerald-50 text-emerald-700"
                  />
                </div>
              </DashboardSection>

              {overdue.length > 0 && (
                <DashboardSection title="Needs Attention" to="/assignments" dense>
                  <div className="space-y-2.5">
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
                </DashboardSection>
              )}
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
