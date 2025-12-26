'use client'

import React, { useState, useEffect } from 'react'
import {
  BookOpen,
  Video,
  FileText,
  Copy,
  Check,
  Shield,
  ChevronDown,
  ChevronUp,
  Share2,
  MessageCircle,
  Send,
} from 'lucide-react'

interface Event {
  id: string
  date: string
  type: string
  number: number
  titles?: {
    he?: string
    en?: string
    ru?: string
    es?: string
    de?: string
    it?: string
    fr?: string
    uk?: string
  }
  public: boolean
}

interface Source {
  source_id: string
  source_title: string
  source_url: string
  page_number?: string
}

interface CustomLink {
  title: string
  url: string
}

interface Part {
  id: string
  title: string
  description: string
  date: string
  part_type: string
  language: string
  event_id: string
  order: number
  excerpts_link?: string
  transcript_link?: string
  lesson_link?: string
  program_link?: string
  reading_before_sleep_link?: string
  lesson_preparation_link?: string
  recorded_lesson_date?: string
  sources: Source[]
  custom_links?: CustomLink[]
  created_at: string
}

const LANGUAGES = {
  he: '🇮🇱 עברית',
  en: '🇬🇧 English',
  ru: '🇷🇺 Русский',
  es: '🇪🇸 Español',
  de: '🇩🇪 Deutsch',
  it: '🇮🇹 Italiano',
  fr: '🇫🇷 Français',
  uk: '🇺🇦 Українська',
}

const TRANSLATIONS = {
  he: {
    noEvents: 'אין אירועים זמינים',
    backToEvents: 'חזרה לרשימת אירועים',
    noMaterials: 'אין חומרים זמינים',
    originalDate: 'תאריך השיעור המקורי: ',
    page: 'עמ\'',
    copyLink: 'העתק קישור',
    readSource: 'לקריאת המקור',
    part: 'חלק',
    share: 'שתף',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    readingBeforeSleep: 'קטע הכנה לשינה',
    lessonPreparation: 'מסמך הכנה לשיעור',
    watchLesson: 'צפייה בשיעור',
    lessonTranscript: 'תמליל השיעור',
    selectedExcerpts: 'קטעים נבחרים',
  },
  en: {
    noEvents: 'No events available',
    backToEvents: 'Back to events',
    noMaterials: 'No materials available',
    originalDate: 'Original lesson date: ',
    page: 'p.',
    copyLink: 'Copy link',
    readSource: 'Read the source',
    part: 'Part',
    share: 'Share',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    readingBeforeSleep: 'Reading Before Sleep',
    lessonPreparation: 'Lesson Preparation',
    watchLesson: 'Watch Lesson',
    lessonTranscript: 'Lesson Transcript',
    selectedExcerpts: 'Selected Excerpts',
  },
  ru: {
    noEvents: 'Нет доступных событий',
    backToEvents: 'Вернуться к событиям',
    noMaterials: 'Нет доступных материалов',
    originalDate: 'Дата оригинального урока: ',
    page: 'стр.',
    copyLink: 'Копировать ссылку',
    readSource: 'Читать источник',
    part: 'Часть',
    share: 'Поделиться',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    readingBeforeSleep: 'Чтение перед сном',
    lessonPreparation: 'Подготовка к уроку',
    watchLesson: 'Смотреть урок',
    lessonTranscript: 'Транскрипт урока',
    selectedExcerpts: 'Избранные отрывки',
  },
  es: {
    noEvents: 'No hay eventos disponibles',
    backToEvents: 'Volver a eventos',
    noMaterials: 'No hay materiales disponibles',
    originalDate: 'Fecha de la lección original: ',
    page: 'p.',
    copyLink: 'Copiar enlace',
    readSource: 'Leer la fuente',
    part: 'Parte',
    share: 'Compartir',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    readingBeforeSleep: 'Lectura antes de dormir',
    lessonPreparation: 'Preparación de la lección',
    watchLesson: 'Ver lección',
    lessonTranscript: 'Transcripción de la lección',
    selectedExcerpts: 'Extractos seleccionados',
  },
  de: {
    noEvents: 'Keine Veranstaltungen verfügbar',
    backToEvents: 'Zurück zu Veranstaltungen',
    noMaterials: 'Keine Materialien verfügbar',
    originalDate: 'Ursprüngliches Lektionsdatum: ',
    page: 'S.',
    copyLink: 'Link kopieren',
    readSource: 'Quelle lesen',
    part: 'Teil',
    share: 'Teilen',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    readingBeforeSleep: 'Lesen vor dem Schlafengehen',
    lessonPreparation: 'Lektionsvorbereitung',
    watchLesson: 'Lektion ansehen',
    lessonTranscript: 'Lektionstranskript',
    selectedExcerpts: 'Ausgewählte Auszüge',
  },
  it: {
    noEvents: 'Nessun evento disponibile',
    backToEvents: 'Torna agli eventi',
    noMaterials: 'Nessun materiale disponibile',
    originalDate: 'Data della lezione originale: ',
    page: 'p.',
    copyLink: 'Copia link',
    readSource: 'Leggi la fonte',
    part: 'Parte',
    share: 'Condividi',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    readingBeforeSleep: 'Lettura prima di dormire',
    lessonPreparation: 'Preparazione della lezione',
    watchLesson: 'Guarda la lezione',
    lessonTranscript: 'Trascrizione della lezione',
    selectedExcerpts: 'Estratti selezionati',
  },
  fr: {
    noEvents: 'Aucun événement disponible',
    backToEvents: 'Retour aux événements',
    noMaterials: 'Aucun matériel disponible',
    originalDate: 'Date de la leçon originale: ',
    page: 'p.',
    copyLink: 'Copier le lien',
    readSource: 'Lire la source',
    part: 'Partie',
    share: 'Partager',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    readingBeforeSleep: 'Lecture avant de dormir',
    lessonPreparation: 'Préparation de la leçon',
    watchLesson: 'Regarder la leçon',
    lessonTranscript: 'Transcription de la leçon',
    selectedExcerpts: 'Extraits sélectionnés',
  },
  uk: {
    noEvents: 'Немає доступних подій',
    backToEvents: 'Повернутися до подій',
    noMaterials: 'Немає доступних матеріалів',
    originalDate: 'Дата оригінального уроку: ',
    page: 'стор.',
    copyLink: 'Копіювати посилання',
    readSource: 'Читати джерело',
    part: 'Частина',
    share: 'Поділитися',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    readingBeforeSleep: 'Читання перед сном',
    lessonPreparation: 'Підготовка до уроку',
    watchLesson: 'Дивитися урок',
    lessonTranscript: 'Транскрипт уроку',
    selectedExcerpts: 'Вибрані уривки',
  },
}

export default function PublicPage() {
  const [language, setLanguage] = useState('he')
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set())
  const [openShareDropdown, setOpenShareDropdown] = useState<string | null>(null)

  // Translation helper
  const t = (key: keyof typeof TRANSLATIONS.en) => {
    return TRANSLATIONS[language as keyof typeof TRANSLATIONS]?.[key] || TRANSLATIONS.en[key]
  }

  // Load language from localStorage and listen for changes from Navigation
  useEffect(() => {
    const saved = localStorage.getItem('language')
    if (saved && saved in LANGUAGES) {
      setLanguage(saved)
    }

    // Listen for language changes from Navigation
    const handleLanguageChange = () => {
      const newLang = localStorage.getItem('language')
      if (newLang && newLang in LANGUAGES) {
        setLanguage(newLang)
      }
    }

    window.addEventListener('languageChange', handleLanguageChange)
    return () => window.removeEventListener('languageChange', handleLanguageChange)
  }, [])

  // Fetch public events when language changes
  useEffect(() => {
    fetchEvents()
  }, [language])

  // Fetch parts when event is selected
  useEffect(() => {
    if (selectedEvent) {
      fetchParts(selectedEvent.id)
    }
  }, [selectedEvent, language])

  // Auto-expand all parts on load
  useEffect(() => {
    if (parts.length > 0) {
      const allPartIds = new Set(parts.map(p => p.id))
      setExpandedParts(allPartIds)
    }
  }, [parts])

  // Close share dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenShareDropdown(null)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:8080/api/events?public=true&limit=10&language=${language}`)
      const data = await response.json()
      setEvents(data.events || [])
      // Don't auto-select - let user choose
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchParts = async (eventId: string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/events/${eventId}/parts?language=${language}`)
      const data = await response.json()
      setParts((data.parts || []).sort((a: Part, b: Part) => a.order - b.order))
    } catch (error) {
      console.error('Failed to fetch parts:', error)
      setParts([])
    }
  }

  const copyToClipboard = (url: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const togglePart = (partId: string) => {
    const newExpanded = new Set(expandedParts)
    if (newExpanded.has(partId)) {
      newExpanded.delete(partId)
    } else {
      newExpanded.add(partId)
    }
    setExpandedParts(newExpanded)
  }

  const generatePartMessage = (part: Part, event: Event) => {
    const eventTitle = getEventTitle(event)
    const eventDate = formatDate(event.date)
    const isPreparation = part.order === 0
    const partTitle = isPreparation ? part.title : `${t('part')} ${part.order}: ${part.title}`
    
    let message = `📚 *${eventTitle}*\n📅 ${eventDate}\n\n━━━━━━━━━━\n\n`
    
    if (isPreparation) {
      message += `📝 *${partTitle}*\n`
    } else {
      message += `📖 *${partTitle}*\n`
    }
    
    if (part.description) {
      message += `${part.description}\n`
    }
    
    if (part.recorded_lesson_date) {
      message += `📅 ${t('originalDate')}${new Date(part.recorded_lesson_date).toLocaleDateString()}\n`
    }
    
    // Sources
    if (part.sources && part.sources.length > 0) {
      message += `\n📚 *${t('readSource')}:*\n`
      part.sources.forEach(source => {
        message += `• ${source.source_title}`
        if (source.page_number) {
          message += ` (${t('page')} ${source.page_number})`
        }
        message += `\n  ${source.source_url}\n`
      })
    }
    
    // Links
    const links = []
    
    if (isPreparation) {
      if (part.reading_before_sleep_link) {
        links.push(`📖 ${t('readingBeforeSleep')}: ${part.reading_before_sleep_link}`)
      }
      if (part.lesson_preparation_link) {
        links.push(`📄 ${t('lessonPreparation')}: ${part.lesson_preparation_link}`)
      }
    } else {
      if (part.lesson_link) {
        links.push(`🎥 ${t('watchLesson')}: ${part.lesson_link}`)
      }
      if (part.transcript_link) {
        links.push(`📄 ${t('lessonTranscript')}: ${part.transcript_link}`)
      }
      if (part.excerpts_link) {
        links.push(`📋 ${t('selectedExcerpts')}: ${part.excerpts_link}`)
      }
    }
    
    // Custom links
    if (part.custom_links && part.custom_links.length > 0) {
      part.custom_links.forEach(link => {
        links.push(`🔗 ${link.title}: ${link.url}`)
      })
    }
    
    if (links.length > 0) {
      message += `\n🔗 *Links:*\n${links.join('\n')}\n`
    }
    
    return message
  }

  const sharePartToWhatsApp = (part: Part, event: Event) => {
    const message = generatePartMessage(part, event)
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')
  }

  const sharePartToTelegram = (part: Part, event: Event) => {
    const message = generatePartMessage(part, event)
    const encodedMessage = encodeURIComponent(message)
    const telegramUrl = `https://t.me/share/url?url=&text=${encodedMessage}`
    window.open(telegramUrl, '_blank')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
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
    return new Intl.DateTimeFormat(localeMap[language] || 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  }

  const getPartColorClasses = (order: number) => {
    if (order === 0) {
      // Preparation
      return {
        border: 'border-amber-500',
        bg: 'bg-amber-50',
        bgHover: 'hover:bg-amber-100',
        text: 'text-amber-900',
        icon: 'text-amber-600',
      }
    }
    
    const colorSchemes = [
      { border: 'border-blue-500', bg: 'bg-blue-50', bgHover: 'hover:bg-blue-100', text: 'text-blue-900', icon: 'text-blue-600' },
      { border: 'border-orange-500', bg: 'bg-orange-50', bgHover: 'hover:bg-orange-100', text: 'text-orange-900', icon: 'text-orange-600' },
      { border: 'border-green-500', bg: 'bg-green-50', bgHover: 'hover:bg-green-100', text: 'text-green-900', icon: 'text-green-600' },
      { border: 'border-indigo-500', bg: 'bg-indigo-50', bgHover: 'hover:bg-indigo-100', text: 'text-indigo-900', icon: 'text-indigo-600' },
      { border: 'border-teal-500', bg: 'bg-teal-50', bgHover: 'hover:bg-teal-100', text: 'text-teal-900', icon: 'text-teal-600' },
      { border: 'border-purple-500', bg: 'bg-purple-50', bgHover: 'hover:bg-purple-100', text: 'text-purple-900', icon: 'text-purple-600' },
      { border: 'border-pink-500', bg: 'bg-pink-50', bgHover: 'hover:bg-pink-100', text: 'text-pink-900', icon: 'text-pink-600' },
      { border: 'border-rose-500', bg: 'bg-rose-50', bgHover: 'hover:bg-rose-100', text: 'text-rose-900', icon: 'text-rose-600' },
    ]
    
    return colorSchemes[(order - 1) % colorSchemes.length]
  }

  const getEventTitle = (event: Event) => {
    return event.titles?.[language as keyof typeof event.titles] || 
           event.titles?.he || 
           `Event ${event.number}`
  }

  const handleEventClick = (event: Event) => {
    console.log('Event clicked:', event.id, event.titles?.he)
    setSelectedEvent(event)
    setParts([])
    setExpandedParts(new Set())
  }

  const handleBackToEvents = () => {
    setSelectedEvent(null)
    setParts([])
    setExpandedParts(new Set())
  }

  const isRTL = language === 'he'

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Content */}
        <div className="max-w-2xl mx-auto">
          {/* Events List or Parts View */}
          {!selectedEvent ? (
            // Events List
            <div className="space-y-4">
            {events.length === 0 ? (
              <div className="text-center text-gray-600 py-12">
                {t('noEvents')}
              </div>
            ) : (
              events.map((event) => (
                <button
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className="w-full bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                  dir={isRTL ? 'rtl' : 'ltr'}
                >
                  {isRTL ? (
                    <div className="flex items-center justify-between">
                      <div className="text-right flex-1 mr-4">
                        <h2 className="text-xl font-bold text-blue-900 mb-2">
                          {getEventTitle(event)}
                        </h2>
                        <p className="text-gray-600">
                          {formatDate(event.date)}
                        </p>
                      </div>
                      <ChevronDown className="w-6 h-6 text-blue-600 transform rotate-90" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="text-left flex-1 mr-4">
                        <h2 className="text-xl font-bold text-blue-900 mb-2">
                          {getEventTitle(event)}
                        </h2>
                        <p className="text-gray-600">
                          {formatDate(event.date)}
                        </p>
                      </div>
                      <ChevronDown className="w-6 h-6 text-blue-600 transform -rotate-90" />
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        ) : parts.length === 0 ? (
          <div dir={isRTL ? 'rtl' : 'ltr'}>
            <button
              onClick={handleBackToEvents}
              className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
            >
              <ChevronDown className={`w-5 h-5 transform ${isRTL ? '-rotate-90' : 'rotate-90'}`} />
              {t('backToEvents')}
            </button>
            <div className="text-center text-gray-600">
              {t('noMaterials')}
            </div>
          </div>
        ) : (
          // Parts List
          <div dir={isRTL ? 'rtl' : 'ltr'}>
            <button
              onClick={handleBackToEvents}
              className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
            >
              <ChevronDown className={`w-5 h-5 transform ${isRTL ? '-rotate-90' : 'rotate-90'}`} />
              {t('backToEvents')}
            </button>
            
            {/* Event Title Header */}
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-blue-900 mb-2">
                {getEventTitle(selectedEvent)}
              </h1>
              <p className="text-gray-600 text-lg">
                {formatDate(selectedEvent.date)}
              </p>
            </div>

            <div className="space-y-6">
              {parts.map((part) => {
            const colors = getPartColorClasses(part.order)
            const isExpanded = expandedParts.has(part.id)
            const isPreparation = part.order === 0

            return (
              <div
                key={part.id}
                className="bg-white rounded-2xl shadow-lg p-8 mb-6"
              >
                {/* Part Header */}
                <div
                  className={`${isRTL ? 'border-r-4 pr-4' : 'border-l-4 pl-4'} ${colors.border} mb-6 cursor-pointer relative`}
                  onClick={() => togglePart(part.id)}
                >
                  {/* Share button with dropdown */}
                  <div className={`absolute top-0 ${isRTL ? 'left-0' : 'right-0'} z-10`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenShareDropdown(openShareDropdown === part.id ? null : part.id)
                      }}
                      className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors shadow-md"
                      title={t('share')}
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    
                    {/* Dropdown menu */}
                    {openShareDropdown === part.id && (
                      <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[160px]`}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            sharePartToWhatsApp(part, selectedEvent)
                            setOpenShareDropdown(null)
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
                        >
                          <MessageCircle className="w-5 h-5 text-green-600" />
                          <span>{t('whatsapp')}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            sharePartToTelegram(part, selectedEvent)
                            setOpenShareDropdown(null)
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
                        >
                          <Send className="w-5 h-5 text-blue-600" />
                          <span>{t('telegram')}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h2 className={`text-2xl font-bold ${colors.text} mb-2`}>
                        {part.order === 0 ? part.title : `${t('part')} ${part.order}: ${part.title}`}
                      </h2>
                      {part.description && (
                        <p className="text-gray-600">{part.description}</p>
                      )}
                      {part.recorded_lesson_date && (
                        <p className="text-gray-600 mt-1">
                          {t('originalDate')}
                          {new Date(part.recorded_lesson_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className={`w-6 h-6 ${colors.icon}`} />
                    ) : (
                      <ChevronDown className={`w-6 h-6 ${colors.icon}`} />
                    )}
                  </div>
                </div>

                {/* Part Content (Expanded) */}
                {isExpanded && (
                  <div className="space-y-3">
                    {/* Sources */}
                    {part.sources && part.sources.length > 0 && part.sources.map((source, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <a
                          href={source.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-3 ${colors.bg} ${colors.bgHover} transition-all rounded-xl p-4 flex-1`}
                        >
                          <BookOpen className={`w-5 h-5 ${colors.icon} flex-shrink-0`} />
                          <div className="flex-1">
                            <span className={colors.text}>{t('readSource')}</span>
                            {source.page_number && (
                              <span className="text-gray-600 text-sm ml-2">
                                {` ${t('page')} ${source.page_number}`}
                              </span>
                            )}
                          </div>
                        </a>
                        <button
                          onClick={(e) => copyToClipboard(source.source_url, e)}
                          className={`${colors.bg} ${colors.bgHover} transition-all rounded-xl p-4`}
                          title={t('copyLink')}
                        >
                          {copiedUrl === source.source_url ? (
                            <Check className={`w-5 h-5 ${colors.icon}`} />
                          ) : (
                            <Copy className={`w-5 h-5 ${colors.icon}`} />
                          )}
                        </button>
                      </div>
                    ))}

                    {/* Preparation Links */}
                    {isPreparation && part.reading_before_sleep_link && (
                      <div className="flex items-center gap-2">
                        <a
                          href={part.reading_before_sleep_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-3 ${colors.bg} ${colors.bgHover} transition-all rounded-xl p-4 flex-1`}
                        >
                          <Shield className={`w-5 h-5 ${colors.icon} flex-shrink-0`} />
                          <span className={colors.text}>
                            {t('readingBeforeSleep')}
                          </span>
                        </a>
                        <button
                          onClick={(e) => copyToClipboard(part.reading_before_sleep_link!, e)}
                          className={`${colors.bg} ${colors.bgHover} transition-all rounded-xl p-4`}
                        >
                          {copiedUrl === part.reading_before_sleep_link ? (
                            <Check className={`w-5 h-5 ${colors.icon}`} />
                          ) : (
                            <Copy className={`w-5 h-5 ${colors.icon}`} />
                          )}
                        </button>
                      </div>
                    )}

                    {isPreparation && part.lesson_preparation_link && (
                      <div className="flex items-center gap-2">
                        <a
                          href={part.lesson_preparation_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-3 ${colors.bg} ${colors.bgHover} transition-all rounded-xl p-4 flex-1`}
                        >
                          <FileText className={`w-5 h-5 ${colors.icon} flex-shrink-0`} />
                          <span className={colors.text}>
                            {t('lessonPreparation')}
                          </span>
                        </a>
                        <button
                          onClick={(e) => copyToClipboard(part.lesson_preparation_link!, e)}
                          className={`${colors.bg} ${colors.bgHover} transition-all rounded-xl p-4`}
                        >
                          {copiedUrl === part.lesson_preparation_link ? (
                            <Check className={`w-5 h-5 ${colors.icon}`} />
                          ) : (
                            <Copy className={`w-5 h-5 ${colors.icon}`} />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Lesson Link */}
                    {part.lesson_link && (
                      <div className="flex items-center gap-2">
                        <a
                          href={part.lesson_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-3 ${colors.bg} ${colors.bgHover} transition-all rounded-xl p-4 flex-1`}
                        >
                          <Video className={`w-5 h-5 ${colors.icon} flex-shrink-0`} />
                          <span className={colors.text}>
                            {t('watchLesson')}
                          </span>
                        </a>
                        <button
                          onClick={(e) => copyToClipboard(part.lesson_link!, e)}
                          className={`${colors.bg} ${colors.bgHover} transition-all rounded-xl p-4`}
                        >
                          {copiedUrl === part.lesson_link ? (
                            <Check className={`w-5 h-5 ${colors.icon}`} />
                          ) : (
                            <Copy className={`w-5 h-5 ${colors.icon}`} />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Transcript Link */}
                    {part.transcript_link && (
                      <div className="flex items-center gap-2">
                        <a
                          href={part.transcript_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-3 ${colors.bg} ${colors.bgHover} transition-all rounded-xl p-4 flex-1`}
                        >
                          <FileText className={`w-5 h-5 ${colors.icon} flex-shrink-0`} />
                          <span className={colors.text}>
                            {t('lessonTranscript')}
                          </span>
                        </a>
                        <button
                          onClick={(e) => copyToClipboard(part.transcript_link!, e)}
                          className={`${colors.bg} ${colors.bgHover} transition-all rounded-xl p-4`}
                        >
                          {copiedUrl === part.transcript_link ? (
                            <Check className={`w-5 h-5 ${colors.icon}`} />
                          ) : (
                            <Copy className={`w-5 h-5 ${colors.icon}`} />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Excerpts Link */}
                    {part.excerpts_link && (
                      <div className="flex items-center gap-2">
                        <a
                          href={part.excerpts_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-3 ${colors.bg} ${colors.bgHover} transition-all rounded-xl p-4 flex-1`}
                        >
                          <FileText className={`w-5 h-5 ${colors.icon} flex-shrink-0`} />
                          <span className={colors.text}>
                            {t('selectedExcerpts')}
                          </span>
                        </a>
                        <button
                          onClick={(e) => copyToClipboard(part.excerpts_link!, e)}
                          className={`${colors.bg} ${colors.bgHover} transition-all rounded-xl p-4`}
                        >
                          {copiedUrl === part.excerpts_link ? (
                            <Check className={`w-5 h-5 ${colors.icon}`} />
                          ) : (
                            <Copy className={`w-5 h-5 ${colors.icon}`} />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Custom Links */}
                    {part.custom_links && part.custom_links.length > 0 && part.custom_links.map((link, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-3 ${colors.bg} ${colors.bgHover} transition-all rounded-xl p-4 flex-1`}
                        >
                          <FileText className={`w-5 h-5 ${colors.icon} flex-shrink-0`} />
                          <span className={colors.text}>{link.title}</span>
                        </a>
                        <button
                          onClick={(e) => copyToClipboard(link.url, e)}
                          className={`${colors.bg} ${colors.bgHover} transition-all rounded-xl p-4`}
                        >
                          {copiedUrl === link.url ? (
                            <Check className={`w-5 h-5 ${colors.icon}`} />
                          ) : (
                            <Copy className={`w-5 h-5 ${colors.icon}`} />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
