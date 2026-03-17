'use client'

import { useState, useEffect } from 'react'
import { getApiUrl } from '@/lib/api'

interface EventType {
  id: string
  name: string
  titles: Record<string, string>
  color: string
}

interface EventTypeBadgeProps {
  type: string
  language?: string
}

// Static fallback map for colors and labels (used while loading or if API unavailable)
const FALLBACK_COLORS: Record<string, string> = {
  morning_lesson: 'bg-blue-100 text-blue-800',
  noon_lesson: 'bg-amber-100 text-amber-800',
  evening_lesson: 'bg-indigo-100 text-indigo-800',
  meal: 'bg-green-100 text-green-800',
  convention: 'bg-purple-100 text-purple-800',
  lecture: 'bg-yellow-100 text-yellow-800',
  other: 'bg-gray-100 text-gray-800',
}

const COLOR_CLASSES: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-800',
  amber: 'bg-amber-100 text-amber-800',
  indigo: 'bg-indigo-100 text-indigo-800',
  green: 'bg-green-100 text-green-800',
  purple: 'bg-purple-100 text-purple-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-800',
  pink: 'bg-pink-100 text-pink-800',
  teal: 'bg-teal-100 text-teal-800',
  orange: 'bg-orange-100 text-orange-800',
  gray: 'bg-gray-100 text-gray-800',
}

// Module-level cache so all badge instances share one fetch
let eventTypesCache: EventType[] | null = null
let fetchPromise: Promise<EventType[]> | null = null

function fetchEventTypes(): Promise<EventType[]> {
  if (eventTypesCache) return Promise.resolve(eventTypesCache)
  if (!fetchPromise) {
    fetchPromise = fetch(getApiUrl('/event-types'))
      .then((res) => (res.ok ? res.json() : []))
      .then((data: EventType[]) => {
        eventTypesCache = data || []
        return eventTypesCache
      })
      .catch(() => {
        fetchPromise = null
        return []
      })
  }
  return fetchPromise
}

export default function EventTypeBadge({ type, language = 'en' }: EventTypeBadgeProps) {
  const [eventType, setEventType] = useState<EventType | null>(null)

  useEffect(() => {
    fetchEventTypes().then((types) => {
      const found = types.find((t) => t.name === type)
      if (found) setEventType(found)
    })
  }, [type])

  const colorClass = eventType
    ? (COLOR_CLASSES[eventType.color] ?? 'bg-gray-100 text-gray-800')
    : (FALLBACK_COLORS[type] ?? 'bg-gray-100 text-gray-800')

  const label = eventType
    ? (eventType.titles[language] || eventType.titles['en'] || eventType.name)
    : type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  )
}
