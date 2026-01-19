'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { getApiUrl } from '@/lib/api'
import Link from 'next/link'
import EventTypeBadge from '@/components/EventTypeBadge'
import PartForm from '@/components/PartForm'
import { SourceSearch } from '@/components/SourceSearch'
import { 
  Mail, 
  ChevronLeft,
  Plus,
  GripVertical,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  Check,
  X,
  Calendar,
  Clock,
  Hash,
  Globe,
  Save,
  BookOpen,
  Video,
  FileText,
  Headphones,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  Search,
  ExternalLink,
  Copy,
  Send,
  RefreshCw,
} from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'

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
  start_point?: string
  end_point?: string
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
  recorded_lesson_link?: string
  recorded_lesson_date?: string
  custom_links?: CustomLink[]
}

export default function EventDetailPage() {
  return (
    <ProtectedRoute>
      <EventDetailPageContent />
    </ProtectedRoute>
  )
}

function EventDetailPageContent() {
  const params = useParams()
  const eventId = params.id as string
  const { user, logout } = useAuth()

  const [event, setEvent] = useState<Event | null>(null)
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showPartForm, setShowPartForm] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('he')
  const [editingPartId, setEditingPartId] = useState<string | null>(null)
  const [editedPart, setEditedPart] = useState<Part | null>(null)
  const [originalPart, setOriginalPart] = useState<Part | null>(null)
  const [editingEvent, setEditingEvent] = useState(false)
  const [showTitleEdit, setShowTitleEdit] = useState(false)
  const [editedTitles, setEditedTitles] = useState<{ [key: string]: string }>({})
  const [editingOrder, setEditingOrder] = useState(false)
  const [newOrder, setNewOrder] = useState(0)
  const [editingTimes, setEditingTimes] = useState(false)
  const [newStartTime, setNewStartTime] = useState('')
  const [newEndTime, setNewEndTime] = useState('')
  const [editEventDate, setEditEventDate] = useState('')
  const [editEventStartTime, setEditEventStartTime] = useState('')
  const [editEventEndTime, setEditEventEndTime] = useState('')
  const [editEventTitles, setEditEventTitles] = useState<{ [key: string]: string }>({})
  const [emailSentAt, setEmailSentAt] = useState<string | null>(null)

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

  const getColorClasses = (part: Part) => {
    if (part.order === 0) {
      return {
        bg: 'bg-purple-500',
        text: 'text-purple-700',
        border: 'border-purple-500',
        light: 'bg-purple-50',
      }
    }
    const colors = [
      { bg: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-500', light: 'bg-blue-50' },
      { bg: 'bg-green-500', text: 'text-green-700', border: 'border-green-500', light: 'bg-green-50' },
      { bg: 'bg-orange-500', text: 'text-orange-700', border: 'border-orange-500', light: 'bg-orange-50' },
    ]
    return colors[part.order % colors.length]
  }


  useEffect(() => {
    fetchEventAndParts()
  }, [eventId, selectedLanguage])

  const fetchEventAndParts = async () => {
    try {
      // Fetch event
      const eventRes = await fetch(getApiUrl(`/events/${eventId}`))
      if (!eventRes.ok) {
        throw new Error('Event not found')
      }
      const eventData = await eventRes.json()
      setEvent(eventData)

      // Set email status if available
      if (eventData.email_sent_at) {
        setEmailSentAt(eventData.email_sent_at)
      }

      // Fetch parts for this event with language filter
      const partsRes = await fetch(getApiUrl(`/events/${eventId}/parts?language=${selectedLanguage}`))
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
    setOriginalPart({...part})
  }

  const cancelEdit = () => {
    setEditingPartId(null)
    setEditedPart(null)
    setOriginalPart(null)
  }

  const hasChanges = () => {
    if (!editedPart || !originalPart) return false
    return JSON.stringify(editedPart) !== JSON.stringify(originalPart)
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
        getApiUrl(`/sources/title?id=${source.source_id}&language=${editedPart.language}`)
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
      const response = await fetch(getApiUrl(`/parts/${editedPart.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editedPart.title,
          description: editedPart.description,
          order: editedPart.order,
          sources: editedPart.sources,
          excerpts_link: editedPart.excerpts_link || '',
          transcript_link: editedPart.transcript_link || '',
          lesson_link: editedPart.lesson_link || '',
          program_link: editedPart.program_link || '',
          reading_before_sleep_link: editedPart.reading_before_sleep_link || '',
          lesson_preparation_link: editedPart.lesson_preparation_link || '',
          recorded_lesson_link: editedPart.recorded_lesson_link || '',
          recorded_lesson_date: editedPart.recorded_lesson_date || '',
          custom_links: editedPart.custom_links || [],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to update part: ${response.status} ${errorText}`)
      }

      // Refresh parts
      await fetchEventAndParts()
      cancelEdit()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save part'
      alert(errorMsg)
      console.error('Save part error:', err)
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
      const response = await fetch(getApiUrl(`/parts/${partId}`), {
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
      const response = await fetch(getApiUrl(`/events/${eventId}`), {
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
      const response = await fetch(getApiUrl(`/events/${eventId}/duplicate`), {
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
      const response = await fetch(getApiUrl(`/events/${eventId}/toggle-public`), {
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

  const updateEventDetails = async (updates: any) => {
    if (!event) return

    try {
      const response = await fetch(getApiUrl(`/events/${eventId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update event')
      }

      // Refresh event data
      await fetchEventAndParts()
      setEditingEvent(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update event')
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
      const response = await fetch(getApiUrl(`/events/${eventId}`), {
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
      const response = await fetch(getApiUrl(`/events/${eventId}`), {
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
      const response = await fetch(getApiUrl(`/events/${eventId}`), {
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

  const sendEventEmail = async (isUpdate: boolean = false) => {
    if (!event) return

    try {
      const response = await fetch(getApiUrl(`/events/${event.id}/send-email`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_update: isUpdate }),
      })

      const data = await response.json()

      if (data.already_sent && !isUpdate) {
        setEmailSentAt(data.sent_at)
        alert('Email already sent on: ' + new Date(data.sent_at).toLocaleString())
      } else if (data.success) {
        setEmailSentAt(data.sent_at)
        if (isUpdate) {
          alert('Update email sent successfully!')
        } else {
          alert('Email sent successfully!')
          await fetchEventAndParts() // Refresh to get updated email_sent_at
        }
      }
    } catch (err) {
      alert('Failed to send email: ' + (err instanceof Error ? err.message : 'Unknown error'))
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

  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
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
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="font-bold text-blue-900" style={{ fontSize: '16px' }}>
                  Study Materials Admin
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-700" style={{ fontSize: '14px' }}>
                {user?.name}
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Back Button */}
        <button className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 transition-colors" style={{ fontSize: '14px' }}>
          <ChevronLeft className="w-4 h-4" />
          <Link href="/events" className="flex items-center gap-2">
            ← Back to Events
          </Link>
        </button>

        {/* Event Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            {/* Title Row with Badges */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {event.type.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                    Event #{event.number}
                  </span>
                </div>
                <h2 className="text-gray-900 mb-1" style={{ fontSize: '18px', fontWeight: '600' }}>
                  {editingEvent ? (
                    <input 
                      type="date" 
                      value={editEventDate}
                      onChange={(e) => setEditEventDate(e.target.value)}
                      className="border-2 border-blue-500 rounded px-2 py-1"
                      autoFocus
                    />
                  ) : (
                    formatDate(event.date)
                  )}
                </h2>
                <div className="flex items-center gap-4 text-gray-500" style={{ fontSize: '13px' }}>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{event.start_time && event.end_time ? `${event.start_time} - ${event.end_time}` : 'Not set'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Hash className="w-4 h-4" />
                    <span>Display Order: {event.order}</span>
                  </div>
                  {emailSentAt && (
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      <span>{new Date(emailSentAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Public/Private Toggle */}
              <button
                onClick={togglePublic}
                className={`px-4 py-2 rounded-lg border-2 transition-all flex items-center gap-2 ${
                  event.public
                    ? 'bg-green-50 border-green-500 text-green-700'
                    : 'bg-gray-50 border-gray-300 text-gray-600'
                }`}
                style={{ fontSize: '13px' }}
              >
                {event.public ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span>{event.public ? 'Public' : 'Private'}</span>
              </button>
            </div>

            {/* Event Actions Row */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => sendEventEmail(false)}
                  disabled={!!emailSentAt}
                  className="px-3 py-1.5 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontSize: '12px' }}
                >
                  <Send className="w-3.5 h-3.5" />
                  Send Mail
                </button>

                {emailSentAt && (
                  <button
                    onClick={() => sendEventEmail(true)}
                    className="px-3 py-1.5 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-2"
                    style={{ fontSize: '12px' }}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Update Mail
                  </button>
                )}
              </div>

              {/* Edit, Duplicate, Delete Buttons */}
              <div className="flex items-center gap-2">
                {editingEvent && (
                  <button
                    onClick={() => {
                      updateEventDetails({
                        date: editEventDate,
                        start_time: editEventStartTime || undefined,
                        end_time: editEventEndTime || undefined,
                        titles: editEventTitles,
                      })
                    }}
                    className="px-3 py-1.5 rounded-lg border-2 border-green-500 bg-green-50 text-green-700 hover:bg-green-100 transition-all flex items-center gap-2"
                    style={{ fontSize: '12px' }}
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    if (editingEvent && event) {
                      setEditEventDate(event.date)
                      setEditEventStartTime(event.start_time || '')
                      setEditEventEndTime(event.end_time || '')
                      setEditEventTitles(event.titles || {})
                    } else if (!editingEvent && event) {
                      setEditEventDate(formatDateForInput(event.date))
                      setEditEventStartTime(event.start_time || '')
                      setEditEventEndTime(event.end_time || '')
                      setEditEventTitles(event.titles || {})
                    }
                    setEditingEvent(!editingEvent)
                  }}
                  className={`px-3 py-1.5 rounded-lg border-2 transition-all flex items-center gap-2 ${
                    editingEvent
                      ? 'border-gray-300 text-gray-600 hover:bg-gray-100'
                      : 'border-blue-300 text-blue-700 hover:bg-blue-50'
                  }`}
                  style={{ fontSize: '12px' }}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{editingEvent ? 'Cancel' : 'Edit'}</span>
                </button>
                <button
                  onClick={duplicateEvent}
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                  style={{ fontSize: '12px' }}
                >
                  <Copy className="w-3.5 h-3.5" />
                  Duplicate
                </button>
                <button
                  onClick={deleteEvent}
                  className="px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
                  style={{ fontSize: '12px' }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Event
                </button>
              </div>
            </div>

            {/* Language Selector - Horizontal Pills */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-gray-600 text-xs font-medium mr-2">Select Language:</span>
                {Object.entries(languageNames).map(([code, name]) => (
                  <button
                    key={code}
                    onClick={() => setSelectedLanguage(code)}
                    className={`px-2.5 py-1.5 rounded transition-all text-xs font-medium ${
                      selectedLanguage === code
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {name.split(' ')[1]}
                  </button>
                ))}
              </div>
            </div>

            {/* Event Edit Mode */}
            {editingEvent && (
              <div className="pt-4 border-t border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">Edit Event Details</h3>
                <div className="space-y-4">
                  {/* Date */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-xs">Event Date *</label>
                    <input
                      type="date"
                      value={editEventDate}
                      onChange={(e) => setEditEventDate(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                    />
                  </div>

                  {/* Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2 text-xs">Start Time</label>
                      <input
                        type="time"
                        value={editEventStartTime}
                        onChange={(e) => setEditEventStartTime(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2 text-xs">End Time</label>
                      <input
                        type="time"
                        value={editEventEndTime}
                        onChange={(e) => setEditEventEndTime(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                      />
                    </div>
                  </div>

                  {/* Titles by Language */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-xs">Event Titles</label>
                    <div className="space-y-2">
                      {Object.entries(languageNames).map(([code, name]) => (
                        <div key={code}>
                          <label className="block text-gray-600 text-xs mb-1">{name}</label>
                          <input
                            type="text"
                            value={editEventTitles[code] || ''}
                            onChange={(e) => setEditEventTitles({...editEventTitles, [code]: e.target.value})}
                            placeholder={`Title in ${name}`}
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Parts Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Header */}
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900" style={{ fontSize: '16px' }}>
                Lesson Parts ({parts.length})
              </h3>
              <p className="text-gray-500 mt-1" style={{ fontSize: '13px' }}>
                Drag to reorder • Click to expand/collapse
              </p>
            </div>
            {!showPartForm && (
              <button
                onClick={() => setShowPartForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                style={{ fontSize: '14px' }}
              >
                <Plus className="w-4 h-4" />
                Add Part
              </button>
            )}
          </div>

          {/* Part Form */}
          {showPartForm && (
            <div className="p-6 bg-blue-50 border-t border-blue-200">
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

          {/* Parts List */}
          {parts.length === 0 && !showPartForm ? (
            <div className="text-center py-12 bg-gray-50">
              <p className="text-gray-500 mb-4">No parts yet for this event</p>
              <button
                onClick={() => setShowPartForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                Add First Part
              </button>
            </div>
          ) : parts.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {parts.map((part) => {
                const isEditing = editingPartId === part.id
                const colors = getColorClasses(part)

                return (
                  <div key={part.id}>
                    {/* Header - Always visible */}
                    <div className={`p-4 flex items-center gap-4 transition ${isEditing ? 'bg-blue-50 border-b-2 border-blue-500' : 'hover:bg-gray-50 border-b border-gray-100'}`}>
                      {/* Drag Handle */}
                      <button className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-5 h-5" />
                      </button>

                      {/* Part Number Badge */}
                      <div className={`w-10 h-10 rounded-lg ${colors.bg} text-white flex items-center justify-center flex-shrink-0 shadow-sm font-bold`}>
                        {part.order}
                      </div>

                      {/* Content - clickable to open edit */}
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => !isEditing && startEdit(part)}>
                        <h4 className={`font-bold ${colors.text}`} style={{ fontSize: '15px' }}>
                          {isEditing ? 'Editing...' : part.title}
                        </h4>
                        <p className="text-gray-500 text-xs">
                          {part.sources.length} source{part.sources.length !== 1 ? 's' : ''} • {part.custom_links?.length || 0} custom link{(part.custom_links?.length || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>

                      {/* Actions - Delete always visible */}
                      {!isEditing && (
                        <button
                          onClick={() => deletePart(part.id, part.title, part.language)}
                          className="p-2 hover:bg-white rounded-lg transition-colors text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Edit View - Only when editing */}
                    {isEditing && (
                      <div className="p-6 bg-gray-50 border-b border-gray-100">
                        <div className="space-y-4">
                          {/* Part Number & Part Type in 2-column grid */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-gray-700 font-medium mb-2 text-xs">Part Number *</label>
                              <input
                                type="number"
                                min="0"
                                value={editedPart ? editedPart.order : part.order}
                                onChange={(e) => editedPart && updateEditedField('order', parseInt(e.target.value) || 0)}
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                              />
                              <p className="text-gray-400 text-xs mt-1">0 = Preparation, 1+ = Lesson parts</p>
                            </div>
                            <div>
                              <label className="block text-gray-700 font-medium mb-2 text-xs">Part Type</label>
                              <select
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                              >
                                <option>Live Lesson</option>
                                <option>Reading Before Sleep</option>
                                <option>TES Lesson</option>
                                <option>Zohar Reading</option>
                              </select>
                            </div>
                          </div>

                          {/* Title */}
                          <div>
                            <label className="block text-gray-700 font-medium mb-2 text-xs">Title *</label>
                            <div className="flex gap-2 mb-2 flex-wrap">
                              {[
                                { id: 'recorded', he: 'שיעור מוקלט' },
                                { id: 'live', he: 'שיעור חי בהשתתפות הרב' },
                                { id: 'tes', he: 'שיעור תע"ס עם הרב"ש' },
                                { id: 'zohar', he: 'קוראים בזוהר' },
                                { id: 'society', he: 'בונים חברה רוחנית' },
                              ].map((template) => (
                                <button
                                  key={template.id}
                                  type="button"
                                  onClick={() => editedPart && updateEditedField('title', template.he)}
                                  className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs border border-blue-200"
                                >
                                  {template.he}
                                </button>
                              ))}
                            </div>
                            <input
                              type="text"
                              value={editedPart ? editedPart.title : part.title}
                              onChange={(e) => editedPart && updateEditedField('title', e.target.value)}
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                              placeholder="Or type custom title..."
                            />
                          </div>

                          {/* Description */}
                          <div>
                            <label className="block text-gray-700 font-medium mb-2 text-xs">Description</label>
                            <textarea
                              value={editedPart ? editedPart.description : part.description}
                              onChange={(e) => editedPart && updateEditedField('description', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm resize-none"
                              placeholder="Brief description of the lesson part..."
                            />
                          </div>

                          {/* Recorded Lesson Date */}
                          {(editedPart ? editedPart.order : part.order) !== 0 && (
                            <div>
                              <label className="block text-gray-700 font-medium mb-2 text-xs">Original Lesson Date</label>
                              <input
                                type="date"
                                value={editedPart ? (editedPart.recorded_lesson_date ? new Date(editedPart.recorded_lesson_date).toISOString().split('T')[0] : '') : (part.recorded_lesson_date ? new Date(part.recorded_lesson_date).toISOString().split('T')[0] : '')}
                                onChange={(e) => editedPart && updateEditedField('recorded_lesson_date', e.target.value ? new Date(e.target.value).toISOString() : '')}
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                              />
                              <p className="text-gray-400 text-xs mt-1">Format: M/D/YYYY (e.g., 1/5/2003)</p>
                            </div>
                          )}

                          {/* Quick Links - 2-column grid */}
                          {(editedPart ? editedPart.order : part.order) !== 0 && (
                            <div>
                              <label className="block text-gray-700 font-medium mb-3 text-xs">Quick Links</label>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-gray-600 text-xs mb-1.5 font-medium">Excerpt Link</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="url"
                                      value={editedPart ? editedPart.excerpts_link || '' : part.excerpts_link || ''}
                                      onChange={(e) => editedPart && updateEditedField('excerpts_link', e.target.value)}
                                      className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                      placeholder="https://..."
                                      
                                    />
                                    {(editedPart ? editedPart.excerpts_link : part.excerpts_link) && (
                                      <a
                                        href={editedPart ? editedPart.excerpts_link : part.excerpts_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
                                        title="Open link"
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-gray-600 text-xs mb-1.5 font-medium">Transcript Link</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="url"
                                      value={editedPart ? editedPart.transcript_link || '' : part.transcript_link || ''}
                                      onChange={(e) => editedPart && updateEditedField('transcript_link', e.target.value)}
                                      className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                      placeholder="https://..."
                                      
                                    />
                                    {(editedPart ? editedPart.transcript_link : part.transcript_link) && (
                                      <a
                                        href={editedPart ? editedPart.transcript_link : part.transcript_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
                                        title="Open link"
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-gray-600 text-xs mb-1.5 font-medium">Lesson Link</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="url"
                                      value={editedPart ? editedPart.lesson_link || '' : part.lesson_link || ''}
                                      onChange={(e) => editedPart && updateEditedField('lesson_link', e.target.value)}
                                      className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                      placeholder="https://..."
                                      
                                    />
                                    {(editedPart ? editedPart.lesson_link : part.lesson_link) && (
                                      <a
                                        href={editedPart ? editedPart.lesson_link : part.lesson_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
                                        title="Open link"
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-gray-600 text-xs mb-1.5 font-medium">Program Link</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="url"
                                      value={editedPart ? editedPart.program_link || '' : part.program_link || ''}
                                      onChange={(e) => editedPart && updateEditedField('program_link', e.target.value)}
                                      className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                      placeholder="https://..."
                                      
                                    />
                                    {(editedPart ? editedPart.program_link : part.program_link) && (
                                      <a
                                        href={editedPart ? editedPart.program_link : part.program_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
                                        title="Open link"
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Custom Links */}
                          {(editedPart ? editedPart.order : part.order) !== 0 && editingPartId === part.id && editedPart && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-gray-700 font-medium text-xs">Custom Links (Language-Specific)</label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedLinks = [...(editedPart.custom_links || []), { title: '', url: '' }]
                                    updateEditedField('custom_links', updatedLinks)
                                  }}
                                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" />
                                  Add Link
                                </button>
                              </div>
                              <div className="space-y-2">
                                {editedPart.custom_links && editedPart.custom_links.length > 0 && (
                                  editedPart.custom_links.map((link, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={link.title}
                                        onChange={(e) => {
                                          const updatedLinks = [...(editedPart.custom_links || [])]
                                          updatedLinks[idx] = { ...updatedLinks[idx], title: e.target.value }
                                          updateEditedField('custom_links', updatedLinks)
                                        }}
                                        className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                                        placeholder="Link title"
                                      />
                                      <input
                                        type="url"
                                        value={link.url}
                                        onChange={(e) => {
                                          const updatedLinks = [...(editedPart.custom_links || [])]
                                          updatedLinks[idx] = { ...updatedLinks[idx], url: e.target.value }
                                          updateEditedField('custom_links', updatedLinks)
                                        }}
                                        className="flex-[2] px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                                        placeholder="https://..."
                                      />
                                      {link.url && (
                                        <a
                                          href={link.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
                                          title="Open link"
                                        >
                                          <ExternalLink className="w-4 h-4" />
                                        </a>
                                      )}
                                      <button
                                        onClick={() => {
                                          const updatedLinks = editedPart.custom_links?.filter((_, i) => i !== idx) || []
                                          updateEditedField('custom_links', updatedLinks)
                                        }}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}

                          {/* Preparation part special links */}
                          {(editedPart ? editedPart.order : part.order) === 0 && (
                            <div>
                              <label className="block text-gray-700 font-medium mb-3 text-xs">Quick Links</label>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-gray-600 text-xs mb-1.5 font-medium">Reading Before Sleep</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="url"
                                      value={editedPart ? editedPart.reading_before_sleep_link || '' : part.reading_before_sleep_link || ''}
                                      onChange={(e) => editedPart && updateEditedField('reading_before_sleep_link', e.target.value)}
                                      className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                      placeholder="https://..."
                                      
                                    />
                                    {(editedPart ? editedPart.reading_before_sleep_link : part.reading_before_sleep_link) && (
                                      <a
                                        href={editedPart ? editedPart.reading_before_sleep_link : part.reading_before_sleep_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
                                        title="Open link"
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-gray-600 text-xs mb-1.5 font-medium">Lesson Preparation</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="url"
                                      value={editedPart ? editedPart.lesson_preparation_link || '' : part.lesson_preparation_link || ''}
                                      onChange={(e) => editedPart && updateEditedField('lesson_preparation_link', e.target.value)}
                                      className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                      placeholder="https://..."
                                      
                                    />
                                    {(editedPart ? editedPart.lesson_preparation_link : part.lesson_preparation_link) && (
                                      <a
                                        href={editedPart ? editedPart.lesson_preparation_link : part.lesson_preparation_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
                                        title="Open link"
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Sources Management */}
                          <div>
                            <label className="block text-gray-700 font-medium mb-2 text-xs">Sources</label>
                            
                            {(editedPart ? editedPart.language : part.language) === 'he' && editingPartId === part.id && (
                              <div className="mb-3">
                                <SourceSearch onSelect={handleAddSourceInEdit} />
                              </div>
                            )}

                            {/* Existing sources */}
                            {(editedPart ? editedPart.sources : part.sources) && (editedPart ? editedPart.sources : part.sources).length > 0 && (
                              <div className="space-y-2 mb-3">
                                {(editedPart ? editedPart.sources : part.sources).map((source, idx) => (
                                  <div key={idx} className="flex items-start gap-2 p-3 bg-white border border-gray-200 rounded-lg">
                                    <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-gray-800 block truncate">
                                        {source.source_title}
                                      </p>
                                      <div className="mt-2 space-y-2">
                                        <input
                                          type="url"
                                          value={source.source_url || ''}
                                          onChange={(e) => handleUpdateSourceInEdit(idx, 'source_url', e.target.value)}
                                          className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                                          placeholder="Source link (https://...)"
                                        />
                                        <input
                                          type="text"
                                          value={source.page_number || ''}
                                          onChange={(e) => handleUpdateSourceInEdit(idx, 'page_number', e.target.value)}
                                          className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                                          placeholder="Page number (e.g., 42 or 15-17)"
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                          <input
                                            type="text"
                                            value={source.start_point || ''}
                                            onChange={(e) => handleUpdateSourceInEdit(idx, 'start_point', e.target.value)}
                                            className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                                            placeholder="Start From"
                                          />
                                          <input
                                            type="text"
                                            value={source.end_point || ''}
                                            onChange={(e) => handleUpdateSourceInEdit(idx, 'end_point', e.target.value)}
                                            className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                                            placeholder="End Point"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                    <a 
                                      href={source.source_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
                                      title={source.source_url}
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                    <button
                                      onClick={() => handleRemoveSourceInEdit(idx)}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Empty state */}
                            {!(editedPart ? editedPart.sources : part.sources) || (editedPart ? editedPart.sources : part.sources).length === 0 ? (
                              <div className="p-4 bg-white border-2 border-dashed border-gray-300 rounded-lg text-center">
                                <BookOpen className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-500 text-xs">
                                  {(editedPart ? editedPart.language : part.language) === 'he' && editingPartId === part.id ? 'No sources added yet. Search above to add sources.' : 'No sources added yet.'}
                                </p>
                              </div>
                            ) : null}
                          </div>
                          
                          {/* Action buttons */}
                          <div className="flex gap-3 pt-4 border-t border-gray-200">
                            <button
                              onClick={savePart}
                              disabled={!hasChanges()}
                              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
