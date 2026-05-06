'use client'

import { useState, useEffect } from 'react'
import { getApiUrl } from '@/lib/api'
import { formatEventDate } from '@/lib/dateUtils'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import TemplateManager from '@/components/TemplateManager'
import EventTypeManager from '@/components/EventTypeManager'

const LANGUAGES = {
  he: '🇮🇱 עברית',
  en: '🇬🇧 English',
  ru: '🇷🇺 Русский',
  es: '🇪🇸 Español',
  de: '🇩🇪 Deutsch',
  it: '🇮🇹 Italiano',
  fr: '🇫🇷 Français',
  uk: '🇺🇦 Українська',
  tr: '🇹🇷 Türkçe',
  'pt-BR': '🇧🇷 Português',
}
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Event {
  id: string
  date: string
  type: string
  number: number
  order: number
  public: boolean
  hide_from_lessons_tab: boolean
  external_id?: string
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
  created_at: string
}

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

// Sortable event item component
function SortableEventItem({ event, language }: { event: Event; language: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: event.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const localeMap: { [key: string]: string } = {
    he: 'he-IL',
    en: 'en-US',
    ru: 'ru-RU',
    es: 'es-ES',
    de: 'de-DE',
    it: 'it-IT',
    fr: 'fr-FR',
    uk: 'uk-UA',
  }

  const formatDate = (dateString: string) => {
    return formatEventDate(dateString, language)
  }

  // Get title in selected language or fallback
  const eventTitle = event.titles?.[language as keyof typeof event.titles] || 
                     event.titles?.he || 
                     getDefaultTitle(event.type, language)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="hover:bg-gray-50 transition border-b border-gray-200 last:border-b-0"
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            {/* Drag handle */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              title="Drag to reorder"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="4" cy="4" r="1.5" />
                <circle cx="4" cy="8" r="1.5" />
                <circle cx="4" cy="12" r="1.5" />
                <circle cx="12" cy="4" r="1.5" />
                <circle cx="12" cy="8" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
              </svg>
            </div>

            {/* Date and title - clickable to navigate */}
            <Link
              href={`/admin/${event.id}`}
              className="flex items-center gap-4 flex-1 min-w-0"
            >
              <div className="text-sm text-gray-500 w-40 shrink-0">
                {formatDate(event.date)}
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-base font-medium text-gray-800 truncate">
                  {eventTitle}
                </span>
                <span className="text-sm text-gray-500 shrink-0">#{event.number}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {event.external_id && (
                  <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200" title="Synced from events.kli.one">
                    sync
                  </span>
                )}
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${event.public ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                  {event.public ? 'public' : 'private'}
                </span>
                {event.hide_from_lessons_tab && (
                  <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                    hidden
                  </span>
                )}
              </div>
            </Link>
          </div>
          <Link
            href={`/admin/${event.id}`}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminPageContent />
    </ProtectedRoute>
  )
}

function AdminPageContent() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [language, setLanguage] = useState('he')
  const [activeTab, setActiveTab] = useState<'events' | 'templates' | 'event-types'>('events')
  const [langOpen, setLangOpen] = useState(false)
  const [filterPublic, setFilterPublic] = useState<'all' | 'public' | 'private'>('all')
  const [filterHidden, setFilterHidden] = useState<'all' | 'hidden' | 'visible'>('all')
  const [filterSync, setFilterSync] = useState<'all' | 'synced' | 'manual'>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [eventTypes, setEventTypes] = useState<Array<{ name: string; titles: { [k: string]: string } }>>([])
  const { user, logout } = useAuth()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    // Load language from localStorage
    const saved = localStorage.getItem('admin-language')
    if (saved) {
      setLanguage(saved)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
    fetch(getApiUrl('/event-types')).then(r => r.json()).then(setEventTypes).catch(() => {})
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await fetch(getApiUrl('/events'))
      if (!response.ok) {
        throw new Error('Failed to fetch events')
      }
      const data = await response.json()
      // Events are already sorted by backend (order asc, then date desc)
      setEvents(data.events || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = events.findIndex((e) => e.id === active.id)
      const newIndex = events.findIndex((e) => e.id === over.id)

      // Optimistically update UI
      const newEvents = arrayMove(events, oldIndex, newIndex)
      setEvents(newEvents)

      // Update order values on backend
      try {
        // Update all affected events with their new order
        for (let i = 0; i < newEvents.length; i++) {
          const eventToUpdate = newEvents[i]
          await fetch(getApiUrl(`/events/${eventToUpdate.id}`), {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ order: i }),
          })
        }
        // Refresh to ensure consistency
        await fetchEvents()
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to update order')
        // Revert on error
        await fetchEvents()
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-gray-600">Loading events...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      {/* Top navigation bar */}
      <div className="fixed top-0 right-0 p-4 flex items-center gap-2 z-50">

        <Link
          href="/admin/create"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200"
        >
          Create Event
        </Link>
        {/* Language selector dropdown */}
        <div className="relative">
          <button
            onClick={() => setLangOpen(o => !o)}
            className="px-3 py-2 bg-white border border-gray-300 hover:border-gray-400 rounded-lg text-sm font-bold text-gray-800 flex items-center gap-1 transition duration-200"
          >
            {language.toUpperCase()}
            <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {langOpen && (
            <>
              <div className="fixed inset-0" onClick={() => setLangOpen(false)} />
              <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
                {Object.entries(LANGUAGES).map(([code, label]) => {
                  const name = label.replace(/^[\p{Emoji}\s]+/u, '')
                  return (
                    <button
                      key={code}
                      onClick={() => {
                        setLanguage(code)
                        localStorage.setItem('admin-language', code)
                        setLangOpen(false)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left"
                    >
                      <span className="font-bold text-gray-800 w-8">{code.toUpperCase()}</span>
                      <span className="text-gray-500 text-sm flex-1">{name}</span>
                      {code === language && <span className="text-gray-800">✓</span>}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition duration-200"
        >
          Logout
        </button>
      </div>

      <div className="max-w-6xl mx-auto">

        {/* Tab Navigation */}
        <div className="mb-8 flex gap-2 border-b border-gray-300">
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'events'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Events
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'templates'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Templates
          </button>
          <button
            onClick={() => setActiveTab('event-types')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'event-types'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Event Types
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <>
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-4 mb-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</span>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="px-2 py-1 rounded-lg text-xs font-medium border border-gray-200 bg-white text-gray-700 focus:outline-none focus:border-blue-400"
              >
                <option value="all">All</option>
                {eventTypes.map(et => (
                  <option key={et.name} value={et.name}>{et.titles?.en || et.name}</option>
                ))}
              </select>
            </div>
            <div className="w-px h-5 bg-gray-200" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Visibility</span>
              {(['all', 'public', 'private'] as const).map(v => (
                <button key={v} onClick={() => setFilterPublic(v)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterPublic === v ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {v === 'all' ? 'All' : v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
            <div className="w-px h-5 bg-gray-200" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Lessons tab</span>
              {(['all', 'visible', 'hidden'] as const).map(v => (
                <button key={v} onClick={() => setFilterHidden(v)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterHidden === v ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {v === 'all' ? 'All' : v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
            <div className="w-px h-5 bg-gray-200" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Source</span>
              {(['all', 'synced', 'manual'] as const).map(v => (
                <button key={v} onClick={() => setFilterSync(v)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterSync === v ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {v === 'all' ? 'All' : v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
            {(filterPublic !== 'all' || filterHidden !== 'all' || filterSync !== 'all' || filterType !== 'all') && (
              <button onClick={() => { setFilterPublic('all'); setFilterHidden('all'); setFilterSync('all'); setFilterType('all') }}
                className="ml-auto text-xs text-gray-400 hover:text-gray-600 underline">
                Clear filters
              </button>
            )}
          </div>

        {(() => {
          const filtered = events.filter(e => {
            if (filterPublic === 'public' && !e.public) return false
            if (filterPublic === 'private' && e.public) return false
            if (filterHidden === 'hidden' && !e.hide_from_lessons_tab) return false
            if (filterHidden === 'visible' && e.hide_from_lessons_tab) return false
            if (filterSync === 'synced' && !e.external_id) return false
            if (filterSync === 'manual' && e.external_id) return false
            if (filterType !== 'all' && e.type !== filterType) return false
            return true
          })
          return filtered.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-gray-500 mb-4">No events found</div>
              <Link href="/admin/create" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200">
                Create Your First Event
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={filtered.map((e) => e.id)} strategy={verticalListSortingStrategy}>
                  {filtered.map((event) => (
                    <SortableEventItem key={event.id} event={event} language={language} />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          )
        })()}
          </>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <TemplateManager />
        )}

        {/* Event Types Tab */}
        {activeTab === 'event-types' && (
          <EventTypeManager />
        )}
      </div>
    </div>
  )
}
