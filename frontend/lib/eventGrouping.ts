/**
 * Utility functions for grouping and displaying events by date
 */

export interface DateGroup {
  date: string
  dayOfWeek: string
  events: any[]
  borderColor: 'purple' | 'blue' | 'green'
}

/**
 * Group events by date and assign alternating border colors
 */
export const groupEventsByDate = (events: any[]): DateGroup[] => {
  const groupMap = new Map<string, any[]>()
  
  // Group events by date (date only, no time)
  events.forEach(event => {
    const dateOnly = event.date.split('T')[0] // Get YYYY-MM-DD
    if (!groupMap.has(dateOnly)) {
      groupMap.set(dateOnly, [])
    }
    groupMap.get(dateOnly)!.push(event)
  })
  
  // Convert to array and sort by date
  const sortedDates = Array.from(groupMap.keys()).sort()
  
  // Assign alternating colors: purple, blue, green
  const colors: Array<'purple' | 'blue' | 'green'> = ['purple', 'blue', 'green']
  
  return sortedDates.map((dateStr, index) => {
    const date = new Date(dateStr + 'T00:00:00Z')
    const dayOfWeek = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jerusalem',
      weekday: 'long',
    }).format(date)
    
    return {
      date: dateStr,
      dayOfWeek,
      events: groupMap.get(dateStr)!,
      borderColor: colors[index % colors.length],
    }
  })
}

/**
 * Get border and styling classes based on color
 */
export const getDateGroupColorClasses = (color: 'purple' | 'blue' | 'green') => {
  const colorMap = {
    purple: {
      border: 'border-purple-500',
      bg: 'bg-purple-100',
      text: 'text-purple-900',
      header: 'bg-purple-100',
    },
    blue: {
      border: 'border-blue-500',
      bg: 'bg-blue-100',
      text: 'text-blue-900',
      header: 'bg-blue-100',
    },
    green: {
      border: 'border-green-500',
      bg: 'bg-green-100',
      text: 'text-green-900',
      header: 'bg-green-100',
    },
  }
  return colorMap[color]
}
