import { useCallback, useEffect, useState } from 'react'
import { activitiesApi } from '../api/client'
import ActivityCard from '../components/ActivityCard'
import CreateForm from '../components/CreateForm'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'
import PageLayout from '../components/PageLayout'
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
    <PageLayout>
      <PageHeader
        title="Activities"
        description="School events, fairs, and announcements."
      />

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
        <LoadingSpinner />
      ) : activities.length === 0 ? (
        <EmptyState
          title="No activities posted yet"
          description="When teachers add events, they will show up here."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {activities.map((a) => (
            <ActivityCard key={a.id} activity={a} />
          ))}
        </div>
      )}
    </PageLayout>
  )
}
