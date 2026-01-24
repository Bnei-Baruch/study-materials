/**
 * Utility functions for grouping and displaying events by date
 * Color scheme is based on day of week (Sunday-Saturday)
 */

export interface DateGroup {
  date: string
  dayOfWeek: string
  displayDate: string
  events: any[]
  dayIndex: number // 0=Sunday, 1=Monday, etc.
}

// Day of week colors (Sunday through Saturday)
const DAY_COLORS = [
  { border: 'border-rose-500', borderLTR: 'border-rose-500', bg: 'bg-rose-50' },      // Sunday
  { border: 'border-amber-500', borderLTR: 'border-amber-500', bg: 'bg-amber-50' },    // Monday
  { border: 'border-emerald-500', borderLTR: 'border-emerald-500', bg: 'bg-emerald-50' }, // Tuesday
  { border: 'border-blue-500', borderLTR: 'border-blue-500', bg: 'bg-blue-50' },      // Wednesday
  { border: 'border-purple-500', borderLTR: 'border-purple-500', bg: 'bg-purple-50' },  // Thursday
  { border: 'border-pink-500', borderLTR: 'border-pink-500', bg: 'bg-pink-50' },      // Friday
  { border: 'border-indigo-500', borderLTR: 'border-indigo-500', bg: 'bg-indigo-50' }   // Saturday
]

/**
 * Group events by date and assign colors based on day of week
 */
export const groupEventsByDate = (events: any[], locale: string = 'en-US'): DateGroup[] => {
  const groupMap = new Map<string, any[]>()
  
  // Group events by date (date only, no time)
  events.forEach(event => {
    const dateOnly = event.date.split('T')[0] // Get YYYY-MM-DD
    if (!groupMap.has(dateOnly)) {
      groupMap.set(dateOnly, [])
    }
    groupMap.get(dateOnly)!.push(event)
  })
  
  // Convert to array and sort by date DESCENDING (newest first)
  const sortedDates = Array.from(groupMap.keys()).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  )
  
  return sortedDates.map((dateStr) => {
    const date = new Date(dateStr + 'T00:00:00Z')
    const dayIndex = date.getUTCDay() // 0=Sunday, 1=Monday, etc.
    
    const dayOfWeek = new Intl.DateTimeFormat(locale === 'he' ? 'he-IL' : locale, {
      timeZone: 'Asia/Jerusalem',
      weekday: 'long',
    }).format(date)
    
    const displayDate = new Intl.DateTimeFormat(locale === 'he' ? 'he-IL' : locale, {
      timeZone: 'Asia/Jerusalem',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
    
    return {
      date: dateStr,
      dayOfWeek,
      displayDate,
      events: groupMap.get(dateStr)!,
      dayIndex,
    }
  })
}

/**
 * Get styling classes based on day of week
 */
export const getDateGroupColorClasses = (dayIndex: number) => {
  return DAY_COLORS[dayIndex % 7]
}
