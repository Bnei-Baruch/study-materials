'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getApiUrl } from '@/lib/api'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'

const LANGUAGES = ['he', 'en', 'ru', 'es', 'de', 'it', 'fr', 'uk'] as const

const COLOR_OPTIONS = [
  { value: 'blue', label: 'Blue', classes: 'bg-blue-100 text-blue-800' },
  { value: 'amber', label: 'Amber', classes: 'bg-amber-100 text-amber-800' },
  { value: 'indigo', label: 'Indigo', classes: 'bg-indigo-100 text-indigo-800' },
  { value: 'green', label: 'Green', classes: 'bg-green-100 text-green-800' },
  { value: 'purple', label: 'Purple', classes: 'bg-purple-100 text-purple-800' },
  { value: 'yellow', label: 'Yellow', classes: 'bg-yellow-100 text-yellow-800' },
  { value: 'red', label: 'Red', classes: 'bg-red-100 text-red-800' },
  { value: 'pink', label: 'Pink', classes: 'bg-pink-100 text-pink-800' },
  { value: 'teal', label: 'Teal', classes: 'bg-teal-100 text-teal-800' },
  { value: 'orange', label: 'Orange', classes: 'bg-orange-100 text-orange-800' },
  { value: 'gray', label: 'Gray', classes: 'bg-gray-100 text-gray-800' },
]

interface EventType {
  id: string
  name: string
  titles: Record<string, string>
  color: string
  order: number
}

export default function EditEventTypePage() {
  return (
    <ProtectedRoute>
      <EditEventTypeForm />
    </ProtectedRoute>
  )
}

function EditEventTypeForm() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [name, setName] = useState('')
  const [color, setColor] = useState('gray')
  const [titles, setTitles] = useState<Record<string, string>>({
    he: '', en: '', ru: '', es: '', de: '', it: '', fr: '', uk: '',
  })

  const selectedColor = COLOR_OPTIONS.find((c) => c.value === color) || COLOR_OPTIONS[COLOR_OPTIONS.length - 1]

  useEffect(() => {
    const fetchEventType = async () => {
      try {
        const res = await fetch(getApiUrl(`/event-types/${id}`))
        if (!res.ok) throw new Error('Event type not found')
        const data: EventType = await res.json()
        setName(data.name)
        setColor(data.color || 'gray')
        setTitles({
          he: data.titles?.he || '',
          en: data.titles?.en || '',
          ru: data.titles?.ru || '',
          es: data.titles?.es || '',
          de: data.titles?.de || '',
          it: data.titles?.it || '',
          fr: data.titles?.fr || '',
          uk: data.titles?.uk || '',
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load event type')
      } finally {
        setLoading(false)
      }
    }
    fetchEventType()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const filteredTitles: Record<string, string> = {}
    for (const lang of LANGUAGES) {
      if (titles[lang]?.trim()) filteredTitles[lang] = titles[lang].trim()
    }
    if (Object.keys(filteredTitles).length === 0) {
      setError('At least one title is required')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(getApiUrl(`/event-types/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color, titles: filteredTitles }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Failed to update event type')
      }

      setSuccess('Saved successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update event type')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete event type "${name}"?\n\nExisting events using this type will keep the name, but it won't be available for new events.`)) return

    setDeleting(true)
    try {
      const res = await fetch(getApiUrl(`/event-types/${id}`), { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete event type')
      router.push('/admin/event-types')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event type')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-2xl mx-auto text-center py-12 text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/admin" className="hover:text-gray-700">Admin</Link>
          <span>/</span>
          <Link href="/admin/event-types" className="hover:text-gray-700">Event Types</Link>
          <span>/</span>
          <span className="text-gray-700">Edit</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Edit Event Type</h1>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition disabled:opacity-60"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">{success}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-mono flex-1">{name}</code>
                <span className="text-xs text-gray-400">Read-only</span>
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition border-2 ${c.classes} ${
                      color === c.value ? 'border-gray-800 scale-105' : 'border-transparent'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedColor.classes}`}>
                  {titles.en || name}
                </span>
                <span className="text-xs text-gray-400 ml-2">Preview</span>
              </div>
            </div>

            {/* Titles */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titles <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {LANGUAGES.map((lang) => (
                  <div key={lang}>
                    <label className="block text-xs text-gray-500 mb-1 uppercase">{lang}</label>
                    <input
                      type="text"
                      value={titles[lang] || ''}
                      onChange={(e) => setTitles((prev) => ({ ...prev, [lang]: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <Link
                href="/admin/event-types"
                className="py-2 px-6 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Back
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
