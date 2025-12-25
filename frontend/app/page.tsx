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

export default function PublicPage() {
  const [language, setLanguage] = useState('he')
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set())

  // Load language from localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem('studyMaterialsLanguage')
    if (savedLang && LANGUAGES[savedLang as keyof typeof LANGUAGES]) {
      setLanguage(savedLang)
    }
  }, [])

  // Save language to localStorage
  useEffect(() => {
    localStorage.setItem('studyMaterialsLanguage', language)
  }, [language])

  // Fetch public events
  useEffect(() => {
    fetchEvents()
  }, [])

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

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:8080/api/events?public=true&limit=10')
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(language === 'he' ? 'he-IL' : 'en-US', {
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
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Admin Link (top-right) */}
        <div className={`${isRTL ? 'text-left' : 'text-right'} mb-4`}>
          <a
            href="/events"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {language === 'he' ? 'ממשק ניהול' : 'Admin Interface'}
          </a>
        </div>

        {/* Header with Language Selector */}
        <div className="text-center mb-12">
          <div className="inline-block bg-white rounded-2xl shadow-lg px-8 py-6 mb-4">
            <h1 className="text-3xl font-bold text-blue-900 mb-2">
              {language === 'he' ? 'חומרי לימוד' : 'Study Materials'}
            </h1>
            {selectedEvent && (
              <>
                <p className="text-gray-600 mb-4">
                  {formatDate(selectedEvent.date)}
                </p>
                <p className="text-lg font-semibold text-blue-800">
                  {getEventTitle(selectedEvent)}
                </p>
              </>
            )}
          </div>

          {/* Language Selector */}
          <div className="inline-block">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-white rounded-xl shadow-md px-4 py-2 text-gray-700 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(LANGUAGES).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Events List or Parts View */}
        {!selectedEvent ? (
          // Events List
          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="text-center text-gray-600 py-12">
                {language === 'he' ? 'אין אירועים זמינים' : 'No events available'}
              </div>
            ) : (
              events.map((event) => (
                <button
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className="w-full bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow text-right"
                  dir={isRTL ? 'rtl' : 'ltr'}
                >
                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <h2 className="text-xl font-bold text-blue-900 mb-2">
                        {getEventTitle(event)}
                      </h2>
                      <p className="text-gray-600">
                        {formatDate(event.date)}
                      </p>
                    </div>
                    <ChevronDown className={`w-6 h-6 text-blue-600 transform ${isRTL ? 'rotate-90' : '-rotate-90'}`} />
                  </div>
                </button>
              ))
            )}
          </div>
        ) : parts.length === 0 ? (
          <div>
            <button
              onClick={handleBackToEvents}
              className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
            >
              <ChevronDown className={`w-5 h-5 transform ${isRTL ? 'rotate-90' : 'rotate-90'}`} />
              {language === 'he' ? 'חזרה לרשימת אירועים' : 'Back to events'}
            </button>
            <div className="text-center text-gray-600">
              {language === 'he' ? 'אין חומרים זמינים' : 'No materials available'}
            </div>
          </div>
        ) : (
          // Parts List
          <div>
            <button
              onClick={handleBackToEvents}
              className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
            >
              <ChevronDown className={`w-5 h-5 transform ${isRTL ? 'rotate-90' : 'rotate-90'}`} />
              {language === 'he' ? 'חזרה לרשימת אירועים' : 'Back to events'}
            </button>
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
                  className={`${isRTL ? 'border-r-4 pr-4' : 'border-l-4 pl-4'} ${colors.border} mb-6 cursor-pointer`}
                  onClick={() => togglePart(part.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h2 className={`text-2xl font-bold ${colors.text} mb-2`}>
                        {part.title}
                      </h2>
                      {part.description && (
                        <p className="text-gray-600">{part.description}</p>
                      )}
                      {part.recorded_lesson_date && (
                        <p className="text-gray-600 mt-1">
                          {language === 'he' ? 'תאריך השיעור המקורי: ' : 'Original lesson date: '}
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
                            <span className={colors.text}>{source.source_title}</span>
                            {source.page_number && (
                              <span className="text-gray-600 text-sm mr-2">
                                {language === 'he' ? ` עמ' ${source.page_number}` : ` p. ${source.page_number}`}
                              </span>
                            )}
                          </div>
                        </a>
                        <button
                          onClick={(e) => copyToClipboard(source.source_url, e)}
                          className={`${colors.bg} ${colors.bgHover} transition-all rounded-xl p-4`}
                          title={language === 'he' ? 'העתק קישור' : 'Copy link'}
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
                            {language === 'he' ? 'קטע הכנה לשינה' : 'Reading Before Sleep'}
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
                            {language === 'he' ? 'מסמך הכנה לשיעור' : 'Lesson Preparation'}
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
                            {language === 'he' ? 'צפייה בשיעור' : 'Watch Lesson'}
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
                            {language === 'he' ? 'תמליל השיעור' : 'Lesson Transcript'}
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
                            {language === 'he' ? 'קטעים נבחרים' : 'Selected Excerpts'}
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
  )
}
