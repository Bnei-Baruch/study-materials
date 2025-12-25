'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
function SortableEventItem({ event }: { event: Event }) {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date)
  }

  // Get title in Hebrew (default) or fallback to generated title
  const eventTitle = event.titles?.he || getDefaultTitle(event.type, 'he')

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
              href={`/events/${event.id}`}
              className="flex items-center gap-4 flex-1"
            >
              <div className="text-sm text-gray-500 w-40">
                {formatDate(event.date)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-medium text-gray-800">
                  {eventTitle}
                </span>
                <span className="text-sm text-gray-500">#{event.number}</span>
              </div>
            </Link>
          </div>
          <Link
            href={`/events/${event.id}`}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/events')
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
          await fetch(`http://localhost:8080/api/events/${eventToUpdate.id}`, {
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
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Events</h1>
            <p className="text-gray-600">
              Daily lessons, meals, conventions, and more
            </p>
          </div>
          <Link
            href="/events/create"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
          >
            Create Event
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {events.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-500 mb-4">No events yet</div>
            <Link
              href="/events/create"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              Create Your First Event
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={events.map((e) => e.id)}
                strategy={verticalListSortingStrategy}
              >
                {events.map((event) => (
                  <SortableEventItem key={event.id} event={event} />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>
    </div>
  )
}

