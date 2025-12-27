'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, ChevronDown } from 'lucide-react'

// Translation type
interface ListTranslations {
  studyMaterials: string
  loading: string
  error: string
  noEventsAvailable: string
}

// Translation object for all supported languages
const LIST_TRANSLATIONS: Record<string, ListTranslations> = {
  he: {
    studyMaterials: 'חומרי לימוד',
    loading: 'טוען...',
    error: 'שגיאה בטעינת הנתונים',
    noEventsAvailable: 'אין שיעורים זמינים',
  },
  en: {
    studyMaterials: 'Study Materials',
    loading: 'Loading...',
    error: 'Error loading data',
    noEventsAvailable: 'No lessons available',
  },
  ru: {
    studyMaterials: 'Учебные материалы',
    loading: 'Загрузка...',
    error: 'Ошибка загрузки данных',
    noEventsAvailable: 'Нет доступных уроков',
  },
  es: {
    studyMaterials: 'Materiales de estudio',
    loading: 'Cargando...',
    error: 'Error al cargar datos',
    noEventsAvailable: 'No hay lecciones disponibles',
  },
  de: {
    studyMaterials: 'Studienmaterialien',
    loading: 'Lädt...',
    error: 'Fehler beim Laden der Daten',
    noEventsAvailable: 'Keine Lektionen verfügbar',
  },
  it: {
    studyMaterials: 'Materiali di studio',
    loading: 'Caricamento...',
    error: 'Errore nel caricamento dei dati',
    noEventsAvailable: 'Nessuna lezione disponibile',
  },
  fr: {
    studyMaterials: 'Matériel d\'étude',
    loading: 'Chargement...',
    error: 'Erreur de chargement des données',
    noEventsAvailable: 'Aucune leçon disponible',
  },
  uk: {
    studyMaterials: 'Навчальні матеріали',
    loading: 'Завантаження...',
    error: 'Помилка завантаження даних',
    noEventsAvailable: 'Немає доступних уроків',
  },
}

const LANGUAGE_NAMES: Record<string, string> = {
  he: 'עברית',
  en: 'English',
  ru: 'Русский',
  es: 'Español',
  de: 'Deutsch',
  it: 'Italiano',
  fr: 'Français',
  uk: 'Українська',
}

interface Event {
  id: string
  date: string
  start_time?: string
  end_time?: string
  titles?: {
    [key: string]: string
  }
}

interface EmbeddedEventsListProps {
  language: string
  apiBaseUrl: string
  limit?: number
  onSelectEvent: (eventId: string) => void
  onLanguageChange?: (lang: string) => void
}

export function EmbeddedEventsList({
  language,
  apiBaseUrl,
  limit = 10,
  onSelectEvent,
  onLanguageChange,
}: EmbeddedEventsListProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const t = LIST_TRANSLATIONS[language] || LIST_TRANSLATIONS.he
  const isRTL = language === 'he'

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams({
          public: 'true',
          limit: limit.toString(),
          offset: '0',
        })

        const response = await fetch(`${apiBaseUrl}/api/events?${params}`)
        if (!response.ok) {
          throw new Error('Failed to fetch events')
        }

        const data = await response.json()
        setEvents(data.events || [])
      } catch (err) {
        console.error('Error fetching events:', err)
        setError(err instanceof Error ? err.message : t.error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [apiBaseUrl, limit, t.error])

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(language === 'he' ? 'he-IL' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  }

  const getEventTitle = (event: Event) => {
    return event.titles?.[language] || event.titles?.['he'] || event.titles?.['en'] || 'Lesson'
  }

  const handleLanguageChange = (newLang: string) => {
    if (onLanguageChange) {
      onLanguageChange(newLang)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-gray-600" style={{ fontSize: '13px' }}>
          {t.loading}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-red-600 text-center p-4" style={{ fontSize: '13px' }}>
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white p-4 border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-blue-900 font-semibold" style={{ fontSize: '18px' }}>
            {t.studyMaterials}
          </h2>
        </div>
        
        {/* Language Selector */}
        <div className="relative">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className={`appearance-none w-full bg-white border-2 border-gray-200 rounded-lg px-3 py-2 ${
              isRTL ? 'pl-8 pr-3' : 'pr-8 pl-3'
            } text-gray-700 hover:border-blue-300 focus:border-blue-500 focus:outline-none cursor-pointer transition-colors`}
            style={{ fontSize: '14px' }}
          >
            <option value="he">{LANGUAGE_NAMES.he}</option>
            <option value="en">{LANGUAGE_NAMES.en}</option>
            <option value="ru">{LANGUAGE_NAMES.ru}</option>
            <option value="es">{LANGUAGE_NAMES.es}</option>
            <option value="de">{LANGUAGE_NAMES.de}</option>
            <option value="it">{LANGUAGE_NAMES.it}</option>
            <option value="fr">{LANGUAGE_NAMES.fr}</option>
            <option value="uk">{LANGUAGE_NAMES.uk}</option>
          </select>
          <ChevronDown
            className={`w-4 h-4 text-gray-500 absolute ${
              isRTL ? 'left-3' : 'right-3'
            } top-1/2 -translate-y-1/2 pointer-events-none`}
          />
        </div>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <div className="p-4 text-center text-gray-500" style={{ fontSize: '13px' }}>
          {t.noEventsAvailable}
        </div>
      ) : (
        <div className="p-3 space-y-3">
          {events.map((event) => (
            <button
              key={event.id}
              onClick={() => onSelectEvent(event.id)}
              className="w-full bg-white rounded-lg shadow-sm hover:shadow-md transition-all p-4 text-left border border-gray-100 hover:border-blue-200"
            >
              <h3
                className={`text-blue-900 font-medium mb-2 ${isRTL ? 'text-right' : 'text-left'}`}
                style={{ fontSize: '15px' }}
              >
                {getEventTitle(event)}
              </h3>
              
              <div className="flex flex-col gap-1.5 text-gray-600" style={{ fontSize: '12px' }}>
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{formatEventDate(event.date)}</span>
                </div>
                
                {event.start_time && event.end_time && (
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>
                      {event.start_time} - {event.end_time}
                    </span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
