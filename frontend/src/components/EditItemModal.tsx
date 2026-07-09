import { useEffect, useState, type FormEvent } from 'react'

interface EditItemModalProps {
  isOpen: boolean
  title: string
  fields: {
    name: string
    label: string
    type?: string
  }[]
  initialValues: Record<string, string>
  onClose: () => void
  onSave: (values: Record<string, string>) => Promise<void>
}

export default function EditItemModal({
  isOpen,
  title,
  fields,
  initialValues,
  onClose,
  onSave,
}: EditItemModalProps) {
  const [values, setValues] = useState<Record<string, string>>(initialValues)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setValues(initialValues)
    setError('')
  }, [initialValues, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await onSave(values)
      onClose()
    } catch {
      setError('Failed to save changes.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {fields.map((field) => (
            <div key={field.name}>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">{field.label}</label>
              {field.type === 'textarea' ? (
                <textarea
                  rows={3}
                  value={values[field.name] || ''}
                  onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                  className="input-field resize-none"
                  required
                />
              ) : (
                <input
                  type={field.type || 'text'}
                  value={values[field.name] || ''}
                  onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                  className="input-field"
                  required
                />
              )}
            </div>
          ))}
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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
