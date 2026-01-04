'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { getApiUrl } from '@/lib/api'
import Link from 'next/link'
import EventTypeBadge from '@/components/EventTypeBadge'
import PartForm from '@/components/PartForm'
import { SourceSearch } from '@/components/SourceSearch'

interface Event {
  id: string
  date: string
  start_time?: string
  end_time?: string
  type: string
  number: number
  order: number
  titles?: {
    he?: string
    en?: string
    ru?: string
    es?: string
    de?: string
    it?: string
    fr?: string
    uk?: string
  }
  public: boolean
  created_at: string
}

interface Source {
  source_id: string
  source_title: string
  source_url: string
  page_number?: string
}

interface CustomLink {
  title: string
  url: string
}

interface Part {
  id: string
  title: string
  description: string
  order: number
  language: string
  sources: Source[]
  excerpts_link?: string
  transcript_link?: string
  lesson_link?: string
  program_link?: string
  reading_before_sleep_link?: string
  lesson_preparation_link?: string
  recorded_lesson_date?: string
  custom_links?: CustomLink[]
}

export default function EventDetailPage() {
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showPartForm, setShowPartForm] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('he')
  const [editingPartId, setEditingPartId] = useState<string | null>(null)
  const [editedPart, setEditedPart] = useState<Part | null>(null)
  const [showTitleEdit, setShowTitleEdit] = useState(false)
  const [editedTitles, setEditedTitles] = useState<{ [key: string]: string }>({})
  const [editingOrder, setEditingOrder] = useState(false)
  const [newOrder, setNewOrder] = useState(0)
  const [editingTimes, setEditingTimes] = useState(false)
  const [newStartTime, setNewStartTime] = useState('')
  const [newEndTime, setNewEndTime] = useState('')

  const languageNames: { [key: string]: string } = {
    he: '🇮🇱 עברית',
    en: '🇬🇧 English',
    ru: '🇷🇺 Русский',
    uk: '🇺🇦 Українська',
    es: '🇪🇸 Español',
    de: '🇩🇪 Deutsch',
    it: '🇮🇹 Italiano',
    fr: '🇫🇷 Français',
  }

  useEffect(() => {
    fetchEventAndParts()
  }, [eventId, selectedLanguage])

  const fetchEventAndParts = async () => {
    try {
      // Fetch event
      const eventRes = await fetch(`${getApiUrl(`/events/${eventId}`)}`)
      if (!eventRes.ok) {
        throw new Error('Event not found')
      }
      const eventData = await eventRes.json()
      setEvent(eventData)

      // Fetch parts for this event with language filter
      const partsRes = await fetch(`${getApiUrl(`/events/${eventId}/parts?language=${selectedLanguage}`)}`)
      if (partsRes.ok) {
        const partsData = await partsRes.json()
        setParts(partsData.parts || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (part: Part) => {
    setEditingPartId(part.id)
    setEditedPart({...part})
  }

  const cancelEdit = () => {
    setEditingPartId(null)
    setEditedPart(null)
  }

  const updateEditedField = (field: keyof Part, value: any) => {
    if (editedPart) {
      setEditedPart({...editedPart, [field]: value})
    }
  }

  // Source management functions for edit mode
  const handleAddSourceInEdit = async (source: { source_id: string; source_title: string }) => {
    if (!editedPart) return

    try {
      // Fetch the source title in the part's language
      const response = await fetch(
        `${getApiUrl(`/sources/title?id=${source.source_id}&language=${editedPart.language}`)}`
      )
      const data = await response.json()

      const newSource: Source = {
        source_id: source.source_id,
        source_title: data.title,
        source_url: data.url,
        page_number: '',
      }

      updateEditedField('sources', [...editedPart.sources, newSource])
    } catch (error) {
      console.error('Failed to fetch source title:', error)
      alert('Failed to add source')
    }
  }

  const handleRemoveSourceInEdit = (index: number) => {
    if (!editedPart) return
    const updatedSources = editedPart.sources.filter((_, idx) => idx !== index)
    updateEditedField('sources', updatedSources)
  }

  const handleUpdateSourceInEdit = (index: number, field: keyof Source, value: string) => {
    if (!editedPart) return
    const updatedSources = [...editedPart.sources]
    updatedSources[index] = { ...updatedSources[index], [field]: value }
    updateEditedField('sources', updatedSources)
  }

  const savePart = async () => {
    if (!editedPart) return

    try {
      const response = await fetch(`${getApiUrl(`/parts/${editedPart.id}`)}` {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editedPart.title,
          description: editedPart.description,
          sources: editedPart.sources,
          excerpts_link: editedPart.excerpts_link || '',
          transcript_link: editedPart.transcript_link || '',
          lesson_link: editedPart.lesson_link || '',
          program_link: editedPart.program_link || '',
          reading_before_sleep_link: editedPart.reading_before_sleep_link || '',
          lesson_preparation_link: editedPart.lesson_preparation_link || '',
          recorded_lesson_date: editedPart.recorded_lesson_date || '',
          custom_links: editedPart.custom_links || [],
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update part')
      }

      // Refresh parts
      await fetchEventAndParts()
      cancelEdit()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save part')
    }
  }

  const deletePart = async (partId: string, partTitle: string, partLanguage: string) => {
    const isHebrew = partLanguage === 'he'
    const message = isHebrew 
      ? `Are you sure you want to delete "${partTitle}"?\n\nThis will delete this part in ALL languages.`
      : `Are you sure you want to delete "${partTitle}"?\n\nThis will only delete the ${partLanguage.toUpperCase()} version.`
    
    if (!confirm(message)) {
      return
    }

    try {
      const response = await fetch(`${getApiUrl(`/parts/${partId}`)}` {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete part')
      }

      // Refresh parts
      await fetchEventAndParts()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete part')
    }
  }

  const deleteEvent = async () => {
    if (!event) return
    
    if (!confirm(`Are you sure you want to delete this event?\n\nThis will delete the event and ALL its parts in ALL languages.`)) {
      return
    }

    try {
      const response = await fetch(`${getApiUrl(`/events/${eventId}`)}` {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete event')
      }

      // Redirect to events list
      window.location.href = '/events'
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete event')
    }
  }

  const duplicateEvent = async () => {
    if (!event) return
    
    const newDateStr = prompt('Enter new date for duplicated event (YYYY-MM-DD):', new Date().toISOString().split('T')[0])
    if (!newDateStr) return

    try {
      const response = await fetch(`${getApiUrl(`/events/${eventId}/duplicate`)}` {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          new_date: newDateStr,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to duplicate event')
      }

      const newEvent = await response.json()
      
      // Redirect to the new event
      window.location.href = `/events/${newEvent.id}`
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to duplicate event')
    }
  }

  const togglePublic = async () => {
    if (!event) return

    try {
      const response = await fetch(`${getApiUrl(`/events/${eventId}/toggle-public`)}` {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public: !event.public,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to toggle public status')
      }

      // Refresh event data
      await fetchEventAndParts()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle public status')
    }
  }

  // Helper function to get default title for an event type in a specific language
  const getDefaultTitle = (eventType: string, lang: string): string => {
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

  const startTitleEdit = () => {
    if (!event) return
    // Initialize with current titles or empty
    const currentTitles = event.titles || {}
    setEditedTitles(currentTitles)
    setShowTitleEdit(true)
  }

  const saveTitles = async () => {
    if (!event) return

    try {
      const response = await fetch(`${getApiUrl(`/events/${eventId}`)}` {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          titles: editedTitles,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update event titles')
      }

      // Refresh event data
      await fetchEventAndParts()
      setShowTitleEdit(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update titles')
    }
  }

  const startOrderEdit = () => {
    if (!event) return
    setNewOrder(event.order)
    setEditingOrder(true)
  }

  const saveOrder = async () => {
    if (!event) return

    try {
      const response = await fetch(`${getApiUrl(`/events/${eventId}`)}` {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order: newOrder,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update event order')
      }

      // Refresh event data
      await fetchEventAndParts()
      setEditingOrder(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update order')
    }
  }

  const startTimesEdit = () => {
    if (!event) return
    setNewStartTime(event.start_time || '')
    setNewEndTime(event.end_time || '')
    setEditingTimes(true)
  }

  const saveTimes = async () => {
    if (!event) return

    try {
      const response = await fetch(`${getApiUrl(`/events/${eventId}`)}` {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_time: newStartTime || undefined,
          end_time: newEndTime || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update event times')
      }

      // Refresh event data
      await fetchEventAndParts()
      setEditingTimes(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update times')
    }
  }

  const handlePartCreated = () => {
    setShowPartForm(false)
    fetchEventAndParts() // Refresh the parts list
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-gray-600">Loading event...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || 'Event not found'}
          </div>
          <Link href="/events" className="inline-block mt-4 text-blue-600 hover:text-blue-700">
            ← Back to Events
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href="/events" className="text-blue-600 hover:text-blue-700 text-sm">
            ← Back to Events
          </Link>
        </div>

        {/* Event Info */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <EventTypeBadge type={event.type} />
                <span className="text-lg font-semibold text-gray-700">
                  Event #{event.number}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-800">
                {formatDate(event.date)}
              </h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={startTitleEdit}
                className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-medium transition"
              >
                ✏️ Edit Titles
              </button>
              <button
                onClick={togglePublic}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  event.public
                    ? 'bg-green-100 hover:bg-green-200 text-green-700'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {event.public ? '🌐 Public' : '🔒 Private'}
              </button>
              <button
                onClick={duplicateEvent}
                className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition"
              >
                📋 Duplicate
              </button>
              <button
                onClick={deleteEvent}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
            <span>Event ID: {event.id}</span>
            <span className="text-gray-300">|</span>
            {editingOrder ? (
              <div className="flex items-center gap-2">
                <span>Display Order:</span>
                <input
                  type="number"
                  value={newOrder}
                  onChange={(e) => setNewOrder(parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-gray-900"
                />
                <button
                  onClick={saveOrder}
                  className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                >
                  ✓
                </button>
                <button
                  onClick={() => setEditingOrder(false)}
                  className="px-2 py-1 bg-gray-300 hover:bg-gray-400 text-gray-700 text-xs rounded"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={startOrderEdit}
                className="flex items-center gap-1 hover:text-gray-700"
              >
                <span>Display Order: {event.order}</span>
                <span className="text-xs">✏️</span>
              </button>
            )}
            <span className="text-gray-300">|</span>
            {editingTimes ? (
              <div className="flex items-center gap-2">
                <span>Time:</span>
                <input
                  type="time"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-gray-900"
                  placeholder="Start"
                />
                <span>-</span>
                <input
                  type="time"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-gray-900"
                  placeholder="End"
                />
                <button
                  onClick={saveTimes}
                  className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                >
                  ✓
                </button>
                <button
                  onClick={() => setEditingTimes(false)}
                  className="px-2 py-1 bg-gray-300 hover:bg-gray-400 text-gray-700 text-xs rounded"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={startTimesEdit}
                className="flex items-center gap-1 hover:text-gray-700"
              >
                <span>
                  Time: {event.start_time && event.end_time 
                    ? `${event.start_time} - ${event.end_time}` 
                    : 'Not set'}
                </span>
                <span className="text-xs">✏️</span>
              </button>
            )}
          </div>

          {/* Title Edit Form */}
          {showTitleEdit && (
            <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Edit Event Titles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {Object.entries(languageNames).map(([code, name]) => (
                  <div key={code}>
                    <label htmlFor={`title-${code}`} className="block text-sm font-medium text-gray-700 mb-1">
                      {name}
                    </label>
                    <input
                      id={`title-${code}`}
                      type="text"
                      value={editedTitles[code] || ''}
                      onChange={(e) => setEditedTitles({ ...editedTitles, [code]: e.target.value })}
                      placeholder={getDefaultTitle(event.type, code)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveTitles}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition"
                >
                  💾 Save Titles
                </button>
                <button
                  onClick={() => setShowTitleEdit(false)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg text-sm font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Language Selector */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Language</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(languageNames).map(([code, name]) => (
              <button
                key={code}
                onClick={() => setSelectedLanguage(code)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  selectedLanguage === code
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Parts Section */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Lesson Parts ({parts.length})
            </h2>
            {!showPartForm && (
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                onClick={() => setShowPartForm(true)}
              >
                Add Part
              </button>
            )}
          </div>

          {/* Part Form */}
          {showPartForm && (
            <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Create New Part</h3>
              <PartForm
                eventId={eventId}
                eventDate={event.date}
                existingParts={parts}
                onPartCreated={handlePartCreated}
                onCancel={() => setShowPartForm(false)}
              />
            </div>
          )}

          {parts.length === 0 && !showPartForm ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-4">No parts yet for this event</p>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                onClick={() => setShowPartForm(true)}
              >
                Add First Part
              </button>
            </div>
          ) : parts.length > 0 ? (
            <div className="space-y-4">
              {parts.map((part) => (
                <div
                  key={part.id}
                  className={`border rounded-lg p-6 hover:border-blue-300 transition ${
                    part.order === 0 ? 'border-purple-300 bg-purple-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                      part.order === 0 ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {part.order === 0 ? '📚' : part.order}
                    </div>
                    <div className="flex-1">
                      {editingPartId === part.id && editedPart ? (
                        // Edit mode - Full form
                        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input
                              type="text"
                              value={editedPart.title}
                              onChange={(e) => updateEditedField('title', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                              value={editedPart.description}
                              onChange={(e) => updateEditedField('description', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            />
                          </div>
                          
                          {editedPart.order !== 0 && (
                            <>
                              {editedPart.recorded_lesson_date !== undefined && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Recorded Lesson Date</label>
                                  <input
                                    type="date"
                                    value={editedPart.recorded_lesson_date || ''}
                                    onChange={(e) => updateEditedField('recorded_lesson_date', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                              )}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Excerpts Link</label>
                                <input
                                  type="url"
                                  value={editedPart.excerpts_link || ''}
                                  onChange={(e) => updateEditedField('excerpts_link', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Transcript Link</label>
                                <input
                                  type="url"
                                  value={editedPart.transcript_link || ''}
                                  onChange={(e) => updateEditedField('transcript_link', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Link</label>
                                <input
                                  type="url"
                                  value={editedPart.lesson_link || ''}
                                  onChange={(e) => updateEditedField('lesson_link', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Program Link</label>
                                <input
                                  type="url"
                                  value={editedPart.program_link || ''}
                                  onChange={(e) => updateEditedField('program_link', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>

                              {/* Custom Links (Language-Specific) */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Custom Links (Language-Specific)</label>
                                {editedPart.custom_links && editedPart.custom_links.length > 0 && (
                                  <div className="space-y-2 mb-2">
                                    {editedPart.custom_links.map((link, idx) => (
                                      <div key={idx} className="bg-gray-50 p-3 rounded border border-gray-300 relative">
                                        <button
                                          onClick={() => {
                                            const updatedLinks = editedPart.custom_links?.filter((_, i) => i !== idx) || []
                                            updateEditedField('custom_links', updatedLinks)
                                          }}
                                          className="absolute top-2 right-2 text-red-600 hover:text-red-800 font-bold"
                                          title="Remove custom link"
                                        >
                                          ✕
                                        </button>
                                        <div className="grid grid-cols-2 gap-2 pr-6">
                                          <div>
                                            <label className="block text-xs text-gray-600 mb-1">Title:</label>
                                            <input
                                              type="text"
                                              value={link.title}
                                              onChange={(e) => {
                                                const updatedLinks = [...(editedPart.custom_links || [])]
                                                updatedLinks[idx] = { ...updatedLinks[idx], title: e.target.value }
                                                updateEditedField('custom_links', updatedLinks)
                                              }}
                                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                              placeholder="Link title"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs text-gray-600 mb-1">URL:</label>
                                            <input
                                              type="url"
                                              value={link.url}
                                              onChange={(e) => {
                                                const updatedLinks = [...(editedPart.custom_links || [])]
                                                updatedLinks[idx] = { ...updatedLinks[idx], url: e.target.value }
                                                updateEditedField('custom_links', updatedLinks)
                                              }}
                                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                              placeholder="https://..."
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedLinks = [...(editedPart.custom_links || []), { title: '', url: '' }]
                                    updateEditedField('custom_links', updatedLinks)
                                  }}
                                  className="text-sm px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded transition"
                                >
                                  + Add Custom Link
                                </button>
                              </div>
                            </>
                          )}

                          {editedPart.order === 0 && (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reading Before Sleep Link</label>
                                <input
                                  type="url"
                                  value={editedPart.reading_before_sleep_link || ''}
                                  onChange={(e) => updateEditedField('reading_before_sleep_link', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Preparation Link</label>
                                <input
                                  type="url"
                                  value={editedPart.lesson_preparation_link || ''}
                                  onChange={(e) => updateEditedField('lesson_preparation_link', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            </>
                          )}

                          {/* Sources Management */}
                          {editedPart.language === 'he' ? (
                            // Full source management for Hebrew parts
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Sources</label>
                              
                              {/* Existing sources */}
                              {editedPart.sources && editedPart.sources.length > 0 && (
                                <div className="space-y-3 mb-4">
                                  {editedPart.sources.map((source, idx) => (
                                    <div key={idx} className="bg-gray-50 p-3 rounded border border-gray-300 relative">
                                      <button
                                        onClick={() => handleRemoveSourceInEdit(idx)}
                                        className="absolute top-2 right-2 text-red-600 hover:text-red-800 font-bold"
                                        title="Remove source"
                                      >
                                        ✕
                                      </button>
                                      <div className="text-sm font-medium text-gray-700 mb-2 pr-8">
                                        {source.source_title}
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="block text-xs text-gray-600 mb-1">Page Number:</label>
                                          <input
                                            type="text"
                                            value={source.page_number || ''}
                                            onChange={(e) => handleUpdateSourceInEdit(idx, 'page_number', e.target.value)}
                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="42 or 15-17"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs text-gray-600 mb-1">Link:</label>
                                          <input
                                            type="url"
                                            value={source.source_url}
                                            onChange={(e) => handleUpdateSourceInEdit(idx, 'source_url', e.target.value)}
                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="https://..."
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Add new source */}
                              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                <label className="block text-xs font-medium text-blue-800 mb-2">Add New Source:</label>
                                <SourceSearch onSelect={handleAddSourceInEdit} />
                              </div>
                            </div>
                          ) : (
                            // Simple source link editing for non-Hebrew parts
                            editedPart.sources && editedPart.sources.length > 0 && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Sources</label>
                                <div className="space-y-3">
                                  {editedPart.sources.map((source, idx) => (
                                    <div key={idx} className="bg-gray-50 p-3 rounded border border-gray-300">
                                      <div className="text-sm font-medium text-gray-700 mb-2">
                                        {source.source_title}
                                        {source.page_number && <span className="text-gray-500 ml-2">(p. {source.page_number})</span>}
                                      </div>
                                      <label className="block text-xs text-gray-600 mb-1">Link:</label>
                                      <input
                                        type="url"
                                        value={source.source_url}
                                        onChange={(e) => handleUpdateSourceInEdit(idx, 'source_url', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="https://kabbalahmedia.info/sources/..."
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          )}
                          
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={savePart}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
                            >
                              💾 Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg text-sm font-medium transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <>
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-800">
                              {part.title}
                            </h3>
                            <div className="flex gap-2">
                              {/* Edit button for translations OR Hebrew */}
                              {(part.title === '[Translation needed]' || selectedLanguage !== 'he' || part.language === 'he') && (
                                <button
                                  onClick={() => startEdit(part)}
                                  className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm font-medium transition"
                                >
                                  {part.title === '[Translation needed]' ? 'Add Translation' : 'Edit'}
                                </button>
                              )}
                              {/* Delete button for all parts */}
                              <button
                                onClick={() => deletePart(part.id, part.title, part.language)}
                                className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm font-medium transition"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          {part.description && (
                            <p className="text-gray-600 mb-3">{part.description}</p>
                          )}
                        </>
                      )}

                      {/* Recorded Lesson Date */}
                      {part.recorded_lesson_date && (
                        <div className="mb-3 text-sm text-gray-600">
                          <span className="font-medium">📅 Recorded:</span> {new Date(part.recorded_lesson_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                      )}
                      
                      {/* Links */}
                      {part.order === 0 ? (
                        // Preparation part links
                        <div className="flex flex-wrap gap-2 mb-3">
                          {part.reading_before_sleep_link && (
                            <a
                              href={part.reading_before_sleep_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700 hover:bg-purple-200"
                            >
                              📖 Reading before Sleep
                            </a>
                          )}
                          {part.lesson_preparation_link && (
                            <a
                              href={part.lesson_preparation_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700 hover:bg-purple-200"
                            >
                              📝 Lesson Preparation
                            </a>
                          )}
                        </div>
                      ) : (
                        // Regular part links
                        (part.excerpts_link || part.transcript_link || part.lesson_link || part.program_link || part.custom_links) && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {part.excerpts_link && (
                              <a
                                href={part.excerpts_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700 hover:bg-purple-200"
                              >
                                Excerpts
                              </a>
                            )}
                            {part.transcript_link && (
                              <a
                                href={part.transcript_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
                              >
                                Transcript
                              </a>
                            )}
                            {part.lesson_link && (
                              <a
                                href={part.lesson_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                              >
                                Lesson
                              </a>
                            )}
                            {part.program_link && (
                              <a
                                href={part.program_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                              >
                                Program
                              </a>
                            )}
                            {part.custom_links && part.custom_links.map((link, idx) => (
                              <a
                                key={idx}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded hover:bg-teal-200"
                                title={link.url}
                              >
                                {link.title}
                              </a>
                            ))}
                          </div>
                        )
                      )}

                      {/* Sources */}
                      {part.sources && part.sources.length > 0 && (
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">Sources:</div>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {part.sources.map((source, idx) => (
                              <li key={idx}>
                                • <a 
                                    href={source.source_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    {source.source_title}
                                  </a>
                                {source.page_number && (
                                  <span className="text-gray-500"> (p. {source.page_number})</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}


