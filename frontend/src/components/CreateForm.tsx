import { useState, type FormEvent } from 'react'

interface CreateFormProps {
  fields: {
    name: string
    label: string
    type?: string
    required?: boolean
  }[]
  onSubmit: (data: Record<string, string>) => Promise<void>
  submitLabel: string
}

export default function CreateForm({ fields, onSubmit, submitLabel }: CreateFormProps) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onSubmit(values)
      setValues({})
    } catch {
      setError('Failed to create. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 overflow-hidden rounded-xl border border-blue-100 bg-white shadow-card"
    >
      <div className="border-b border-slate-100 bg-primary-50/50 px-6 py-4">
        <h2 className="font-semibold text-primary">Create New</h2>
        <p className="text-sm text-slate-500">Fill in the details below.</p>
      </div>
      <div className="space-y-4 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                {field.label}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  value={values[field.name] || ''}
                  onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                  required={field.required !== false}
                  rows={3}
                  className="input-field resize-none"
                />
              ) : (
                <input
                  type={field.type || 'text'}
                  value={values[field.name] || ''}
                  onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                  required={field.required !== false}
                  className="input-field"
                />
              )}
            </div>
          ))}
        </div>
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
        )}
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
