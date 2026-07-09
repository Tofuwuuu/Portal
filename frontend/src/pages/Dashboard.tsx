import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { activitiesApi, assignmentsApi } from '../api/client'
import ActivityCard from '../components/ActivityCard'
import AssignmentCard from '../components/AssignmentCard'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'
import PageLayout from '../components/PageLayout'
import { CalendarIcon, ClipboardIcon } from '../components/icons'
import { useAuth } from '../context/AuthContext'
import type { Activity, Assignment } from '../types'

export default function Dashboard() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [totalActivities, setTotalActivities] = useState(0)
  const [totalAssignments, setTotalAssignments] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([activitiesApi.list(), assignmentsApi.list()])
      .then(([actRes, assignRes]) => {
        setActivities(actRes.data.slice(0, 3))
        setAssignments(assignRes.data.slice(0, 3))
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

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
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
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
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
                  <ActivityCard key={a.id} activity={a} />
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
                  <AssignmentCard key={a.id} assignment={a} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </PageLayout>
  )
}
