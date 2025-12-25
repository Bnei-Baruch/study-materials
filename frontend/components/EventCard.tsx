import Link from 'next/link'
import EventTypeBadge from './EventTypeBadge'

interface Event {
  id: string
  date: string
  type: string
  number: number
  created_at: string
}

interface EventCardProps {
  event: Event
}

export default function EventCard({ event }: EventCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  }

  return (
    <Link href={`/events/${event.id}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition cursor-pointer">
        <div className="flex items-center justify-between mb-3">
          <EventTypeBadge type={event.type} />
          {event.number > 1 && (
            <span className="text-sm font-semibold text-gray-600">#{event.number}</span>
          )}
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {formatDate(event.date)}
        </h3>
        <p className="text-sm text-gray-500">
          Event ID: {event.id.substring(0, 8)}...
        </p>
      </div>
    </Link>
  )
}


