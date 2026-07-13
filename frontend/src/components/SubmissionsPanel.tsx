import { assignmentsApi } from '../api/client'
import type { Assignment, Submission } from '../types'

interface SubmissionsPanelProps {
  assignment: Assignment
  submissions: Submission[]
  loading: boolean
  onClose: () => void
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

async function downloadFile(assignmentId: number, submission: Submission) {
  const token = localStorage.getItem('token')
  const url = assignmentsApi.downloadFileUrl(assignmentId, submission.id)
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok) {
    throw new Error('Download failed')
  }
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = submission.file_name || 'submission'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}

export default function SubmissionsPanel({
  assignment,
  submissions,
  loading,
  onClose,
}: SubmissionsPanelProps) {
  return (
    <div className="mb-8 overflow-hidden rounded-xl border border-blue-100 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-slate-100 bg-primary-50/50 px-6 py-4">
        <div>
          <h2 className="font-semibold text-primary">Submissions</h2>
          <p className="text-sm text-slate-500">{assignment.title}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-white"
        >
          Close
        </button>
      </div>

      <div className="p-6">
        {loading ? (
          <p className="text-sm text-slate-500">Loading submissions...</p>
        ) : submissions.length === 0 ? (
          <p className="text-sm text-slate-400">No students have submitted yet.</p>
        ) : (
          <div className="space-y-3">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-slate-900">
                    {submission.student_name || `Student #${submission.student_id}`}
                  </p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      submission.is_done
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {submission.is_done ? 'Done' : 'In progress'}
                  </span>
                </div>
                {submission.note ? (
                  <p className="mt-2 text-sm text-slate-600">{submission.note}</p>
                ) : (
                  <p className="mt-2 text-sm italic text-slate-400">No note provided</p>
                )}
                {submission.has_file && submission.file_name && (
                  <button
                    type="button"
                    className="mt-2 text-sm font-medium text-primary hover:underline"
                    onClick={() => downloadFile(assignment.id, submission)}
                  >
                    Download: {submission.file_name}
                  </button>
                )}
                <p className="mt-2 text-xs text-slate-400">
                  Submitted {formatDateTime(submission.submitted_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
