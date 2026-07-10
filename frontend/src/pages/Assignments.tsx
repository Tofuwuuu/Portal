import { useCallback, useEffect, useState } from 'react'
import { assignmentsApi } from '../api/client'
import AssignmentCard from '../components/AssignmentCard'
import AssignmentDetailModal from '../components/AssignmentDetailModal'
import CreateForm from '../components/CreateForm'
import EditItemModal from '../components/EditItemModal'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'
import PageLayout from '../components/PageLayout'
import SubmitAssignmentModal from '../components/SubmitAssignmentModal'
import SubmissionsPanel from '../components/SubmissionsPanel'
import { useAuth } from '../context/AuthContext'
import type { Assignment, Submission } from '../types'

export default function Assignments() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  const [editing, setEditing] = useState<Assignment | null>(null)
  const [selected, setSelected] = useState<Assignment | null>(null)
  const [submitting, setSubmitting] = useState<Assignment | null>(null)
  const [viewingSubmissions, setViewingSubmissions] = useState<Assignment | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [submissionsLoading, setSubmissionsLoading] = useState(false)

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

  const handleEdit = async (assignment: Assignment, values: Record<string, string>) => {
    await assignmentsApi.update(assignment.id, {
      title: values.title,
      description: values.description,
      due_date: values.due_date,
    })
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

  const handleSubmit = async (values: { note: string; is_done: boolean }) => {
    if (!submitting) return
    await assignmentsApi.submit(submitting.id, values)
    await loadAssignments()
  }

  const handleViewSubmissions = async (assignment: Assignment) => {
    setViewingSubmissions(assignment)
    setSubmissionsLoading(true)
    try {
      const { data } = await assignmentsApi.listSubmissions(assignment.id)
      setSubmissions(data)
    } finally {
      setSubmissionsLoading(false)
    }
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

      {viewingSubmissions && (
        <SubmissionsPanel
          assignment={viewingSubmissions}
          submissions={submissions}
          loading={submissionsLoading}
          onClose={() => {
            setViewingSubmissions(null)
            setSubmissions([])
          }}
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
              onClick={() => setSelected(a)}
              actions={
                user?.role === 'teacher' ? (
                  <>
                    <button className="btn-primary" onClick={() => setEditing(a)}>
                      Edit
                    </button>
                    <button className="btn-primary" onClick={() => handleViewSubmissions(a)}>
                      View submissions
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
                ) : user?.role === 'student' && a.is_published && !a.is_archived ? (
                  <button className="btn-primary" onClick={() => setSubmitting(a)}>
                    {a.my_submission ? 'Update submission' : 'Submit'}
                  </button>
                ) : undefined
              }
            />
          ))}
        </div>
      )}

      <AssignmentDetailModal assignment={selected} onClose={() => setSelected(null)} />

      <EditItemModal
        isOpen={Boolean(editing)}
        title="Edit Assignment"
        fields={[
          { name: 'title', label: 'Title' },
          { name: 'description', label: 'Description', type: 'textarea' },
          { name: 'due_date', label: 'Due Date', type: 'date' },
        ]}
        initialValues={
          editing
            ? {
                title: editing.title,
                description: editing.description,
                due_date: editing.due_date,
              }
            : {}
        }
        onClose={() => setEditing(null)}
        onSave={(values) => (editing ? handleEdit(editing, values) : Promise.resolve())}
      />

      <SubmitAssignmentModal
        isOpen={Boolean(submitting)}
        assignment={submitting}
        onClose={() => setSubmitting(null)}
        onSubmit={handleSubmit}
      />
    </PageLayout>
  )
}
