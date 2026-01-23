/**
 * Utility functions for formatting dates in Israel timezone (Asia/Jerusalem)
 * All dates are displayed in Israel timezone regardless of user's local timezone
 */

/**
 * Format date in Israel timezone with custom options
 */
export const formatDateInIsraelTimezone = (
  dateString: string,
  locale: string = 'en-US',
  options?: Intl.DateTimeFormatOptions
): string => {
  const date = new Date(dateString)

  return new Intl.DateTimeFormat(locale, {
    timeZone: 'Asia/Jerusalem',
    ...options,
  }).format(date)
}

/**
 * Locale map for language codes to IETF locale tags
 */
const localeMap: { [key: string]: string } = {
  he: 'he-IL',
  en: 'en-US',
  ru: 'ru-RU',
  es: 'es-ES',
  de: 'de-DE',
  it: 'it-IT',
  fr: 'fr-FR',
  uk: 'uk-UA',
}

/**
 * Format event date for display (e.g., "Mon, Jan 15, 2024")
 */
export const formatEventDate = (
  dateString: string,
  language: string = 'en'
): string => {
  return formatDateInIsraelTimezone(dateString, localeMap[language] || 'en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format date and time for display (e.g., "01/15/2024, 14:30:00")
 */
export const formatDateTimeInIsraelTimezone = (
  dateString: string,
  language: string = 'en'
): string => {
  return formatDateInIsraelTimezone(dateString, localeMap[language] || 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * Format date range for display (e.g., "Jan 15 - Feb 20")
 */
export const formatDateRange = (
  startDateString: string,
  endDateString: string,
  language: string = 'en'
): string => {
  const startDate = formatDateInIsraelTimezone(
    startDateString,
    localeMap[language] || 'en-US',
    {
      month: 'short',
      day: 'numeric',
    }
  )

  const endDate = formatDateInIsraelTimezone(
    endDateString,
    localeMap[language] || 'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  )

  return `${startDate} - ${endDate}`
}

/**
 * Format date only (e.g., "15/01/2024")
 */
export const formatDateOnly = (
  dateString: string,
  language: string = 'en'
): string => {
  return formatDateInIsraelTimezone(dateString, localeMap[language] || 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/**
 * Format date for input field (returns YYYY-MM-DD format)
 */
export const formatDateForInput = (dateString: string): string => {
  const date = new Date(dateString)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
