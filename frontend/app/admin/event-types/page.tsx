'use client'

import { useState, useEffect } from 'react'
import { getApiUrl } from '@/lib/api'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
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

interface EventType {
  id: string
  name: string
  titles: { [lang: string]: string }
  color: string
  order: number
}

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

export function getColorClasses(color: string): string {
  return COLOR_OPTIONS.find((c) => c.value === color)?.classes ?? 'bg-gray-100 text-gray-800'
}

function SortableEventTypeRow({
  eventType,
  onDelete,
}: {
  eventType: EventType
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: eventType.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const displayTitle = eventType.titles?.en || eventType.titles?.he || eventType.name

  return (
    <tr ref={setNodeRef} style={style} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
      <td className="px-4 py-3 w-10">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          title="Drag to reorder"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="4" cy="4" r="1.5" />
            <circle cx="4" cy="8" r="1.5" />
            <circle cx="4" cy="12" r="1.5" />
            <circle cx="12" cy="4" r="1.5" />
            <circle cx="12" cy="8" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
          </svg>
        </div>
      </td>
      <td className="px-4 py-3">
        <code className="text-sm bg-gray-100 px-2 py-0.5 rounded font-mono">{eventType.name}</code>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColorClasses(eventType.color)}`}>
          {displayTitle}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {Object.entries(eventType.titles || {})
          .slice(0, 3)
          .map(([lang, title]) => `${lang}: ${title}`)
          .join(' · ')}
        {Object.keys(eventType.titles || {}).length > 3 && ' …'}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/admin/event-types/${eventType.id}`}
            className="px-3 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition"
          >
            Edit
          </Link>
          <button
            onClick={() => onDelete(eventType.id)}
            className="px-3 py-1.5 text-sm bg-red-50 hover:bg-red-100 text-red-700 rounded-md transition"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function EventTypesPage() {
  return (
    <ProtectedRoute>
      <EventTypesPageContent />
    </ProtectedRoute>
  )
}

function EventTypesPageContent() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    fetchEventTypes()
  }, [])

  const fetchEventTypes = async () => {
    try {
      const res = await fetch(getApiUrl('/event-types'))
      if (!res.ok) throw new Error('Failed to fetch event types')
      const data = await res.json()
      setEventTypes(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    const et = eventTypes.find((e) => e.id === id)
    if (!confirm(`Delete event type "${et?.name}"? Events using this type will keep the name but it won't be selectable for new events.`)) return

    try {
      const res = await fetch(getApiUrl(`/event-types/${id}`), { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete event type')
      setEventTypes((prev) => prev.filter((e) => e.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = eventTypes.findIndex((e) => e.id === active.id)
    const newIndex = eventTypes.findIndex((e) => e.id === over.id)
    const reordered = arrayMove(eventTypes, oldIndex, newIndex)
    setEventTypes(reordered)

    try {
      await Promise.all(
        reordered.map((et, i) =>
          fetch(getApiUrl(`/event-types/${et.id}`), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: i }),
          })
        )
      )
      await fetchEventTypes()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update order')
      await fetchEventTypes()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto text-center py-12 text-gray-600">Loading event types...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href="/admin" className="hover:text-gray-700">Admin</Link>
              <span>/</span>
              <span className="text-gray-700">Event Types</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Event Types</h1>
            <p className="text-gray-600 mt-1">Manage the list of available event categories</p>
          </div>
          <Link
            href="/admin/event-types/create"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg transition"
          >
            + Add Event Type
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {eventTypes.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No event types found.{' '}
              <Link href="/admin/event-types/create" className="text-blue-600 hover:underline">
                Create the first one
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 w-10" />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Badge</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Titles preview</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={eventTypes.map((e) => e.id)} strategy={verticalListSortingStrategy}>
                    {eventTypes.map((et) => (
                      <SortableEventTypeRow key={et.id} eventType={et} onDelete={handleDelete} />
                    ))}
                  </SortableContext>
                </DndContext>
              </tbody>
            </table>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-4 text-center">
          Drag rows to reorder. Changes to existing event types do not affect previously created events.
        </p>
      </div>
    </div>
  )
}
