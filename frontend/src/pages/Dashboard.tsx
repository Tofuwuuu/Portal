import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { activitiesApi, assignmentsApi } from '../api/client'
import ActivityCard from '../components/ActivityCard'
import AssignmentCard from '../components/AssignmentCard'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import type { Activity, Assignment } from '../types'

export default function Dashboard() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([activitiesApi.list(), assignmentsApi.list()])
      .then(([actRes, assignRes]) => {
        setActivities(actRes.data.slice(0, 3))
        setAssignments(assignRes.data.slice(0, 3))
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary">
            Welcome, {user?.full_name}
          </h1>
          <p className="text-slate-500">
            Here&apos;s what&apos;s happening at school today.
          </p>
        </div>

        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-primary">Recent Activities</h2>
                <Link to="/activities" className="text-sm text-primary-light hover:underline">
                  View all
                </Link>
              </div>
              {activities.length === 0 ? (
                <p className="text-sm text-slate-400">No activities yet.</p>
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
                <h2 className="text-lg font-semibold text-primary">Upcoming Assignments</h2>
                <Link to="/assignments" className="text-sm text-primary-light hover:underline">
                  View all
                </Link>
              </div>
              {assignments.length === 0 ? (
                <p className="text-sm text-slate-400">No assignments yet.</p>
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
      </main>
    </div>
  )
}
