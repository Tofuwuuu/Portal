import { useCallback, useEffect, useState } from 'react'
import { assignmentsApi } from '../api/client'
import AssignmentCard from '../components/AssignmentCard'
import CreateForm from '../components/CreateForm'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'
import PageLayout from '../components/PageLayout'
import { useAuth } from '../context/AuthContext'
import type { Assignment } from '../types'

export default function Assignments() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)

  const loadAssignments = useCallback(async () => {
    const { data } = await assignmentsApi.list(showArchived)
    setAssignments(data)
    setLoading(false)
  }, [showArchived])

  useEffect(() => {
    loadAssignments()
  }, [loadAssignments])

  const handleCreate = async (values: Record<string, string>) => {
    await assignmentsApi.create({
      title: values.title,
      description: values.description,
      due_date: values.due_date,
    })
    await loadAssignments()
  }

  const handleEdit = async (assignment: Assignment) => {
    const title = window.prompt('Edit title', assignment.title)
    if (!title) return
    const description = window.prompt('Edit description', assignment.description)
    if (!description) return
    const due_date = window.prompt('Edit due date (YYYY-MM-DD)', assignment.due_date)
    if (!due_date) return
    await assignmentsApi.update(assignment.id, { title, description, due_date })
    await loadAssignments()
  }

  const handleDelete = async (assignment: Assignment) => {
    if (!window.confirm(`Delete "${assignment.title}"?`)) return
    await assignmentsApi.remove(assignment.id)
    await loadAssignments()
  }

  const handlePublishToggle = async (assignment: Assignment) => {
    if (assignment.is_published) {
      await assignmentsApi.unpublish(assignment.id)
    } else {
      await assignmentsApi.publish(assignment.id)
    }
    await loadAssignments()
  }

  const handleArchiveToggle = async (assignment: Assignment) => {
    if (assignment.is_archived) {
      await assignmentsApi.unarchive(assignment.id)
    } else {
      await assignmentsApi.archive(assignment.id)
    }
    await loadAssignments()
  }

  return (
    <PageLayout>
      <PageHeader
        title="Assignments"
        description="Homework, projects, and due dates."
      />
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
            { name: 'due_date', label: 'Due Date', type: 'date' },
            { name: 'description', label: 'Description', type: 'textarea' },
          ]}
          onSubmit={handleCreate}
          submitLabel="Add Assignment"
        />
      )}

      {loading ? (
        <LoadingSpinner />
      ) : assignments.length === 0 ? (
        <EmptyState
          title="No assignments posted yet"
          description="When teachers add homework, it will appear here."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {assignments.map((a) => (
            <AssignmentCard
              key={a.id}
              assignment={a}
              actions={
                user?.role === 'teacher' ? (
                  <>
                    <button className="btn-primary" onClick={() => handleEdit(a)}>
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
    </PageLayout>
  )
}
