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
  { border: 'border-r-4 border-r-rose-400', borderLTR: 'border-l-4 border-l-rose-400', bg: 'bg-rose-50' },      // Sunday
  { border: 'border-r-4 border-r-amber-400', borderLTR: 'border-l-4 border-l-amber-400', bg: 'bg-amber-50' },    // Monday
  { border: 'border-r-4 border-r-emerald-400', borderLTR: 'border-l-4 border-l-emerald-400', bg: 'bg-emerald-50' }, // Tuesday
  { border: 'border-r-4 border-r-blue-400', borderLTR: 'border-l-4 border-l-blue-400', bg: 'bg-blue-50' },      // Wednesday
  { border: 'border-r-4 border-r-purple-400', borderLTR: 'border-l-4 border-l-purple-400', bg: 'bg-purple-50' },  // Thursday
  { border: 'border-r-4 border-r-pink-400', borderLTR: 'border-l-4 border-l-pink-400', bg: 'bg-pink-50' },      // Friday
  { border: 'border-r-4 border-r-indigo-400', borderLTR: 'border-l-4 border-l-indigo-400', bg: 'bg-indigo-50' }   // Saturday
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
