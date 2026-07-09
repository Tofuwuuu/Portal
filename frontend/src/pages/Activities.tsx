import { useCallback, useEffect, useState } from 'react'
import { activitiesApi } from '../api/client'
import ActivityCard from '../components/ActivityCard'
import CreateForm from '../components/CreateForm'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import type { Activity } from '../types'

export default function Activities() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  const loadActivities = useCallback(async () => {
    const { data } = await activitiesApi.list()
    setActivities(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadActivities()
  }, [loadActivities])

  const handleCreate = async (values: Record<string, string>) => {
    await activitiesApi.create({
      title: values.title,
      description: values.description,
      date: values.date,
    })
    await loadActivities()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-primary">Activities</h1>

        {user?.role === 'teacher' && (
          <CreateForm
            fields={[
              { name: 'title', label: 'Title' },
              { name: 'date', label: 'Date', type: 'date' },
              { name: 'description', label: 'Description', type: 'textarea' },
            ]}
            onSubmit={handleCreate}
            submitLabel="Add Activity"
          />
        )}

        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : activities.length === 0 ? (
          <p className="text-slate-400">No activities posted yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activities.map((a) => (
              <ActivityCard key={a.id} activity={a} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
