'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getApiUrl } from '@/lib/api'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'

// Helper function to get default title for an event type in a specific language
function getDefaultTitle(eventType: string, lang: string): string {
  const defaults: { [type: string]: { [lang: string]: string } } = {
    morning_lesson: {
      he: 'שיעור בוקר',
      en: 'Morning Lesson',
      ru: 'Утренний урок',
      es: 'Lección matutina',
      de: 'Morgenlektion',
      it: 'Lezione mattutina',
      fr: 'Leçon du matin',
      uk: 'Ранковий урок',
    },
    noon_lesson: {
      he: 'שיעור צהריים',
      en: 'Noon Lesson',
      ru: 'Дневной урок',
      es: 'Lección del mediodía',
      de: 'Mittagslektion',
      it: 'Lezione di mezzogiorno',
      fr: 'Leçon de midi',
      uk: 'Денний урок',
    },
    evening_lesson: {
      he: 'שיעור ערב',
      en: 'Evening Lesson',
      ru: 'Вечерний урок',
      es: 'Lección nocturna',
      de: 'Abendlektion',
      it: 'Lezione serale',
      fr: 'Leçon du soir',
      uk: 'Вечірній урок',
    },
    meal: {
      he: 'סעודה',
      en: 'Meal',
      ru: 'Трапеза',
      es: 'Comida',
      de: 'Mahlzeit',
      it: 'Pasto',
      fr: 'Repas',
      uk: 'Трапеза',
    },
    convention: {
      he: 'כנס',
      en: 'Convention',
      ru: 'Конгресс',
      es: 'Congreso',
      de: 'Kongress',
      it: 'Congresso',
      fr: 'Congrès',
      uk: 'Конгрес',
    },
    lecture: {
      he: 'הרצאה',
      en: 'Lecture',
      ru: 'Лекция',
      es: 'Conferencia',
      de: 'Vortrag',
      it: 'Conferenza',
      fr: 'Conférence',
      uk: 'Лекція',
    },
    other: {
      he: 'אחר',
      en: 'Other',
      ru: 'Другое',
      es: 'Otro',
      de: 'Andere',
      it: 'Altro',
      fr: 'Autre',
      uk: 'Інше',
    },
  }

  return defaults[eventType]?.[lang] || defaults['morning_lesson']?.[lang] || 'Event'
}

export default function CreateEventPage() {
  return (
    <ProtectedRoute>
      <CreateEventPageContent />
    </ProtectedRoute>
  )
}

function CreateEventPageContent() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [date, setDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [type, setType] = useState('morning_lesson')
  const [number, setNumber] = useState(1)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [showTitleCustomization, setShowTitleCustomization] = useState(false)
  const [customTitles, setCustomTitles] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const languages = [
    { code: 'he', name: 'Hebrew (עברית)' },
    { code: 'en', name: 'English' },
    { code: 'ru', name: 'Russian (Русский)' },
    { code: 'es', name: 'Spanish (Español)' },
    { code: 'de', name: 'German (Deutsch)' },
    { code: 'it', name: 'Italian (Italiano)' },
    { code: 'fr', name: 'French (Français)' },
    { code: 'uk', name: 'Ukrainian (Українська)' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!date) {
      setError('Date is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Build request body with optional custom titles and times
      const requestBody: any = { date, type, number }
      
      // Add times if provided
      if (startTime) {
        requestBody.start_time = startTime
      }
      if (endTime) {
        requestBody.end_time = endTime
      }
      
      // Only include titles if at least one custom title was entered
      const hasCustomTitles = Object.values(customTitles).some(title => title.trim() !== '')
      if (hasCustomTitles) {
        requestBody.titles = customTitles
      }

      const response = await fetch(getApiUrl('/events'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || 'Failed to create event')
      }

      const event = await response.json()
      // Redirect to event detail page
      router.push(`/events/${event.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Link href="/events" className="text-blue-600 hover:text-blue-700 text-sm">
            ← Back to Events
          </Link>
          <div className="flex items-center gap-2">
            {user?.name && <span className="text-sm text-gray-600">{user.name}</span>}
            <button
              onClick={logout}
              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded transition duration-200"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Create Event</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900"
                required
              />
            </div>

            {/* Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Event Type *
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900"
              >
                <option value="morning_lesson">Morning Lesson</option>
                <option value="noon_lesson">Noon Lesson</option>
                <option value="evening_lesson">Evening Lesson</option>
                <option value="meal">Meal</option>
                <option value="convention">Convention</option>
                <option value="lecture">Lecture</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Number */}
            <div>
              <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-2">
                Event Number *
              </label>
              <input
                id="number"
                type="number"
                min="1"
                value={number}
                onChange={(e) => setNumber(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900"
              />
              <p className="mt-1 text-sm text-gray-500">
                Use this to differentiate multiple events on the same day
              </p>
            </div>

            {/* Time Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time (Optional)
                </label>
                <input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                  End Time (Optional)
                </label>
                <input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900"
                />
              </div>
            </div>

            {/* Optional Title Customization */}
            <div className="border-t pt-6">
              <button
                type="button"
                onClick={() => setShowTitleCustomization(!showTitleCustomization)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {showTitleCustomization ? '− Hide' : '+ Customize'} Event Titles (Optional)
              </button>
              
              {showTitleCustomization && (
                <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    By default, titles will be generated based on the event type. You can override them here for any language.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {languages.map(({ code, name }) => (
                      <div key={code}>
                        <label htmlFor={`title-${code}`} className="block text-sm font-medium text-gray-700 mb-1">
                          {name}
                        </label>
                        <input
                          id={`title-${code}`}
                          type="text"
                          value={customTitles[code] || ''}
                          onChange={(e) => setCustomTitles({ ...customTitles, [code]: e.target.value })}
                          placeholder={getDefaultTitle(type, code)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
