'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Event {
  id: string
  date: string
  type: string
  number: number
  created_at: string
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
      // Sort by date descending (newest first)
      const sorted = (data.events || []).sort((a: Event, b: Event) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      setEvents(sorted)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
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
            <div className="divide-y divide-gray-200">
              {events.map((event) => {
                const formatDate = (dateString: string) => {
                  const date = new Date(dateString)
                  return new Intl.DateTimeFormat('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  }).format(date)
                }

                const eventTypeColors = {
                  daily_lesson: 'bg-blue-100 text-blue-800',
                  meal: 'bg-green-100 text-green-800',
                  convention: 'bg-purple-100 text-purple-800',
                  lecture: 'bg-yellow-100 text-yellow-800',
                  other: 'bg-gray-100 text-gray-800',
                }

                const eventTypeLabels = {
                  daily_lesson: 'Daily Lesson',
                  meal: 'Meal',
                  convention: 'Convention',
                  lecture: 'Lecture',
                  other: 'Other',
                }

                const colorClass = eventTypeColors[event.type as keyof typeof eventTypeColors] || eventTypeColors.other
                const label = eventTypeLabels[event.type as keyof typeof eventTypeLabels] || event.type

                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="block hover:bg-gray-50 transition"
                  >
                    <div className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="text-sm text-gray-500 w-32">
                            {formatDate(event.date)}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
                              {label}
                            </span>
                            <span className="text-sm text-gray-600">#{event.number}</span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-400">
                          →
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
