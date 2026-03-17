'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function CreateEventTypePage() {
  return (
    <ProtectedRoute>
      <CreateEventTypeForm />
    </ProtectedRoute>
  )
}

function CreateEventTypeForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [color, setColor] = useState('gray')
  const [titles, setTitles] = useState<Record<string, string>>({
    he: '', en: '', ru: '', es: '', de: '', it: '', fr: '', uk: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const selectedColor = COLOR_OPTIONS.find((c) => c.value === color) || COLOR_OPTIONS[COLOR_OPTIONS.length - 1]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Name is required')
      return
    }
    if (!/^[a-z0-9_]+$/.test(name)) {
      setError('Name must contain only lowercase letters, digits, and underscores')
      return
    }

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
      const res = await fetch(getApiUrl('/event-types'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color, titles: filteredTitles }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Failed to create event type')
      }

      router.push('/admin/event-types')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event type')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/admin" className="hover:text-gray-700">Admin</Link>
          <span>/</span>
          <Link href="/admin/event-types" className="hover:text-gray-700">Event Types</Link>
          <span>/</span>
          <span className="text-gray-700">Create</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Create Event Type</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="e.g. morning_lesson"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Lowercase letters, digits, and underscores only. Cannot be changed after creation.</p>
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
              {name && (
                <div className="mt-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedColor.classes}`}>
                    {titles.en || name}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">Preview</span>
                </div>
              )}
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
                      placeholder={lang === 'he' || lang === 'en' ? 'Required' : 'Optional'}
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
                {saving ? 'Creating...' : 'Create Event Type'}
              </button>
              <Link
                href="/admin/event-types"
                className="py-2 px-6 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
