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
  
  // Convert to array and sort by date ASCENDING (oldest first)
  const sortedDates = Array.from(groupMap.keys()).sort((a, b) =>
    new Date(a).getTime() - new Date(b).getTime()
  )
  
  return sortedDates.map((dateStr) => {
    const date = new Date(dateStr + 'T00:00:00Z')
    const dayIndex = date.getUTCDay() // 0=Sunday, 1=Monday, etc.
    
    const isHebrew = locale === 'he' || locale === 'he-IL'
    
    const dayOfWeek = new Intl.DateTimeFormat(isHebrew ? 'he-IL' : locale, {
      timeZone: 'Asia/Jerusalem',
      weekday: 'long',
    }).format(date)
    
    let displayDate: string
    if (isHebrew) {
      // Hebrew format: 2.2.26 (day.month.year with single digits)
      const day = date.getUTCDate()
      const month = date.getUTCMonth() + 1
      const year = String(date.getUTCFullYear()).slice(-2) // Last 2 digits of year
      displayDate = `${day}.${month}.${year}`
    } else {
      displayDate = new Intl.DateTimeFormat(locale, {
        timeZone: 'Asia/Jerusalem',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date)
    }
    
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

const getJerusalemParts = (instant: Date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(instant)
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '00'
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute') }
}

// "YYYY-MM-DD" for the given instant in Asia/Jerusalem local time
export const getJerusalemDateString = (instant: Date = new Date()): string => {
  const { year, month, day } = getJerusalemParts(instant)
  return `${year}-${month}-${day}`
}

// "YYYY-MM-DD HH:MM" in Asia/Jerusalem local time (zero-padded, string-comparable)
const formatJerusalemDateTime = (instant: Date): string => {
  const { year, month, day, hour, minute } = getJerusalemParts(instant)
  return `${year}-${month}-${day} ${hour}:${minute}`
}

/**
 * Determine whether an event has ended, using a 30-minute grace period after its end_time.
 * Events without end_time are considered to run through the end of their calendar day.
 * start_time/end_time are plain "HH:MM" strings in Asia/Jerusalem local time.
 */
export const hasEventEnded = (event: { date: string; end_time?: string }): boolean => {
  const eventDate = event.date.split('T')[0] // YYYY-MM-DD

  let cutoff: string
  if (event.end_time) {
    const [hours, minutes] = event.end_time.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + 30
    const dayOffset = Math.floor(totalMinutes / (24 * 60))
    const cutoffMinutesOfDay = totalMinutes % (24 * 60)
    const cutoffHours = Math.floor(cutoffMinutesOfDay / 60)
    const cutoffMinutes = cutoffMinutesOfDay % 60

    let cutoffDate = eventDate
    if (dayOffset > 0) {
      const d = new Date(eventDate + 'T00:00:00Z')
      d.setUTCDate(d.getUTCDate() + dayOffset)
      cutoffDate = d.toISOString().split('T')[0]
    }

    cutoff = `${cutoffDate} ${String(cutoffHours).padStart(2, '0')}:${String(cutoffMinutes).padStart(2, '0')}`
  } else {
    cutoff = `${eventDate} 23:59`
  }

  const nowJerusalem = formatJerusalemDateTime(new Date())
  return nowJerusalem > cutoff
}
