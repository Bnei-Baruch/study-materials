'use client'

import { useState, useEffect } from 'react'
import { getApiUrl } from '@/lib/api'
import { Plus, Trash2, Edit2 } from 'lucide-react'
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

const LANGUAGES = ['he', 'en', 'ru', 'es', 'de', 'it', 'fr', 'uk', 'tr', 'pt-BR', 'bg'] as const

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

interface EventType {
  id: string
  name: string
  titles: Record<string, string>
  color: string
  order: number
}

function SortableEventTypeRow({
  eventType,
  onEdit,
  onDelete,
}: {
  eventType: EventType
  onEdit: (et: EventType) => void
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
  const selectedColor = COLOR_OPTIONS.find((c) => c.value === eventType.color) || COLOR_OPTIONS[COLOR_OPTIONS.length - 1]

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
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedColor.classes}`}>
          {displayTitle}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
        {Object.entries(eventType.titles || {})
          .slice(0, 3)
          .map(([lang, title]) => `${lang}: ${title}`)
          .join(' · ')}
        {Object.keys(eventType.titles || {}).length > 3 && ' …'}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onEdit(eventType)}
            className="px-2 py-1 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition"
          >
            <Edit2 size={16} />
          </button>
          {!['convention', 'holiday', 'special_event'].includes(eventType.name) && (
            <button
              onClick={() => onDelete(eventType.id)}
              className="px-2 py-1 text-sm bg-red-50 hover:bg-red-100 text-red-700 rounded transition"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

export default function EventTypeManager() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newType, setNewType] = useState<Partial<EventType>>({ color: 'gray', titles: {} })
  const [editingType, setEditingType] = useState<EventType | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

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

  const handleCreateSubmit = async () => {
    setError('')
    if (!newType.name?.trim()) {
      setError('Name is required')
      return
    }
    if (!/^[a-z0-9_]+$/.test(newType.name)) {
      setError('Name must contain only lowercase letters, digits, and underscores')
      return
    }
    if (!Object.values(newType.titles || {}).some((t: any) => t?.trim())) {
      setError('At least one title is required')
      return
    }

    try {
      const res = await fetch(getApiUrl('/event-types'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newType),
      })
      if (!res.ok) throw new Error('Failed to create event type')
      await fetchEventTypes()
      setShowNewForm(false)
      setNewType({ color: 'gray', titles: {} })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event type')
    }
  }

  const handleEditSubmit = async () => {
    if (!editingType) return
    setError('')
    if (!Object.values(editingType.titles || {}).some((t) => t?.trim())) {
      setError('At least one title is required')
      return
    }

    try {
      const res = await fetch(getApiUrl(`/event-types/${editingType.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color: editingType.color, titles: editingType.titles }),
      })
      if (!res.ok) throw new Error('Failed to update event type')
      await fetchEventTypes()
      setEditingId(null)
      setEditingType(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update event type')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(getApiUrl(`/event-types/${id}`), { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete event type')
      await fetchEventTypes()
      setDeleteConfirm(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event type')
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

  if (loading) return <div className="p-6 text-center">Loading event types...</div>

  return (
    <div className="notranslate p-6 bg-white rounded-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Event Types</h2>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}
        <button
          onClick={() => setShowNewForm(true)}
          className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus size={20} />
          Add Event Type
        </button>
      </div>

      {/* New Form */}
      {showNewForm && (
        <div className="mb-8 p-6 border border-gray-300 rounded-lg bg-gray-50">
          <h3 className="text-lg font-bold mb-4">Create New Event Type</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={(newType.name as string) || ''}
              onChange={(e) =>
                setNewType({ ...newType, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })
              }
              placeholder="e.g. workshop"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setNewType({ ...newType, color: c.value })}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition border-2 ${c.classes} ${
                    newType.color === c.value ? 'border-gray-800 scale-105' : 'border-transparent'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-2">
            {LANGUAGES.map((lang) => (
              <div key={lang}>
                <label className="block text-xs text-gray-500 mb-1 uppercase">{lang}</label>
                <input
                  type="text"
                  value={(newType.titles?.[lang] as string) || ''}
                  onChange={(e) =>
                    setNewType({
                      ...newType,
                      titles: { ...(newType.titles || {}), [lang]: e.target.value },
                    })
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreateSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowNewForm(false)
                setError('')
              }}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit Form */}
      {editingType && (
        <div className="mb-8 p-6 border border-gray-300 rounded-lg bg-gray-50">
          <h3 className="text-lg font-bold mb-4">Edit Event Type</h3>
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            Name: <code className="font-mono">{editingType.name}</code> (read-only)
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setEditingType({ ...editingType, color: c.value })}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition border-2 ${c.classes} ${
                    editingType.color === c.value ? 'border-gray-800 scale-105' : 'border-transparent'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-2">
            {LANGUAGES.map((lang) => (
              <div key={lang}>
                <label className="block text-xs text-gray-500 mb-1 uppercase">{lang}</label>
                <input
                  type="text"
                  value={editingType.titles[lang] || ''}
                  onChange={(e) =>
                    setEditingType({
                      ...editingType,
                      titles: { ...editingType.titles, [lang]: e.target.value },
                    })
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleEditSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditingId(null)
                setEditingType(null)
                setError('')
              }}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            {!['convention', 'holiday', 'special_event'].includes(editingType.name) && (
              <button
                onClick={() => setDeleteConfirm(editingType.id)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 ml-auto"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="mb-8 p-4 border border-red-300 rounded-lg bg-red-50">
          <p className="text-red-700 mb-4">
            Delete this event type? Events using it will keep the name but it won't be available for new events.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleDelete(deleteConfirm)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Confirm Delete
            </button>
            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded border border-gray-200 overflow-hidden">
        {eventTypes.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No event types found.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 w-10" />
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Badge</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Titles</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={eventTypes.map((e) => e.id)} strategy={verticalListSortingStrategy}>
                  {eventTypes.map((et) => (
                    <SortableEventTypeRow
                      key={et.id}
                      eventType={et}
                      onEdit={(type) => {
                        setEditingId(type.id)
                        setEditingType(type)
                      }}
                      onDelete={(id) => setDeleteConfirm(id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
