import { useCallback, useEffect, useState } from 'react'
import { activitiesApi } from '../api/client'
import ActivityCard from '../components/ActivityCard'
import ActivityDetailModal from '../components/ActivityDetailModal'
import CreateForm from '../components/CreateForm'
import EditItemModal from '../components/EditItemModal'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'
import PageLayout from '../components/PageLayout'
import { useAuth } from '../context/AuthContext'
import type { Activity } from '../types'

export default function Activities() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  const [editing, setEditing] = useState<Activity | null>(null)
  const [selected, setSelected] = useState<Activity | null>(null)

  const loadActivities = useCallback(async () => {
    const { data } = await activitiesApi.list(showArchived)
    setActivities(data)
    setLoading(false)
  }, [showArchived])

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

  const handleEdit = async (activity: Activity, values: Record<string, string>) => {
    await activitiesApi.update(activity.id, {
      title: values.title,
      description: values.description,
      date: values.date,
    })
    await loadActivities()
  }

  const handleDelete = async (activity: Activity) => {
    if (!window.confirm(`Delete "${activity.title}"?`)) return
    await activitiesApi.remove(activity.id)
    await loadActivities()
  }

  const handlePublishToggle = async (activity: Activity) => {
    if (activity.is_published) {
      await activitiesApi.unpublish(activity.id)
    } else {
      await activitiesApi.publish(activity.id)
    }
    await loadActivities()
  }

  const handleArchiveToggle = async (activity: Activity) => {
    if (activity.is_archived) {
      await activitiesApi.unarchive(activity.id)
    } else {
      await activitiesApi.archive(activity.id)
    }
    await loadActivities()
  }

  return (
    <PageLayout>
      {user?.role === 'teacher' && (
        <label className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
          />
          Show archived
        </label>
      )}

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
            <ActivityCard
              key={a.id}
              activity={a}
              onClick={() => setSelected(a)}
              actions={
                user?.role === 'teacher' ? (
                  <>
                    <button className="btn-primary" onClick={() => setEditing(a)}>
                      Edit
                    </button>
                    <button className="btn-primary" onClick={() => handlePublishToggle(a)}>
                      {a.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button className="btn-primary" onClick={() => handleArchiveToggle(a)}>
                      {a.is_archived ? 'Unarchive' : 'Archive'}
                    </button>
                    <button
                      className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                      onClick={() => handleDelete(a)}
                    >
                      Delete
                    </button>
                  </>
                ) : undefined
              }
            />
          ))}
        </div>
      )}
      <ActivityDetailModal activity={selected} onClose={() => setSelected(null)} />
      <EditItemModal
        isOpen={Boolean(editing)}
        title="Edit Activity"
        fields={[
          { name: 'title', label: 'Title' },
          { name: 'description', label: 'Description', type: 'textarea' },
          { name: 'date', label: 'Date', type: 'date' },
        ]}
        initialValues={
          editing
            ? {
                title: editing.title,
                description: editing.description,
                date: editing.date,
              }
            : {}
        }
        onClose={() => setEditing(null)}
        onSave={(values) => (editing ? handleEdit(editing, values) : Promise.resolve())}
      />
    </PageLayout>
  )
}
