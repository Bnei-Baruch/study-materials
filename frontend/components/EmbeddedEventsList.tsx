'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, ChevronDown, ChevronRight, ChevronLeft } from 'lucide-react'
import { formatDateTimeInIsraelTimezone } from '@/lib/dateUtils'
import { groupEventsByDate, getDateGroupColorClasses } from '@/lib/eventGrouping'

// Translation type
interface ListTranslations {
  studyMaterials: string
  selectLesson: string
  loading: string
  error: string
  noEventsAvailable: string
  viewAllMaterials: string
}

// Translation object for all supported languages
const LIST_TRANSLATIONS: Record<string, ListTranslations> = {
  he: {
    studyMaterials: 'חומרי לימוד',
    selectLesson: 'בחר שיעור מהרשימה',
    loading: 'טוען...',
    error: 'שגיאה בטעינת הנתונים',
    noEventsAvailable: 'אין שיעורים זמינים',
    viewAllMaterials: 'צפייה בכל חומרי הלימוד',
  },
  en: {
    studyMaterials: 'Study Materials',
    selectLesson: 'Select a lesson from the list',
    loading: 'Loading...',
    error: 'Error loading data',
    noEventsAvailable: 'No lessons available',
    viewAllMaterials: 'View all study materials',
  },
  ru: {
    studyMaterials: 'Учебные материалы',
    selectLesson: 'Выберите урок из списка',
    loading: 'Загрузка...',
    error: 'Ошибка загрузки данных',
    noEventsAvailable: 'Нет доступных уроков',
    viewAllMaterials: 'Посмотреть все учебные материалы',
  },
  es: {
    studyMaterials: 'Materiales de estudio',
    selectLesson: 'Seleccione una lección de la lista',
    loading: 'Cargando...',
    error: 'Error al cargar datos',
    noEventsAvailable: 'No hay lecciones disponibles',
    viewAllMaterials: 'Ver todos los materiales de estudio',
  },
  de: {
    studyMaterials: 'Studienmaterialien',
    selectLesson: 'Wählen Sie eine Lektion aus der Liste',
    loading: 'Lädt...',
    error: 'Fehler beim Laden der Daten',
    noEventsAvailable: 'Keine Lektionen verfügbar',
    viewAllMaterials: 'Alle Studienmaterialien anzeigen',
  },
  it: {
    studyMaterials: 'Materiali di studio',
    selectLesson: 'Seleziona una lezione dall\'elenco',
    loading: 'Caricamento...',
    error: 'Errore nel caricamento dei dati',
    noEventsAvailable: 'Nessuna lezione disponibile',
    viewAllMaterials: 'Visualizza tutti i materiali di studio',
  },
  fr: {
    studyMaterials: 'Matériel d\'étude',
    selectLesson: 'Sélectionnez une leçon dans la liste',
    loading: 'Chargement...',
    error: 'Erreur de chargement des données',
    noEventsAvailable: 'Aucune leçon disponible',
    viewAllMaterials: 'Voir tous les matériaux d\'étude',
  },
  uk: {
    studyMaterials: 'Навчальні матеріали',
    selectLesson: 'Виберіть урок зі списку',
    loading: 'Завантаження...',
    error: 'Помилка завантаження даних',
    noEventsAvailable: 'Немає доступних уроків',
    viewAllMaterials: 'Переглянути всі навчальні матеріали',
  },
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
  const isLTR = !isRTL

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
      <div className="h-full w-full flex items-center justify-center bg-white" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-gray-600 text-[14px] sm:text-[14px]">
          {t.loading}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-white" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-red-600 text-center p-2 sm:p-4 text-[14px] sm:text-[14px]">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-white border-t-4 border-blue-200" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sidebar Header */}
      <div className="bg-blue-50 p-2 sm:p-3 border-b-2 border-blue-200 sticky top-0 z-10 relative">
        <h3 className="text-blue-900 text-[18px] sm:text-[18px] font-semibold">
          {t.studyMaterials}
        </h3>
        <p className="text-gray-600 text-[13px] sm:text-[13px] mt-0.5">
          {t.selectLesson}
        </p>
        
        {/* Language Selector - Left Corner */}
        <div className={`absolute ${isLTR ? 'right-2 sm:right-3' : 'left-2 sm:left-3'} top-2 sm:top-3`}>
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-white border border-blue-300 rounded-md px-1.5 sm:px-2 py-0.5 sm:py-1 text-blue-900 cursor-pointer hover:border-blue-500 transition-colors text-[12px] sm:text-[12px]"
          >
            <option value="he">עברית</option>
            <option value="en">English</option>
            <option value="ru">Русский</option>
            <option value="es">Español</option>
            <option value="de">Deutsch</option>
            <option value="it">Italiano</option>
            <option value="fr">Français</option>
            <option value="uk">Українська</option>
          </select>
        </div>
      </div>

      {/* Events List Grouped by Date */}
      {events.length === 0 ? (
        <div className="p-2 sm:p-4 text-center text-gray-500 text-[14px] sm:text-[14px]">
          {t.noEventsAvailable}
        </div>
      ) : (
        <div className="p-1 sm:p-2 space-y-2">
          {groupEventsByDate(events, language === 'he' ? 'he-IL' : language).map((dateGroup) => {
            const colors = getDateGroupColorClasses(dateGroup.dayIndex)
            
            return (
              <div
                key={dateGroup.date}
                className={`rounded-lg shadow-md bg-white overflow-hidden ${isRTL ? 'border-r-4' : 'border-l-4'} ${isRTL ? colors.border : colors.borderLTR}`}
              >
                {/* Date Header */}
                <div className="p-3 sm:p-4 border-b border-gray-200 bg-gray-100">
                  <div className="flex items-center gap-2 text-blue-900">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <h4 className="text-[14px] sm:text-[16px] font-bold truncate">
                      {dateGroup.dayOfWeek}, {dateGroup.displayDate}
                    </h4>
                  </div>
                </div>
                
                {/* Events for this date */}
                <div className="divide-y divide-gray-200">
                  {dateGroup.events.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => onSelectEvent(event.id)}
                      className={`w-full p-3 sm:p-4 hover:bg-blue-100 transition-colors group flex items-center justify-between ${isRTL ? 'text-right' : 'text-left'}`}
                    >
                      {isRTL ? (
                        <>
                          <div className="flex-1 min-w-0 text-right">
                            <h5 className="text-blue-900 group-hover:text-blue-700 transition-colors mb-1 text-[14px] sm:text-[15px] break-words">
                              {event.titles?.[language] || event.titles?.['he'] || event.titles?.['en'] || 'Lesson'}
                            </h5>
                            {event.start_time && event.end_time && (
                              <div className="flex items-center gap-1.5 text-gray-600 text-[11px] sm:text-[12px] justify-start">
                                <Clock className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{event.start_time} - {event.end_time}</span>
                              </div>
                            )}
                          </div>
                          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-[-3px] transition-all flex-shrink-0" />
                        </>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0 text-left">
                            <h5 className="text-blue-900 group-hover:text-blue-700 transition-colors mb-1 text-[14px] sm:text-[15px] break-words">
                              {event.titles?.[language] || event.titles?.['he'] || event.titles?.['en'] || 'Lesson'}
                            </h5>
                            {event.start_time && event.end_time && (
                              <div className="flex items-center gap-1.5 text-gray-600 text-[11px] sm:text-[12px]">
                                <Clock className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{event.start_time} - {event.end_time}</span>
                              </div>
                            )}
                          </div>
                          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0 rotate-180" />
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Footer Link */}
      <div className="p-2 sm:p-4">
        <a
          href="https://study.kli.one"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center bg-blue-50 hover:bg-blue-100 border-2 border-blue-300 rounded-lg p-2 sm:p-3 transition-all"
        >
          <div className="text-blue-700 font-medium text-[14px] sm:text-[14px]">
            {t.viewAllMaterials}
          </div>
          <div className="text-blue-600 mt-0.5 sm:mt-1 text-[12px] sm:text-[12px]">
            study.kli.one
          </div>
        </a>
      </div>
    </div>
  )
}

