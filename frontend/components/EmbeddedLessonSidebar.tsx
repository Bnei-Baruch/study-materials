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
  loading: string
  error: string
  noPartsAvailable: string
}

// Translation object for all supported languages
const TRANSLATIONS: Record<string, Translations> = {
  he: {
    preparation: 'הכנה לשיעור',
    part: 'חלק',
    shareLesson: 'שתף שיעור',
    shareSection: 'שתף חלק',
    copyLink: 'העתק קישור',
    copied: 'הועתק!',
    readSource: 'לקריאת המקור',
    watchLesson: 'לצפייה בשיעור',
    readDocument: 'לקריאת מסמכים',
    viewExcerpts: 'לקריאת תמצית',
    viewTranscript: 'לקריאת תמליל',
    viewProgram: 'לצפייה בתוכנית',
    loading: 'טוען...',
    error: 'שגיאה בטעינת הנתונים',
    noPartsAvailable: 'אין חלקים זמינים',
  },
  en: {
    preparation: 'Lesson Preparation',
    part: 'Part',
    shareLesson: 'Share Lesson',
    shareSection: 'Share Section',
    copyLink: 'Copy Link',
    copied: 'Copied!',
    readSource: 'Read the source',
    watchLesson: 'Watch lesson',
    readDocument: 'Read documents',
    viewExcerpts: 'View excerpts',
    viewTranscript: 'View transcript',
    viewProgram: 'View program',
    loading: 'Loading...',
    error: 'Error loading data',
    noPartsAvailable: 'No parts available',
  },
  ru: {
    preparation: 'Подготовка к уроку',
    part: 'Часть',
    shareLesson: 'Поделиться уроком',
    shareSection: 'Поделиться частью',
    copyLink: 'Скопировать ссылку',
    copied: 'Скопировано!',
    readSource: 'Читать источник',
    watchLesson: 'Смотреть урок',
    readDocument: 'Читать документы',
    viewExcerpts: 'Просмотр выдержек',
    viewTranscript: 'Просмотр транскрипта',
    viewProgram: 'Просмотр программы',
    loading: 'Загрузка...',
    error: 'Ошибка загрузки данных',
    noPartsAvailable: 'Нет доступных частей',
  },
  es: {
    preparation: 'Preparación de la lección',
    part: 'Parte',
    shareLesson: 'Compartir lección',
    shareSection: 'Compartir parte',
    copyLink: 'Copiar enlace',
    copied: '¡Copiado!',
    readSource: 'Leer la fuente',
    watchLesson: 'Ver lección',
    readDocument: 'Leer documentos',
    viewExcerpts: 'Ver extractos',
    viewTranscript: 'Ver transcripción',
    viewProgram: 'Ver programa',
    loading: 'Cargando...',
    error: 'Error al cargar datos',
    noPartsAvailable: 'No hay partes disponibles',
  },
  de: {
    preparation: 'Unterrichtsvorbereitung',
    part: 'Teil',
    shareLesson: 'Lektion teilen',
    shareSection: 'Teil teilen',
    copyLink: 'Link kopieren',
    copied: 'Kopiert!',
    readSource: 'Quelle lesen',
    watchLesson: 'Lektion ansehen',
    readDocument: 'Dokumente lesen',
    viewExcerpts: 'Auszüge ansehen',
    viewTranscript: 'Transkript ansehen',
    viewProgram: 'Programm ansehen',
    loading: 'Lädt...',
    error: 'Fehler beim Laden der Daten',
    noPartsAvailable: 'Keine Teile verfügbar',
  },
  it: {
    preparation: 'Preparazione della lezione',
    part: 'Parte',
    shareLesson: 'Condividi lezione',
    shareSection: 'Condividi parte',
    copyLink: 'Copia link',
    copied: 'Copiato!',
    readSource: 'Leggi la fonte',
    watchLesson: 'Guarda lezione',
    readDocument: 'Leggi documenti',
    viewExcerpts: 'Visualizza estratti',
    viewTranscript: 'Visualizza trascrizione',
    viewProgram: 'Visualizza programma',
    loading: 'Caricamento...',
    error: 'Errore nel caricamento dei dati',
    noPartsAvailable: 'Nessuna parte disponibile',
  },
  fr: {
    preparation: 'Préparation de la leçon',
    part: 'Partie',
    shareLesson: 'Partager la leçon',
    shareSection: 'Partager la partie',
    copyLink: 'Copier le lien',
    copied: 'Copié!',
    readSource: 'Lire la source',
    watchLesson: 'Regarder la leçon',
    readDocument: 'Lire les documents',
    viewExcerpts: 'Voir les extraits',
    viewTranscript: 'Voir la transcription',
    viewProgram: 'Voir le programme',
    loading: 'Chargement...',
    error: 'Erreur de chargement des données',
    noPartsAvailable: 'Aucune partie disponible',
  },
  uk: {
    preparation: 'Підготовка до уроку',
    part: 'Частина',
    shareLesson: 'Поділитися уроком',
    shareSection: 'Поділитися частиною',
    copyLink: 'Скопіювати посилання',
    copied: 'Скопійовано!',
    readSource: 'Читати джерело',
    watchLesson: 'Дивитися урок',
    readDocument: 'Читати документи',
    viewExcerpts: 'Переглянути витяги',
    viewTranscript: 'Переглянути транскрипт',
    viewProgram: 'Переглянути програму',
    loading: 'Завантаження...',
    error: 'Помилка завантаження даних',
    noPartsAvailable: 'Немає доступних частин',
  },
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
  apiBaseUrl = 'http://localhost:8080',
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

  const t = TRANSLATIONS[language] || TRANSLATIONS.he
  const isRTL = language === 'he'

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

  const shareSection = async (part: Part, index: number) => {
    const partNumber = part.order === 0 ? t.preparation : `${t.part} ${part.order}`
    const links = [
      ...(part.sources?.map((s) => `${s.source_title}: ${s.source_url}`) || []),
      part.excerpts_link && `${t.viewExcerpts}: ${part.excerpts_link}`,
      part.transcript_link && `${t.viewTranscript}: ${part.transcript_link}`,
      part.lesson_link && `${t.watchLesson}: ${part.lesson_link}`,
      part.program_link && `${t.viewProgram}: ${part.program_link}`,
      ...(part.custom_links?.map((l) => `${l.title}: ${l.url}`) || []),
    ].filter(Boolean)

    const shareText = `${partNumber}: ${part.title}\n${
      part.description || ''
    }\n\n${links.join('\n')}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: part.title,
          text: shareText,
        })
      } catch (err) {
        console.log('Share cancelled')
      }
    } else {
      navigator.clipboard.writeText(shareText)
      setSharedSection(index)
      setTimeout(() => setSharedSection(null), 2000)
    }
  }

  const shareLesson = async () => {
    if (!event) return

    const title = event.titles?.[language] || 'Lesson'
    const date = new Date(event.date).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US')
    
    const partsText = parts
      .map((part) => {
        const partNumber = part.order === 0 ? t.preparation : `${t.part} ${part.order}`
        const links = [
          ...(part.sources?.map((s) => `${s.source_title}: ${s.source_url}`) || []),
          part.excerpts_link && `${t.viewExcerpts}: ${part.excerpts_link}`,
          part.transcript_link && `${t.viewTranscript}: ${part.transcript_link}`,
          part.lesson_link && `${t.watchLesson}: ${part.lesson_link}`,
          part.program_link && `${t.viewProgram}: ${part.program_link}`,
          ...(part.custom_links?.map((l) => `${l.title}: ${l.url}`) || []),
        ].filter(Boolean)
        
        return `${partNumber}: ${part.title}\n${part.description || ''}\n${links.join('\n')}`
      })
      .join('\n\n')

    const shareText = `${title}\n${date}\n\n${partsText}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: shareText,
        })
      } catch (err) {
        console.log('Share cancelled')
      }
    } else {
      navigator.clipboard.writeText(shareText)
      setSharedLesson(true)
      setTimeout(() => setSharedLesson(false), 2000)
    }
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
    if (order === 0) return { text: 'text-orange-700', border: 'border-r-orange-500', bg: 'bg-orange-300/10' }
    const colors = [
      { text: 'text-blue-700', border: 'border-r-blue-500', bg: 'bg-blue-300/10' },
      { text: 'text-orange-700', border: 'border-r-orange-500', bg: 'bg-orange-300/10' },
      { text: 'text-green-700', border: 'border-r-green-500', bg: 'bg-green-300/10' },
      { text: 'text-purple-700', border: 'border-r-purple-500', bg: 'bg-purple-300/10' },
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
    return new Intl.DateTimeFormat(language === 'he' ? 'he-IL' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-gray-600" style={{ fontSize: '13px' }}>
          {t.loading}
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="h-full flex items-center justify-center bg-white" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-red-600 text-center p-4" style={{ fontSize: '13px' }}>
          {error || t.error}
        </div>
      </div>
    )
  }

  const eventTitle = event.titles?.[language] || event.titles?.['he'] || 'Lesson'

  return (
    <div className="h-full overflow-y-auto bg-white" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Compact Header */}
      <div className="bg-blue-50 p-3 border-b-2 border-blue-200 sticky top-0 z-10 relative">
        <h3 className="text-blue-900" style={{ fontSize: '15px' }}>
          {eventTitle}
        </h3>
        <p className="text-gray-600" style={{ fontSize: '11px' }}>
          {formatEventDate(event.date)}
          {event.start_time && event.end_time && (
            <span> • {event.start_time} - {event.end_time}</span>
          )}
        </p>
        <div className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-3 flex gap-1`}>
          <button
            onClick={shareLesson}
            className="bg-green-500 text-white rounded-full p-1 hover:bg-green-600 transition-all"
            title={t.shareLesson}
          >
            {sharedLesson ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
          </button>
          {onBack && (
            <button
              onClick={onBack}
              className="bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600 transition-all"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Parts */}
      {parts.length === 0 ? (
        <div className="p-4 text-center text-gray-500" style={{ fontSize: '13px' }}>
          {t.noPartsAvailable}
        </div>
      ) : (
        <div className="space-y-3 p-3">
          {parts.map((part, index) => {
            const isExpanded = expandedSections.includes(index)
            const colors = getSectionColor(part.order)
            const partTitle = part.order === 0 ? t.preparation : `${t.part} ${part.order}: ${part.title}`

            // Collect all links for this part
            const allLinks = [
              ...part.sources.map(s => ({ type: 'source' as const, text: s.source_title, url: s.source_url, page: s.page_number })),
              part.excerpts_link && { type: 'document' as const, text: t.viewExcerpts, url: part.excerpts_link },
              part.transcript_link && { type: 'document' as const, text: t.viewTranscript, url: part.transcript_link },
              part.lesson_link && { type: 'video' as const, text: t.watchLesson, url: part.lesson_link },
              part.program_link && { type: 'audio' as const, text: t.viewProgram, url: part.program_link },
              part.reading_before_sleep_link && { type: 'document' as const, text: t.readDocument, url: part.reading_before_sleep_link },
              part.lesson_preparation_link && { type: 'document' as const, text: t.readDocument, url: part.lesson_preparation_link },
              ...(part.custom_links?.map(l => ({ type: 'document' as const, text: l.title, url: l.url })) || []),
            ].filter(Boolean) as Array<{ type: 'source' | 'video' | 'document' | 'audio', text: string, url: string, page?: string }>

            return (
              <div
                key={part.id}
                className={`bg-white rounded-lg border-r-3 ${colors.border} shadow-sm`}
              >
                {/* Section Header */}
                <div className="p-2.5 flex items-start gap-2">
                  <div className={`flex-1 ${isRTL ? 'pr-2' : 'pl-2'}`}>
                    <h4 className={`${colors.text}`} style={{ fontSize: '13px', fontWeight: 'bold' }}>
                      {partTitle}
                    </h4>
                    {part.description && (
                      <p className="text-gray-600 leading-snug mt-0.5" style={{ fontSize: '10px' }}>
                        {part.description}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => shareSection(part, index)}
                      className="bg-white text-green-500 border border-green-400 rounded-full p-1 hover:bg-green-50 transition-all flex-shrink-0"
                      title={t.shareSection}
                    >
                      {sharedSection === index ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Share2 className="w-3 h-3" />
                      )}
                    </button>

                    <button
                      onClick={() => toggleSection(index)}
                      className="bg-white text-blue-500 border border-blue-400 rounded-full p-1 hover:bg-blue-50 transition-all flex-shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Section Links */}
                {isExpanded && allLinks.length > 0 && (
                  <div className={`${isRTL ? 'pr-2.5 pl-2.5' : 'px-2.5'} pb-2.5 space-y-1.5`}>
                    {allLinks.map((link, linkIdx) => (
                      <div
                        key={linkIdx}
                        className={`flex items-center gap-2 ${colors.bg} rounded-md p-2 hover:opacity-80 transition-all group`}
                      >
                        <span className={colors.text}>
                          {getLinkIcon(link.url, link.type)}
                        </span>

                        <a
                          href={link.url}
                          className={`flex-1 ${colors.text} hover:underline`}
                          style={{ fontSize: '11px' }}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {link.text}
                          {link.page && <span className="text-gray-500"> (p. {link.page})</span>}
                        </a>

                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            copyToClipboard(link.url)
                          }}
                          className={`${colors.text} hover:bg-white hover:bg-opacity-50 rounded p-1 transition-all opacity-0 group-hover:opacity-100`}
                          title={t.copyLink}
                        >
                          {copiedUrl === link.url ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
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
      )}
    </div>
  )
}
