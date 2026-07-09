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

  const loadAssignments = useCallback(async () => {
    const { data } = await assignmentsApi.list()
    setAssignments(data)
    setLoading(false)
  }, [])

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

  return (
    <PageLayout>
      <PageHeader
        title="Assignments"
        description="Homework, projects, and due dates."
      />

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
            <AssignmentCard key={a.id} assignment={a} />
          ))}
        </div>
      )}
    </PageLayout>
  )
}
