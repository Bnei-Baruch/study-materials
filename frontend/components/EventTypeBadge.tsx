interface EventTypeBadgeProps {
  type: string
}

export default function EventTypeBadge({ type }: EventTypeBadgeProps) {
  const colors: { [key: string]: string } = {
    morning_lesson: 'bg-blue-100 text-blue-800',
    noon_lesson: 'bg-amber-100 text-amber-800',
    evening_lesson: 'bg-indigo-100 text-indigo-800',
    meal: 'bg-green-100 text-green-800',
    convention: 'bg-purple-100 text-purple-800',
    lecture: 'bg-yellow-100 text-yellow-800',
    other: 'bg-gray-100 text-gray-800',
  }

  const labels: { [key: string]: string } = {
    morning_lesson: 'Morning Lesson',
    noon_lesson: 'Noon Lesson',
    evening_lesson: 'Evening Lesson',
    meal: 'Meal',
    convention: 'Convention',
    lecture: 'Lecture',
    other: 'Other',
  }

  const colorClass = colors[type] || colors.other
  const label = labels[type] || type

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  )
}


