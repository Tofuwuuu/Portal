import { useCallback, useEffect, useState } from 'react'
import { assignmentsApi } from '../api/client'
import AssignmentCard from '../components/AssignmentCard'
import CreateForm from '../components/CreateForm'
import Navbar from '../components/Navbar'
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
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-primary">Assignments</h1>

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
          <p className="text-slate-500">Loading...</p>
        ) : assignments.length === 0 ? (
          <p className="text-slate-400">No assignments posted yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {assignments.map((a) => (
              <AssignmentCard key={a.id} assignment={a} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
