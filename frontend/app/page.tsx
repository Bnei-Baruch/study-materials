'use client'

import React, { useState, useEffect } from 'react'
import { getApiUrl } from '@/lib/api'
import { formatEventDate, formatDateOnly } from '@/lib/dateUtils'
import { groupEventsByDate, getDateGroupColorClasses } from '@/lib/eventGrouping'
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
  Calendar,
  Clock,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface Event {
  id: string
  date: string
  start_time?: string
  end_time?: string
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
  start_point?: string
  end_point?: string
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

// Format date based on language locale (date only, no time)
const formatDateByLanguage = (dateString: string, language: string) => {
  return formatDateOnly(dateString, language)
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
    copyAsText: 'העתק כטקסט',
    links: 'קישורים',
    sources: 'מקורות',
    studyMaterials: 'חומרי לימוד',
    studyMaterialsDescription: 'חומרי לימוד ומקורות לשיעורים, כנסים ואירועים של בני ברוך',
    filterByDate: 'סינון לפי תאריך',
    fromDate: 'מתאריך',
    toDate: 'עד תאריך',
    clearFilters: 'נקה סינון',
    eventsFound: 'שיעורים נמצאו',
    loadMore: 'טען עוד שיעורים',
    readingBeforeSleep: 'קטע הכנה לשינה',
    lessonPreparation: 'מסמך הכנה לשיעור',
    watchLesson: 'צפייה בשיעור',
    lessonTranscript: 'תמליל השיעור',
    selectedExcerpts: 'קטעים נבחרים',
    startPoint: 'החל מ:',
    endPoint: 'עד:',
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
    copyAsText: 'Copy as text',
    links: 'Links',
    sources: 'Sources',
    studyMaterials: 'Study Materials',
    studyMaterialsDescription: 'Study materials and sources for lessons, conventions and events of Bnei Baruch',
    filterByDate: 'Filter by date',
    fromDate: 'From date',
    toDate: 'To date',
    clearFilters: 'Clear filters',
    eventsFound: 'events found',
    loadMore: 'Load more lessons',
    readingBeforeSleep: 'Reading Before Sleep',
    lessonPreparation: 'Lesson Preparation',
    watchLesson: 'Watch Lesson',
    lessonTranscript: 'Lesson Transcript',
    selectedExcerpts: 'Selected Excerpts',
    startPoint: 'From:',
    endPoint: 'To:',
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
    copyAsText: 'Копировать как текст',
    links: 'Ссылки',
    sources: 'Источники',
    studyMaterials: 'Учебные материалы',
    studyMaterialsDescription: 'Учебные материалы и источники для уроков, конгрессов и событий Бней Барух',
    filterByDate: 'Фильтр по дате',
    fromDate: 'С даты',
    toDate: 'По дату',
    clearFilters: 'Очистить фильтры',
    eventsFound: 'уроков найдено',
    loadMore: 'Загрузить еще уроки',
    readingBeforeSleep: 'Чтение перед сном',
    lessonPreparation: 'Подготовка к уроку',
    watchLesson: 'Смотреть урок',
    lessonTranscript: 'Транскрипт урока',
    selectedExcerpts: 'Избранные отрывки',
    startPoint: 'От:',
    endPoint: 'До:',
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
    copyAsText: 'Copiar como texto',
    links: 'Enlaces',
    sources: 'Fuentes',
    studyMaterials: 'Materiales de estudio',
    studyMaterialsDescription: 'Materiales de estudio y fuentes para lecciones, congresos y eventos de Bnei Baruch',
    filterByDate: 'Filtrar por fecha',
    fromDate: 'Desde fecha',
    toDate: 'Hasta fecha',
    clearFilters: 'Limpiar filtros',
    eventsFound: 'lecciones encontradas',
    loadMore: 'Cargar más lecciones',
    readingBeforeSleep: 'Lectura antes de dormir',
    lessonPreparation: 'Preparación de la lección',
    watchLesson: 'Ver lección',
    lessonTranscript: 'Transcripción de la lección',
    selectedExcerpts: 'Extractos seleccionados',
    startPoint: 'De:',
    endPoint: 'Hasta:',
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
    copyAsText: 'Als Text kopieren',
    links: 'Links',
    sources: 'Quellen',
    studyMaterials: 'Studienmaterialien',
    studyMaterialsDescription: 'Studienmaterialien und Quellen für Lektionen, Kongresse und Veranstaltungen von Bnei Baruch',
    filterByDate: 'Nach Datum filtern',
    fromDate: 'Von Datum',
    toDate: 'Bis Datum',
    clearFilters: 'Filter löschen',
    eventsFound: 'Lektionen gefunden',
    loadMore: 'Mehr Lektionen laden',
    readingBeforeSleep: 'Lesen vor dem Schlafengehen',
    lessonPreparation: 'Lektionsvorbereitung',
    watchLesson: 'Lektion ansehen',
    lessonTranscript: 'Lektionstranskript',
    selectedExcerpts: 'Ausgewählte Auszüge',
    startPoint: 'Von:',
    endPoint: 'Bis:',
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
    copyAsText: 'Copia come testo',
    links: 'Collegamenti',
    sources: 'Fonti',
    studyMaterials: 'Materiali di studio',
    studyMaterialsDescription: 'Materiali di studio e fonti per lezioni, congressi ed eventi di Bnei Baruch',
    filterByDate: 'Filtra per data',
    fromDate: 'Dalla data',
    toDate: 'Alla data',
    clearFilters: 'Cancella filtri',
    eventsFound: 'lezioni trovate',
    loadMore: 'Carica altre lezioni',
    readingBeforeSleep: 'Lettura prima di dormire',
    lessonPreparation: 'Preparazione della lezione',
    watchLesson: 'Guarda la lezione',
    lessonTranscript: 'Trascrizione della lezione',
    selectedExcerpts: 'Estratti selezionati',
    startPoint: 'Da:',
    endPoint: 'A:',
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
    copyAsText: 'Copier en tant que texte',
    links: 'Liens',
    sources: 'Sources',
    studyMaterials: 'Matériaux d\'étude',
    studyMaterialsDescription: 'Matériaux d\'étude et sources pour les leçons, congrès et événements de Bnei Baruch',
    filterByDate: 'Filtrer par date',
    fromDate: 'De la date',
    toDate: 'À la date',
    clearFilters: 'Effacer les filtres',
    eventsFound: 'leçons trouvées',
    loadMore: 'Charger plus de leçons',
    readingBeforeSleep: 'Lecture avant de dormir',
    lessonPreparation: 'Préparation de la leçon',
    watchLesson: 'Regarder la leçon',
    lessonTranscript: 'Transcription de la leçon',
    selectedExcerpts: 'Extraits sélectionnés',
    startPoint: 'De:',
    endPoint: 'À:',
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
    copyAsText: 'Копіювати як текст',
    links: 'Посилання',
    sources: 'Джерела',
    studyMaterials: 'Навчальні матеріали',
    studyMaterialsDescription: 'Навчальні матеріали та джерела для уроків, конгресів та подій Бней Барух',
    filterByDate: 'Фільтр за датою',
    fromDate: 'Від дати',
    toDate: 'До дати',
    clearFilters: 'Очистити фільтри',
    eventsFound: 'уроків знайдено',
    loadMore: 'Завантажити більше уроків',
    readingBeforeSleep: 'Читання перед сном',
    lessonPreparation: 'Підготовка до уроку',
    watchLesson: 'Дивитися урок',
    lessonTranscript: 'Транскрипт уроку',
    selectedExcerpts: 'Вибрані уривки',
    startPoint: 'Від:',
    endPoint: 'До:',
  },
}

export default function PublicPage() {
  const [language, setLanguage] = useState('he')
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [sharedPart, setSharedPart] = useState<string | null>(null)
  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set())
  const [openShareDropdown, setOpenShareDropdown] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [totalEvents, setTotalEvents] = useState(0)

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

  // Fetch public events when language or date filters change
  useEffect(() => {
    fetchEvents()
  }, [language, startDate, endDate])

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
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Don't close if clicking inside a dropdown or share button
      if (!target.closest('[data-share-dropdown]') && !target.closest('[data-share-button]')) {
        setOpenShareDropdown(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Detect event from URL parameter and auto-select
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const eventId = urlParams.get('event')

    if (eventId && events.length > 0) {
      const event = events.find(e => e.id === eventId)
      if (event) {
        setSelectedEvent(event)
      }
    }
  }, [events])

  // Listen for browser back/forward button
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const eventId = urlParams.get('event')
      
      if (!eventId) {
        // No event in URL - go back to list
        setSelectedEvent(null)
        setParts([])
        setExpandedParts(new Set())
      } else if (events.length > 0) {
        // Event in URL - select it
        const event = events.find(e => e.id === eventId)
        if (event) {
          setSelectedEvent(event)
        }
      }
    }
    
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [events])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        public: 'true',
        limit: '10',
        language: language
      })
      if (startDate) params.append('from_date', startDate)
      if (endDate) params.append('to_date', endDate)
      
      const response = await fetch(getApiUrl(`/events?${params}`))
      const data = await response.json()
      setEvents(data.events || [])
      setTotalEvents(data.total || 0)
      // Don't auto-select - let user choose
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = async () => {
    try {
      const params = new URLSearchParams({
        public: 'true',
        limit: '10',
        offset: events.length.toString(),
        language: language
      })
      if (startDate) params.append('from_date', startDate)
      if (endDate) params.append('to_date', endDate)
      
      const response = await fetch(getApiUrl(`/events?${params}`))
      const data = await response.json()
      setEvents([...events, ...(data.events || [])])
      setTotalEvents(data.total || 0)
    } catch (error) {
      console.error('Failed to fetch more events:', error)
    }
  }

  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
  }

  const hasActiveFilters = startDate || endDate

  const fetchParts = async (eventId: string) => {
    try {
      const response = await fetch(getApiUrl(`/events/${eventId}/parts?language=${language}`))
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

  const addLanguageToUrl = (url: string) => {
    // Add language code to kabbalahmedia.info URLs
    if (url.includes('kabbalahmedia.info')) {
      // Check if URL already has a language code
      if (!url.match(/kabbalahmedia\.info\/[a-z]{2}\//)) {
        // Insert language code after domain
        return url.replace('kabbalahmedia.info/', `kabbalahmedia.info/${language}/`)
      }
    }
    return url
  }

  const generatePartMessage = (part: Part, event: Event) => {
    const eventTitle = getEventTitle(event)
    const eventDate = formatDate(event.date)
    const isPreparation = part.order === 0
    const partTitle = isPreparation ? part.title : `${t('part')} ${part.order}: ${part.title}`
    const separator = language === 'he' ? '‮━━━━━━━━━━' : '━━━━━━━━━━'
    
    let message = `*${eventTitle}*\n${eventDate}\n\n${separator}\n\n`
    
    message += `*${partTitle}*\n`
    
    if (part.description) {
      message += `${part.description}\n`
    }
    
    if (part.recorded_lesson_date) {
      message += `${t('originalDate')}${formatDateByLanguage(part.recorded_lesson_date, language)}\n`
    }
    
    // Sources
    if (part.sources && part.sources.length > 0) {
      part.sources.forEach(source => {
        const sourceUrl = addLanguageToUrl(source.source_url)
        message += `◆ ${t('readSource')}\n`
        message += `${sourceUrl}\n`
        if (source.page_number) {
          message += `   ${t('page')} ${source.page_number}\n`
        }
        message += `\n`
      })
    }
    
    // Links
    const links: { label: string; url: string }[] = []
    
    if (isPreparation) {
      if (part.reading_before_sleep_link) {
        links.push({ label: t('readingBeforeSleep'), url: addLanguageToUrl(part.reading_before_sleep_link) })
      }
      if (part.lesson_preparation_link) {
        links.push({ label: t('lessonPreparation'), url: addLanguageToUrl(part.lesson_preparation_link) })
      }
    } else {
      if (part.lesson_link) {
        links.push({ label: t('watchLesson'), url: addLanguageToUrl(part.lesson_link) })
      }
      if (part.transcript_link) {
        links.push({ label: t('lessonTranscript'), url: addLanguageToUrl(part.transcript_link) })
      }
      if (part.excerpts_link) {
        links.push({ label: t('selectedExcerpts'), url: addLanguageToUrl(part.excerpts_link) })
      }
    }
    
    // Custom links
    if (part.custom_links && part.custom_links.length > 0) {
      part.custom_links.forEach(link => {
        links.push({ label: link.title, url: addLanguageToUrl(link.url) })
      })
    }
    
    if (links.length > 0) {
      links.forEach(link => {
        message += `◆ ${link.label}\n`
        message += `${link.url}\n\n`
      })
    }
    
    return message
  }

  const generateEventMessage = (event: Event) => {
    const eventTitle = getEventTitle(event)
    const eventDate = formatDate(event.date)
    const separator = language === 'he' ? '‮━━━━━━━━━━' : '━━━━━━━━━━'
    
    let message = `*${eventTitle}*\n${eventDate}\n\n`
    
    // Include all parts information
    if (parts && parts.length > 0) {
      parts.forEach(part => {
        const isPreparation = part.order === 0
        const partTitle = isPreparation ? part.title : `${t('part')} ${part.order}: ${part.title}`
        
        message += `${separator}\n\n*${partTitle}*\n`
        
        if (part.description) {
          message += `${part.description}\n`
        }
        
        if (part.recorded_lesson_date) {
          message += `${t('originalDate')}${formatDateByLanguage(part.recorded_lesson_date, language)}\n`
        }
        
        // Sources
        if (part.sources && part.sources.length > 0) {
          part.sources.forEach(source => {
            const sourceUrl = addLanguageToUrl(source.source_url)
            message += `◆ ${t('readSource')}\n`
            message += `${sourceUrl}\n`
            if (source.page_number) {
              message += `   ${t('page')} ${source.page_number}\n`
            }
            message += `\n`
          })
        }
        
        // Links
        const links: { label: string; url: string }[] = []
        
        if (isPreparation) {
          if (part.reading_before_sleep_link) {
            links.push({ label: t('readingBeforeSleep'), url: addLanguageToUrl(part.reading_before_sleep_link) })
          }
          if (part.lesson_preparation_link) {
            links.push({ label: t('lessonPreparation'), url: addLanguageToUrl(part.lesson_preparation_link) })
          }
        } else {
          if (part.lesson_link) {
            links.push({ label: t('watchLesson'), url: addLanguageToUrl(part.lesson_link) })
          }
          if (part.transcript_link) {
            links.push({ label: t('lessonTranscript'), url: addLanguageToUrl(part.transcript_link) })
          }
          if (part.excerpts_link) {
            links.push({ label: t('selectedExcerpts'), url: addLanguageToUrl(part.excerpts_link) })
          }
        }
        
        // Custom links
        if (part.custom_links && part.custom_links.length > 0) {
          part.custom_links.forEach(link => {
            links.push({ label: link.title, url: addLanguageToUrl(link.url) })
          })
        }
        
        if (links.length > 0) {
          links.forEach(link => {
            message += `◆ ${link.label}\n`
            message += `${link.url}\n\n`
          })
        }
      })
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

  const copyPartAsText = async (part: Part, event: Event) => {
    try {
      const message = generatePartMessage(part, event)
      await navigator.clipboard.writeText(message)
      setSharedPart(part.id)
      setTimeout(() => setSharedPart(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
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
      timeZone: 'Asia/Jerusalem',
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
        bg: 'bg-amber-300/10',
        bgHover: 'hover:bg-amber-400/20',
        text: 'text-amber-900',
        icon: 'text-amber-600',
      }
    }
    
    const colorSchemes = [
      { border: 'border-blue-500', bg: 'bg-blue-300/10', bgHover: 'hover:bg-blue-400/20', text: 'text-blue-900', icon: 'text-blue-600' },
      { border: 'border-orange-500', bg: 'bg-orange-300/10', bgHover: 'hover:bg-orange-400/20', text: 'text-orange-900', icon: 'text-orange-600' },
      { border: 'border-green-500', bg: 'bg-green-300/10', bgHover: 'hover:bg-green-400/20', text: 'text-green-900', icon: 'text-green-600' },
      { border: 'border-indigo-500', bg: 'bg-indigo-300/10', bgHover: 'hover:bg-indigo-400/20', text: 'text-indigo-900', icon: 'text-indigo-600' },
      { border: 'border-teal-500', bg: 'bg-teal-300/10', bgHover: 'hover:bg-teal-400/20', text: 'text-teal-900', icon: 'text-teal-600' },
      { border: 'border-purple-500', bg: 'bg-purple-300/10', bgHover: 'hover:bg-purple-400/20', text: 'text-purple-900', icon: 'text-purple-600' },
      { border: 'border-pink-500', bg: 'bg-pink-300/10', bgHover: 'hover:bg-pink-400/20', text: 'text-pink-900', icon: 'text-pink-600' },
      { border: 'border-rose-500', bg: 'bg-rose-300/10', bgHover: 'hover:bg-rose-400/20', text: 'text-rose-900', icon: 'text-rose-600' },
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
    // Update URL to include event parameter
    window.history.pushState(null, '', `/?event=${event.id}`)
  }

  const handleBackToEvents = () => {
    setSelectedEvent(null)
    setParts([])
    setExpandedParts(new Set())
    // Reset URL to remove event parameter
    window.history.pushState(null, '', '/')
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
      className="notranslate min-h-screen bg-cyan-50"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Content */}
        {!selectedEvent ? (
          // Events List
          <div>
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-blue-900 mb-2">
                {t('studyMaterials')}
              </h1>
              <p className="text-gray-600" style={{ fontSize: '15px' }}>
                {t('studyMaterialsDescription')}
              </p>
            </div>

            {/* Filters */}
            <div className="mb-6">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  hasActiveFilters
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300'
                }`}
                style={{ fontSize: '14px' }}
              >
                <Filter className="w-4 h-4" />
                <span>{t('filterByDate')}</span>
                {hasActiveFilters && (
                  <span className="bg-white text-blue-600 rounded-full w-5 h-5 flex items-center justify-center" style={{ fontSize: '11px' }}>
                    1
                  </span>
                )}
              </button>

              {showFilters && (
                <div className="mt-4 bg-white rounded-xl shadow-md p-5">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-gray-700 mb-2" style={{ fontSize: '13px' }}>
                        {t('fromDate')}
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
                        style={{ fontSize: '14px' }}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2" style={{ fontSize: '13px' }}>
                        {t('toDate')}
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
                        style={{ fontSize: '14px' }}
                      />
                    </div>
                  </div>

                  {hasActiveFilters && (
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <span className="text-gray-600" style={{ fontSize: '13px' }}>
                        {events.length} {t('eventsFound')}
                      </span>
                      <button
                        onClick={clearFilters}
                        className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1"
                        style={{ fontSize: '13px' }}
                      >
                        <X className="w-4 h-4" />
                        <span>{t('clearFilters')}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Events List Grouped by Date */}
            <div className="space-y-4">
            {events.length === 0 ? (
              <div className="text-center text-gray-600 py-12">
                {t('noEvents')}
              </div>
            ) : (
              groupEventsByDate(events, language === 'he' ? 'he-IL' : language).map((dateGroup) => {
                const colors = getDateGroupColorClasses(dateGroup.dayIndex)
                
                return (
                  <div
                    key={dateGroup.date}
                    className={`rounded-xl shadow-md bg-white overflow-hidden ${isRTL ? 'border-r-4' : 'border-l-4'} ${isRTL ? colors.border : colors.borderLTR}`}
                  >
                    {/* Date Header */}
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center gap-2 text-blue-900">
                        <Calendar className="w-5 h-5" />
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>
                          {dateGroup.dayOfWeek}, {dateGroup.displayDate}
                        </h3>
                      </div>
                    </div>
                    
                    {/* Events for this date */}
                    <div className="divide-y divide-gray-200">
                      {dateGroup.events.map((event) => (
                        <button
                          key={event.id}
                          onClick={() => handleEventClick(event)}
                          className={`w-full p-4 hover:bg-blue-100 transition-colors group flex items-center justify-between ${isRTL ? 'text-right' : 'text-left'}`}
                        >
                          {isRTL ? (
                            <>
                              <div className="flex-1 text-right">
                                <h4 className="text-blue-900 group-hover:text-blue-700 transition-colors mb-1" style={{ fontSize: '16px' }}>
                                  {getEventTitle(event)}
                                </h4>
                                {event.start_time && event.end_time && (
                                  <div className="flex items-center gap-2 text-gray-600 justify-start" style={{ fontSize: '13px' }}>
                                    <Clock className="w-4 h-4" />
                                    <span>{event.start_time} - {event.end_time}</span>
                                  </div>
                                )}
                              </div>
                              <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-[-4px] transition-all flex-shrink-0" />
                            </>
                          ) : (
                            <>
                              <div className="flex-1 text-left">
                                <h4 className="text-blue-900 group-hover:text-blue-700 transition-colors mb-1" style={{ fontSize: '16px' }}>
                                  {getEventTitle(event)}
                                </h4>
                                {event.start_time && event.end_time && (
                                  <div className="flex items-center gap-2 text-gray-600" style={{ fontSize: '13px' }}>
                                    <Clock className="w-4 h-4" />
                                    <span>{event.start_time} - {event.end_time}</span>
                                  </div>
                                )}
                              </div>
                              <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0 rotate-180" />
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })
            )}

            {/* Load More Button */}
            {events.length > 0 && events.length < totalEvents && (
              <div className="mt-8 text-center">
                <button 
                  onClick={loadMore}
                  className="px-6 py-3 bg-white text-blue-700 border-2 border-blue-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors shadow-md font-semibold"
                  style={{ fontSize: '14px' }}
                >
                  {t('loadMore')}
                </button>
              </div>
            )}
          </div>
          </div>
        ) : parts.length === 0 ? (
          <div dir={isRTL ? 'rtl' : 'ltr'} className="max-w-2xl mx-auto">
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
          <div dir={isRTL ? 'rtl' : 'ltr'} className="max-w-2xl mx-auto">
            <button
              onClick={handleBackToEvents}
              className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
            >
              <ChevronDown className={`w-5 h-5 transform ${isRTL ? '-rotate-90' : 'rotate-90'}`} />
              {t('backToEvents')}
            </button>
            
            {/* Event Title Header */}
            <div className="mb-8 bg-blue-50 rounded-xl shadow-sm p-5 border border-blue-200 relative">
              <h2 className="text-blue-900 mb-3 font-semibold" style={{ fontSize: '20px' }}>
                {getEventTitle(selectedEvent)}
              </h2>
              <p className="text-gray-600" style={{ fontSize: '14px' }}>
                {formatDate(selectedEvent.date)}
                {selectedEvent.start_time && selectedEvent.end_time && (
                  <span> • {selectedEvent.start_time} - {selectedEvent.end_time}</span>
                )}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setOpenShareDropdown(openShareDropdown === 'event' ? null : 'event')
                }}
                className={`absolute top-5 ${isRTL ? 'left-5' : 'right-5'} bg-white text-green-500 border border-green-500 rounded-full p-2 hover:bg-green-50 transition-all flex-shrink-0 z-10`}
                data-share-button
                title={t('share')}
              >
                <Share2 className="w-4 h-4" />
              </button>
              
              {/* Share Dropdown */}
              {openShareDropdown === 'event' && (
                <div data-share-dropdown className={`absolute ${isRTL ? 'left-5' : 'right-5'} top-16 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[160px] z-20`}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const message = generateEventMessage(selectedEvent)
                      const encodedMessage = encodeURIComponent(message)
                      const whatsappUrl = `https://wa.me/?text=${encodedMessage}`
                      window.open(whatsappUrl, '_blank')
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
                      const message = generateEventMessage(selectedEvent)
                      const encodedMessage = encodeURIComponent(message)
                      const telegramUrl = `https://t.me/share/url?url=&text=${encodedMessage}`
                      window.open(telegramUrl, '_blank')
                      setOpenShareDropdown(null)
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
                  >
                    <Send className="w-5 h-5 text-blue-600" />
                    <span>{t('telegram')}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const message = generateEventMessage(selectedEvent)
                      navigator.clipboard.writeText(message)
                      setSharedPart(selectedEvent.id)
                      setTimeout(() => setSharedPart(null), 2000)
                      setOpenShareDropdown(null)
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
                  >
                    {sharedPart === selectedEvent.id ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-600" />
                    )}
                    <span>{t('copyAsText')}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {parts.map((part) => {
            const colors = getPartColorClasses(part.order)
            const isExpanded = expandedParts.has(part.id)
            const isPreparation = part.order === 0

            return (
              <div
                key={part.id}
                className={`bg-white rounded-xl shadow-lg ${isRTL ? 'border-r-4' : 'border-l-4'} ${colors.border} relative mb-6`}
              >
                {/* Part Header */}
                <div className="p-4 flex items-start gap-3">
                  <div className={`flex-1 max-w-[65%] ${isRTL ? 'border-r-4 pr-3' : 'border-l-4 pl-3'} ${colors.border}`}>
                    <h3 className={`${colors.text} font-bold mb-1`} style={{ fontSize: '16px' }}>
                      {part.order === 0 ? part.title : `${t('part')} ${part.order}: ${part.title}`}
                    </h3>
                    {part.description && (
                      <p className="text-gray-700 leading-relaxed" style={{ fontSize: '13px' }}>
                        {part.description}
                      </p>
                    )}
                    {part.recorded_lesson_date && (
                      <p className="text-gray-600 mt-2" style={{ fontSize: '12px' }}>
                        {t('originalDate')} {formatDateByLanguage(part.recorded_lesson_date, language)}
                      </p>
                    )}
                  </div>

                  {/* Action buttons - positioned on the left/right side */}
                  <div className={`flex gap-2 absolute top-4 ${isRTL ? 'left-4' : 'right-4'}`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        togglePart(part.id)
                      }}
                      className="bg-white text-blue-500 border border-blue-500 rounded-full p-2 hover:bg-blue-50 transition-all flex-shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenShareDropdown(openShareDropdown === part.id ? null : part.id)
                      }}
                      className="bg-white text-green-500 border border-green-500 rounded-full p-2 hover:bg-green-50 transition-all flex-shrink-0"
                      data-share-button
                      title={t('share')}
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    
                    {/* Share Dropdown for Part */}
                    {openShareDropdown === part.id && (
                      <div data-share-dropdown className={`absolute ${isRTL ? 'left-12' : 'right-12'} mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[160px] z-20`}>
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            copyPartAsText(part, selectedEvent)
                            setOpenShareDropdown(null)
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
                        >
                          {sharedPart === part.id ? (
                            <Check className="w-5 h-5 text-green-600" />
                          ) : (
                            <Copy className="w-5 h-5 text-gray-600" />
                          )}
                          <span>{t('copyAsText')}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Part Content (Expanded) */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 space-y-2">
                    {/* Sources */}
                    {part.sources && part.sources.length > 0 && part.sources.map((source, idx) => (
                      <div key={idx} className={`flex flex-col gap-2 ${colors.bg} rounded-lg p-3 group hover:opacity-90 transition-all`}>
                        <div className="flex items-center gap-2">
                          <BookOpen className={`w-4 h-4 ${colors.icon} flex-shrink-0`} />
                          <a
                            href={source.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex-1 ${colors.text}`}
                            style={{ fontSize: '14px' }}
                          >
                            {t('readSource')}
                            {source.page_number && (
                              <span className="text-gray-600 ml-2">
                                {` ${t('page')} ${source.page_number}`}
                              </span>
                            )}
                          </a>
                          <button
                            onClick={(e) => copyToClipboard(source.source_url, e)}
                            className={`${colors.icon} hover:opacity-70 rounded p-1 transition-opacity`}
                            title={t('copyLink')}
                          >
                            {copiedUrl === source.source_url ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {(source.start_point || source.end_point) && (
                          <div className="text-xs text-gray-600 ml-6 space-y-1">
                            {source.start_point && (
                              <div><strong>{t('startPoint')}</strong> {source.start_point}</div>
                            )}
                            {source.end_point && (
                              <div><strong>{t('endPoint')}</strong> {source.end_point}</div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Preparation Links */}
                    {isPreparation && part.reading_before_sleep_link && (
                      <div className={`flex items-center gap-2 ${colors.bg} rounded-lg p-3 group hover:opacity-90 transition-all`}>
                        <Shield className={`w-4 h-4 ${colors.icon} flex-shrink-0`} />
                        <a
                          href={part.reading_before_sleep_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex-1 ${colors.text}`}
                          style={{ fontSize: '14px' }}
                        >
                          {t('readingBeforeSleep')}
                        </a>
                        <button
                          onClick={(e) => copyToClipboard(part.reading_before_sleep_link!, e)}
                          className={`${colors.icon} hover:opacity-70 rounded p-1 transition-opacity`}
                        >
                          {copiedUrl === part.reading_before_sleep_link ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}

                    {isPreparation && part.lesson_preparation_link && (
                      <div className={`flex items-center gap-2 ${colors.bg} rounded-lg p-3 group hover:opacity-90 transition-all`}>
                        <FileText className={`w-4 h-4 ${colors.icon} flex-shrink-0`} />
                        <a
                          href={part.lesson_preparation_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex-1 ${colors.text}`}
                          style={{ fontSize: '14px' }}
                        >
                          {t('lessonPreparation')}
                        </a>
                        <button
                          onClick={(e) => copyToClipboard(part.lesson_preparation_link!, e)}
                          className={`${colors.icon} hover:opacity-70 rounded p-1 transition-opacity`}
                        >
                          {copiedUrl === part.lesson_preparation_link ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Lesson Link */}
                    {part.lesson_link && (
                      <div className={`flex items-center gap-2 ${colors.bg} rounded-lg p-3 group hover:opacity-90 transition-all`}>
                        <Video className={`w-4 h-4 ${colors.icon} flex-shrink-0`} />
                        <a
                          href={part.lesson_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex-1 ${colors.text}`}
                          style={{ fontSize: '14px' }}
                        >
                          {t('watchLesson')}
                        </a>
                        <button
                          onClick={(e) => copyToClipboard(part.lesson_link!, e)}
                          className={`${colors.icon} hover:opacity-70 rounded p-1 transition-opacity`}
                        >
                          {copiedUrl === part.lesson_link ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Transcript Link */}
                    {part.transcript_link && (
                      <div className={`flex items-center gap-2 ${colors.bg} rounded-lg p-3 group hover:opacity-90 transition-all`}>
                        <FileText className={`w-4 h-4 ${colors.icon} flex-shrink-0`} />
                        <a
                          href={part.transcript_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex-1 ${colors.text}`}
                          style={{ fontSize: '14px' }}
                        >
                          {t('lessonTranscript')}
                        </a>
                        <button
                          onClick={(e) => copyToClipboard(part.transcript_link!, e)}
                          className={`${colors.icon} hover:opacity-70 rounded p-1 transition-opacity`}
                        >
                          {copiedUrl === part.transcript_link ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Excerpts Link */}
                    {part.excerpts_link && (
                      <div className={`flex items-center gap-2 ${colors.bg} rounded-lg p-3 group hover:opacity-90 transition-all`}>
                        <BookOpen className={`w-4 h-4 ${colors.icon} flex-shrink-0`} />
                        <a
                          href={part.excerpts_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex-1 ${colors.text}`}
                          style={{ fontSize: '14px' }}
                        >
                          {t('selectedExcerpts')}
                        </a>
                        <button
                          onClick={(e) => copyToClipboard(part.excerpts_link!, e)}
                          className={`${colors.icon} hover:opacity-70 rounded p-1 transition-opacity`}
                        >
                          {copiedUrl === part.excerpts_link ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Custom Links */}
                    {part.custom_links && part.custom_links.length > 0 && part.custom_links.map((link, idx) => (
                      <div key={idx} className={`flex items-center gap-2 ${colors.bg} rounded-lg p-3 group hover:opacity-90 transition-all`}>
                        <FileText className={`w-4 h-4 ${colors.icon} flex-shrink-0`} />
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex-1 ${colors.text}`}
                          style={{ fontSize: '14px' }}
                        >
                          {link.title}
                        </a>
                        <button
                          onClick={(e) => copyToClipboard(link.url, e)}
                          className={`${colors.icon} hover:opacity-70 rounded p-1 transition-opacity`}
                        >
                          {copiedUrl === link.url ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
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
  )
}
