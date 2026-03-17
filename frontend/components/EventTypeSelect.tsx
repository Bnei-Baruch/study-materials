'use client'

import { useState, useEffect } from 'react'
import { getApiUrl } from '@/lib/api'

interface EventType {
  id: string
  name: string
  titles: Record<string, string>
  color: string
}

interface EventTypeSelectProps {
  value: string
  onChange: (value: string) => void
  language?: string
  className?: string
  required?: boolean
}

export default function EventTypeSelect({
  value,
  onChange,
  language = 'en',
  className = '',
  required = false,
}: EventTypeSelectProps) {
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(getApiUrl('/event-types'))
      .then((res) => (res.ok ? res.json() : []))
      .then((data: EventType[]) => setEventTypes(data || []))
      .catch(() => setEventTypes([]))
      .finally(() => setLoading(false))
  }, [])

  const getLabel = (et: EventType) =>
    et.titles[language] || et.titles['en'] || et.name

  if (loading) {
    return (
      <select disabled className={`border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-400 ${className}`}>
        <option>Loading...</option>
      </select>
    )
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className={`border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    >
      {eventTypes.map((et) => (
        <option key={et.id} value={et.name}>
          {getLabel(et)}
        </option>
      ))}
    </select>
  )
}
