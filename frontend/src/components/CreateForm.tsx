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
      className="mb-8 rounded-lg border border-blue-200 bg-white p-6 shadow-sm"
    >
      <h2 className="mb-4 text-lg font-semibold text-primary">Create New</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {field.label}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                value={values[field.name] || ''}
                onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                required={field.required !== false}
                rows={3}
                className="w-full rounded border border-slate-300 px-3 py-2 focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light"
              />
            ) : (
              <input
                type={field.type || 'text'}
                value={values[field.name] || ''}
                onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                required={field.required !== false}
                className="w-full rounded border border-slate-300 px-3 py-2 focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light"
              />
            )}
          </div>
        ))}
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="mt-4 rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
      >
        {loading ? 'Saving...' : submitLabel}
      </button>
    </form>
  )
}
