'use client'

import React, { useState, useEffect } from 'react'
import {
  Copy,
  Check,
  BookOpen,
  Video,
  FileText,
  Headphones,
  ChevronUp,
  ChevronDown,
  Share2,
  List,
} from 'lucide-react'

// Translation type
interface Translations {
  preparation: string
  part: string
  shareLesson: string
  shareSection: string
  copyLink: string
  copied: string
  readSource: string
  watchLesson: string
  readDocument: string
  viewExcerpts: string
  viewTranscript: string
  viewProgram: string
  readingBeforeSleep: string
  lessonPreparation: string
  loading: string
  error: string
  noPartsAvailable: string
  startPoint: string
  endPoint: string
}

// Translation object for all supported languages
const TRANSLATIONS: Record<string, Translations> = {
  he: {
    preparation: 'הכנה לשיעור',
    part: 'חלק',
    shareLesson: 'שתף',
    shareSection: 'שתף',
    copyLink: 'העתק קישור',
    copied: 'הועתק!',
    readSource: 'לקריאת המקור',
    watchLesson: 'צפייה בשיעור',
    readDocument: 'מסמך',
    viewExcerpts: 'קטעים נבחרים',
    viewTranscript: 'תמליל השיעור',
    viewProgram: 'מסמך',
    readingBeforeSleep: 'קטע הכנה לשינה',
    lessonPreparation: 'מסמך הכנה לשיעור',
    loading: 'טוען...',
    error: 'שגיאה בטעינת הנתונים',
    noPartsAvailable: 'אין חלקים זמינים',
    startPoint: 'החל מ',
    endPoint: 'עד',
  },
  en: {
    preparation: 'Lesson Preparation',
    part: 'Part',
    shareLesson: 'Share',
    shareSection: 'Share',
    copyLink: 'Copy Link',
    copied: 'Copied!',
    readSource: 'Read the source',
    watchLesson: 'Watch Lesson',
    readDocument: 'Document',
    viewExcerpts: 'Selected Excerpts',
    viewTranscript: 'Lesson Transcript',
    viewProgram: 'Document',
    readingBeforeSleep: 'Reading Before Sleep',
    lessonPreparation: 'Lesson Preparation',
    loading: 'Loading...',
    error: 'Error loading data',
    noPartsAvailable: 'No parts available',
    startPoint: 'From',
    endPoint: 'To',
  },
  ru: {
    preparation: 'Подготовка к уроку',
    part: 'Часть',
    shareLesson: 'Поделиться',
    shareSection: 'Поделиться',
    copyLink: 'Скопировать ссылку',
    copied: 'Скопировано!',
    readSource: 'Читать источник',
    watchLesson: 'Смотреть урок',
    readDocument: 'Документ',
    viewExcerpts: 'Избранные отрывки',
    viewTranscript: 'Транскрипт урока',
    viewProgram: 'Документ',
    readingBeforeSleep: 'Чтение перед сном',
    lessonPreparation: 'Подготовка к уроку',
    loading: 'Загрузка...',
    error: 'Ошибка загрузки данных',
    noPartsAvailable: 'Нет доступных частей',
    startPoint: 'От',
    endPoint: 'До',
  },
  es: {
    preparation: 'Preparación de la lección',
    part: 'Parte',
    shareLesson: 'Compartir',
    shareSection: 'Compartir',
    copyLink: 'Copiar enlace',
    copied: '¡Copiado!',
    readSource: 'Leer la fuente',
    watchLesson: 'Ver lección',
    readDocument: 'Documento',
    viewExcerpts: 'Extractos seleccionados',
    viewTranscript: 'Transcripción de la lección',
    viewProgram: 'Documento',
    readingBeforeSleep: 'Lectura antes de dormir',
    lessonPreparation: 'Preparación de la lección',
    loading: 'Cargando...',
    error: 'Error al cargar datos',
    noPartsAvailable: 'No hay partes disponibles',
    startPoint: 'De',
    endPoint: 'Hasta',
  },
  de: {
    preparation: 'Lektionsvorbereitung',
    part: 'Teil',
    shareLesson: 'Teilen',
    shareSection: 'Teilen',
    copyLink: 'Link kopieren',
    copied: 'Kopiert!',
    readSource: 'Quelle lesen',
    watchLesson: 'Lektion ansehen',
    readDocument: 'Dokument',
    viewExcerpts: 'Ausgewählte Auszüge',
    viewTranscript: 'Lektionstranskript',
    viewProgram: 'Dokument',
    readingBeforeSleep: 'Lesen vor dem Schlafengehen',
    lessonPreparation: 'Lektionsvorbereitung',
    loading: 'Lädt...',
    error: 'Fehler beim Laden der Daten',
    noPartsAvailable: 'Keine Teile verfügbar',
    startPoint: 'Von',
    endPoint: 'Bis',
  },
  it: {
    preparation: 'Preparazione della lezione',
    part: 'Parte',
    shareLesson: 'Condividi',
    shareSection: 'Condividi',
    copyLink: 'Copia link',
    copied: 'Copiato!',
    readSource: 'Leggi la fonte',
    watchLesson: 'Guarda la lezione',
    readDocument: 'Documento',
    viewExcerpts: 'Estratti selezionati',
    viewTranscript: 'Trascrizione della lezione',
    viewProgram: 'Documento',
    readingBeforeSleep: 'Lettura prima di dormire',
    lessonPreparation: 'Preparazione della lezione',
    loading: 'Caricamento...',
    error: 'Errore nel caricamento dei dati',
    noPartsAvailable: 'Nessuna parte disponibile',
    startPoint: 'Da',
    endPoint: 'A',
  },
  fr: {
    preparation: 'Préparation de la leçon',
    part: 'Partie',
    shareLesson: 'Partager',
    shareSection: 'Partager',
    copyLink: 'Copier le lien',
    copied: 'Copié!',
    readSource: 'Lire la source',
    watchLesson: 'Regarder la leçon',
    readDocument: 'Document',
    viewExcerpts: 'Extraits sélectionnés',
    viewTranscript: 'Transcription de la leçon',
    viewProgram: 'Document',
    readingBeforeSleep: 'Lecture avant de dormir',
    lessonPreparation: 'Préparation de la leçon',
    loading: 'Chargement...',
    error: 'Erreur de chargement des données',
    noPartsAvailable: 'Aucune partie disponible',
    startPoint: 'De',
    endPoint: 'À',
  },
  uk: {
    preparation: 'Підготовка до уроку',
    part: 'Частина',
    shareLesson: 'Поділитися',
    shareSection: 'Поділитися',
    copyLink: 'Копіювати посилання',
    copied: 'Скопійовано!',
    readSource: 'Читати джерело',
    watchLesson: 'Дивитися урок',
    readDocument: 'Документ',
    viewExcerpts: 'Вибрані уривки',
    viewTranscript: 'Транскрипт уроку',
    viewProgram: 'Документ',
    readingBeforeSleep: 'Читання перед сном',
    lessonPreparation: 'Підготовка до уроку',
    loading: 'Завантаження...',
    error: 'Помилка завантаження даних',
    noPartsAvailable: 'Немає доступних частин',
    startPoint: 'Від',
    endPoint: 'До',
  },
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
  order: number
  language: string
  sources: Source[]
  excerpts_link?: string
  transcript_link?: string
  lesson_link?: string
  program_link?: string
  reading_before_sleep_link?: string
  lesson_preparation_link?: string
  recorded_lesson_date?: string
  custom_links?: CustomLink[]
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

interface EmbeddedLessonSidebarProps {
  eventId: string
  language?: string
  apiBaseUrl?: string
  onBack?: () => void
}

export function EmbeddedLessonSidebar({
  eventId,
  language = 'he',
  apiBaseUrl,  // REQUIRED - no fallback
  onBack,
}: EmbeddedLessonSidebarProps) {
  const [event, setEvent] = useState<Event | null>(null)
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<number[]>([])
  const [sharedSection, setSharedSection] = useState<number | null>(null)
  const [sharedLesson, setSharedLesson] = useState<boolean>(false)
  const [showShareMenu, setShowShareMenu] = useState<'lesson' | 'section' | null>(null)
  const [shareMenuSection, setShareMenuSection] = useState<number | null>(null)

  const t = TRANSLATIONS[language] || TRANSLATIONS.he
  const isRTL = language === 'he'
  const isLTR = !isRTL

  // Fetch event and parts data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch event
        const eventRes = await fetch(`${apiBaseUrl}/api/events/${eventId}`)
        if (!eventRes.ok) {
          throw new Error('Failed to fetch event')
        }
        const eventData = await eventRes.json()
        setEvent(eventData)

        // Fetch parts
        const partsRes = await fetch(
          `${apiBaseUrl}/api/events/${eventId}/parts?language=${language}`
        )
        if (!partsRes.ok) {
          throw new Error('Failed to fetch parts')
        }
        const partsData = await partsRes.json()
        const fetchedParts = partsData.parts || []
        setParts(fetchedParts)

        // Expand all sections by default
        setExpandedSections(fetchedParts.map((_: Part, idx: number) => idx))
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err.message : t.error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [eventId, language, apiBaseUrl, t.error])

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const toggleSection = (index: number) => {
    setExpandedSections((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    )
  }

  const shareSection = (part: Part, index: number) => {
    setShareMenuSection(index)
    setShowShareMenu('section')
  }

  const shareToWhatsApp = (text: string) => {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
    setShowShareMenu(null)
  }

  const shareToTelegram = (text: string) => {
    const url = `https://t.me/share/url?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
    setShowShareMenu(null)
  }

  const getSectionShareText = (part: Part) => {
    const partNumber = part.order === 0 ? t.preparation : `${t.part} ${part.order}`
    const links = [
      ...(part.sources?.map((s) => `${t.readSource}: ${s.source_url}`) || []),
      part.excerpts_link && `${t.viewExcerpts}: ${part.excerpts_link}`,
      part.transcript_link && `${t.viewTranscript}: ${part.transcript_link}`,
      part.lesson_link && `${t.watchLesson}: ${part.lesson_link}`,
      part.program_link && `${t.viewProgram}: ${part.program_link}`,
      part.reading_before_sleep_link && `${t.readingBeforeSleep}: ${part.reading_before_sleep_link}`,
      part.lesson_preparation_link && `${t.lessonPreparation}: ${part.lesson_preparation_link}`,
      ...(part.custom_links?.map((l) => `${l.title}: ${l.url}`) || []),
    ].filter(Boolean)

    return `${partNumber}: ${part.title}\n${part.description || ''}\n\n${links.join('\n')}`
  }

  const shareLesson = () => {
    setShowShareMenu('lesson')
  }

  const getLessonShareText = () => {
    if (!event) return ''

    const title = event.titles?.[language] || 'Lesson'
    const date = formatEventDate(event.date)
    
    const partsText = parts
      .map((part) => {
        const partNumber = part.order === 0 ? t.preparation : `${t.part} ${part.order}`
        const links = [
          ...(part.sources?.map((s) => `${t.readSource}: ${s.source_url}`) || []),
          part.excerpts_link && `${t.viewExcerpts}: ${part.excerpts_link}`,
          part.transcript_link && `${t.viewTranscript}: ${part.transcript_link}`,
          part.lesson_link && `${t.watchLesson}: ${part.lesson_link}`,
          part.program_link && `${t.viewProgram}: ${part.program_link}`,
          part.reading_before_sleep_link && `${t.readingBeforeSleep}: ${part.reading_before_sleep_link}`,
          part.lesson_preparation_link && `${t.lessonPreparation}: ${part.lesson_preparation_link}`,
          ...(part.custom_links?.map((l) => `${l.title}: ${l.url}`) || []),
        ].filter(Boolean)
        
        return `${partNumber}: ${part.title}\n${part.description || ''}\n${links.join('\n')}`
      })
      .join('\n\n')

    return `${title}\n${date}\n\n${partsText}`
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'book':
        return <BookOpen className="w-3.5 h-3.5" />
      case 'video':
        return <Video className="w-3.5 h-3.5" />
      case 'document':
        return <FileText className="w-3.5 h-3.5" />
      case 'audio':
        return <Headphones className="w-3.5 h-3.5" />
      default:
        return <FileText className="w-3.5 h-3.5" />
    }
  }

  const getSectionColor = (order: number) => {
    const borderSide = isLTR ? 'border-l-[5px]' : 'border-r-[5px]'
    if (order === 0) return { text: 'text-orange-700', border: `${borderSide} border-orange-500`, bg: 'bg-orange-300/10' }
    const colors = [
      { text: 'text-blue-700', border: `${borderSide} border-blue-500`, bg: 'bg-blue-300/10' },
      { text: 'text-orange-700', border: `${borderSide} border-orange-500`, bg: 'bg-orange-300/10' },
      { text: 'text-green-700', border: `${borderSide} border-green-500`, bg: 'bg-green-300/10' },
      { text: 'text-purple-700', border: `${borderSide} border-purple-500`, bg: 'bg-purple-300/10' },
    ]
    return colors[(order - 1) % colors.length]
  }

  const getLinkIcon = (link: string | undefined, type: 'source' | 'video' | 'document' | 'audio') => {
    if (!link) return null
    switch (type) {
      case 'source':
        return getIcon('book')
      case 'video':
        return getIcon('video')
      case 'document':
        return getIcon('document')
      case 'audio':
        return getIcon('audio')
    }
  }

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString)
    
    // Map language codes to locale strings
    const localeMap: Record<string, string> = {
      'he': 'he-IL',
      'en': 'en-US',
      'ru': 'ru-RU',
      'es': 'es-ES',
      'de': 'de-DE',
      'it': 'it-IT',
      'fr': 'fr-FR',
      'uk': 'uk-UA',
    }
    
    const locale = localeMap[language] || 'en-US'
    
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  }

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-white" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-gray-600" style={{ fontSize: '14px' }}>
          {t.loading}
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-white" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-red-600 text-center p-4" style={{ fontSize: '14px' }}>
          {error || t.error}
        </div>
      </div>
    )
  }

  const eventTitle = event.titles?.[language] || event.titles?.['he'] || 'Lesson'

  return (
    <div className="h-full w-full overflow-y-auto bg-white border-t-4 border-blue-200" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Compact Header */}
      <div className="bg-blue-50 p-2 sm:p-3 border-b-2 border-blue-200 sticky top-0 z-10 relative">
        <h3 className="text-blue-900 text-[18px] sm:text-[18px] font-semibold" style={{ lineHeight: '1.2' }}>
          {eventTitle}
        </h3>
        <p className="text-gray-600 text-[11px] sm:text-[13px] mt-0.5">
          {formatEventDate(event.date)}
          {event.start_time && event.end_time && (
            <span> • {event.start_time} - {event.end_time}</span>
          )}
        </p>
        <div className={`absolute ${isRTL ? 'left-2 sm:left-3' : 'right-2 sm:right-3'} top-2 sm:top-3 flex gap-0.5 sm:gap-1`}>
          <button
            onClick={shareLesson}
            className="bg-green-500 text-white rounded-full p-0.5 sm:p-1 hover:bg-green-600 transition-all"
            title={t.shareLesson}
          >
            {sharedLesson ? <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <Share2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
          </button>
          {onBack && (
            <button
              onClick={onBack}
              className="bg-blue-500 text-white rounded-full p-1 sm:p-1.5 hover:bg-blue-600 transition-all"
            >
              <List className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Parts */}
      {parts.length === 0 ? (
        <div className="p-2 sm:p-4 text-center text-gray-500 text-[12px] sm:text-[13px]">
          {t.noPartsAvailable}
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3 p-1.5 sm:p-3">
          {parts.map((part, index) => {
            const isExpanded = expandedSections.includes(index)
            const colors = getSectionColor(part.order)
            const partTitle = part.order === 0 ? t.preparation : `${t.part} ${part.order}: ${part.title}`

            // Collect all links for this part
            const allLinks = [
              ...(part.sources?.map(s => ({ type: 'source' as const, text: t.readSource, url: s.source_url, page: s.page_number, start_point: s.start_point, end_point: s.end_point })) || []),
              part.excerpts_link && { type: 'document' as const, text: t.viewExcerpts, url: part.excerpts_link },
              part.transcript_link && { type: 'document' as const, text: t.viewTranscript, url: part.transcript_link },
              part.lesson_link && { type: 'video' as const, text: t.watchLesson, url: part.lesson_link },
              part.program_link && { type: 'audio' as const, text: t.viewProgram, url: part.program_link },
              part.reading_before_sleep_link && { type: 'document' as const, text: t.readingBeforeSleep, url: part.reading_before_sleep_link },
              part.lesson_preparation_link && { type: 'document' as const, text: t.lessonPreparation, url: part.lesson_preparation_link },
              ...(part.custom_links?.map(l => ({ type: 'document' as const, text: l.title, url: l.url })) || []),
            ].filter(Boolean) as Array<{ type: 'source' | 'video' | 'document' | 'audio', text: string, url: string, page?: string, start_point?: string, end_point?: string }>

            return (
              <div
                key={part.id}
                className={`bg-white rounded-lg ${colors.border} shadow-lg`}
              >
                {/* Section Header */}
                <div className="p-1.5 sm:p-2.5 flex items-start gap-1 sm:gap-2">
                  <div className={`flex-1 ${isRTL ? 'pr-1 sm:pr-2' : 'pl-1 sm:pl-2'}`}>
                    <h4 className={`${colors.text} text-[16px] sm:text-[16px] font-bold break-words`}>
                      {partTitle}
                    </h4>
                    {part.description && (
                      <p className="text-gray-600 leading-snug mt-0.5 text-[13px] sm:text-[13px] line-clamp-2">
                        {part.description}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
                    <button
                      onClick={() => shareSection(part, index)}
                      className="bg-white text-green-500 border border-green-400 rounded-full p-0.5 sm:p-1 hover:bg-green-50 transition-all flex-shrink-0"
                      title={t.shareSection}
                    >
                      {sharedSection === index ? (
                        <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      ) : (
                        <Share2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      )}
                    </button>

                    <button
                      onClick={() => toggleSection(index)}
                      className="bg-white text-blue-500 border border-blue-400 rounded-full p-0.5 sm:p-1 hover:bg-blue-50 transition-all flex-shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      ) : (
                        <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Section Links */}
                {isExpanded && allLinks.length > 0 && (
                  <div className={`space-y-1 sm:space-y-1.5 ${isRTL ? 'pr-1.5 sm:pr-2.5 pl-1.5 sm:pl-2.5' : 'px-1.5 sm:px-2.5'} pb-1.5 sm:pb-2.5`}>
                    {allLinks.map((link, linkIdx) => (
                      <div
                        key={linkIdx}
                        className={`flex flex-col gap-1 sm:gap-1.5 ${colors.bg} rounded-md p-1 sm:p-2 hover:opacity-80 transition-all group`}
                      >
                        <div className="flex items-center gap-1 sm:gap-2">
                          <span className={`${colors.text} flex-shrink-0`}>
                            {getLinkIcon(link.url, link.type)}
                          </span>

                          <a
                            href={link.url}
                            className={`flex-1 ${colors.text} hover:underline truncate text-[14px] sm:text-[14px]`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {link.text}
                            {link.page && <span className="text-gray-500 text-[12px] sm:text-[12px]"> (p. {link.page})</span>}
                          </a>

                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              copyToClipboard(link.url)
                            }}
                            className={`${colors.text} hover:bg-white hover:bg-opacity-50 rounded p-0.5 sm:p-1 transition-all flex-shrink-0`}
                            title={t.copyLink}
                          >
                            {copiedUrl === link.url ? (
                              <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-600" />
                            ) : (
                              <Copy className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            )}
                          </button>
                        </div>

                        {(link.start_point || link.end_point) && (
                          <div className="text-[12px] sm:text-[12px] text-gray-600 space-y-0.5 pl-6 sm:pl-7">
                            {link.start_point && (
                              <div><strong>{t.startPoint}:</strong> {link.start_point}</div>
                            )}
                            {link.end_point && (
                              <div><strong>{t.endPoint}:</strong> {link.end_point}</div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Share Menu Modal */}
      {showShareMenu && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowShareMenu(null)}
        >
          <div
            className="bg-white rounded-lg p-3 sm:p-4 m-2 sm:m-4 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <h4 className="text-gray-900 font-bold mb-2 sm:mb-3 text-[16px] sm:text-[16px]">
              {t.shareLesson}
            </h4>
            <div className="space-y-2">
              <button
                onClick={() => {
                  const text = showShareMenu === 'lesson' 
                    ? getLessonShareText() 
                    : shareMenuSection !== null 
                      ? getSectionShareText(parts[shareMenuSection])
                      : ''
                  shareToWhatsApp(text)
                }}
                className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span className="text-[14px] sm:text-[14px]">WhatsApp</span>
              </button>
              <button
                onClick={() => {
                  const text = showShareMenu === 'lesson' 
                    ? getLessonShareText() 
                    : shareMenuSection !== null 
                      ? getSectionShareText(parts[shareMenuSection])
                      : ''
                  shareToTelegram(text)
                }}
                className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                <span className="text-[14px] sm:text-[14px]">Telegram</span>
              </button>
            </div>
            <button
              onClick={() => setShowShareMenu(null)}
              className="w-full mt-2 sm:mt-3 p-2 text-gray-600 hover:text-gray-800 transition-colors text-[14px] sm:text-[14px]"
            >
              {language === 'he' ? 'ביטול' : 'Cancel'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
