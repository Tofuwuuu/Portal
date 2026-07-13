import { useEffect, useState, type FormEvent } from 'react'
import type { Assignment } from '../types'

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx']

interface SubmitAssignmentModalProps {
  isOpen: boolean
  assignment: Assignment | null
  onClose: () => void
  onSubmit: (values: { note: string; is_done: boolean; file?: File | null }) => Promise<void>
}

function hasAllowedExtension(filename: string) {
  const lower = filename.toLowerCase()
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

export default function SubmitAssignmentModal({
  isOpen,
  assignment,
  onClose,
  onSubmit,
}: SubmitAssignmentModalProps) {
  const [note, setNote] = useState('')
  const [isDone, setIsDone] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (assignment) {
      setNote(assignment.my_submission?.note || '')
      setIsDone(assignment.my_submission?.is_done ?? true)
      setFile(null)
      setError('')
    }
  }, [assignment, isOpen])

  if (!isOpen || !assignment) return null

  const existingFile = assignment.my_submission?.file_name
  const requiresFile = !assignment.my_submission?.has_file && !existingFile

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (file && !hasAllowedExtension(file.name)) {
      setError('Only PDF and DOC/DOCX files are allowed.')
      return
    }

    if (requiresFile && !file) {
      setError('Please upload a PDF or DOC/DOCX file.')
      return
    }

    setLoading(true)
    try {
      await onSubmit({ note: note.trim(), is_done: isDone, file })
      onClose()
    } catch {
      setError('Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Submit Assignment</h3>
            <p className="text-sm text-slate-500">{assignment.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              File {requiresFile ? '(required)' : '(optional — replace existing)'}
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary-dark"
            />
            <p className="mt-1.5 text-xs text-slate-400">PDF or DOC/DOCX only · Max 10 MB</p>
            {existingFile && !file && (
              <p className="mt-1 text-xs text-slate-500">Current file: {existingFile}</p>
            )}
            {file && <p className="mt-1 text-xs text-primary">Selected: {file.name}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Note (optional)
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a short note about your work..."
              className="input-field resize-none"
              maxLength={2000}
            />
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isDone}
              onChange={(e) => setIsDone(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
            Mark as done
          </label>

          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : assignment.my_submission ? 'Update Submission' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
