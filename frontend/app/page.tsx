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
        {/* Header with Logo, Title and Language Selector */}
        <div className="flex items-center justify-between mb-12">
          {/* Language Selector - Left */}
          <div>
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

          {/* Logo and Title - Right */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <h1 className="text-3xl font-bold text-blue-900">
                חומרי לימוד
              </h1>
              {selectedEvent && (
                <>
                  <p className="text-gray-600 text-sm mt-1">
                    {formatDate(selectedEvent.date)}
                  </p>
                  <p className="text-lg font-semibold text-blue-800 mt-1">
                    {getEventTitle(selectedEvent)}
                  </p>
                </>
              )}
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="50 0 330 600" width="60" height="60"><defs><linearGradient id="b" x1="-364.4" x2="-361.6" y1="869.3" y2="869.3" gradientTransform="matrix(0 -190 190 0 -164969.3 -68673)" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#00b6be"></stop><stop offset="0.3" stopColor="#00b6be"></stop><stop offset="1" stopColor="#fff"></stop></linearGradient><clipPath id="a"><path fill="none" d="M221.6 59.5c-.9 7.1-.8 11.3-3 18.1-1.8 5.7-3.3 8.8-6.5 13.8-3.5 3.7-5.1 6.2-9.1 5.3-2.3-.5-3.7-1.6-5-3.7-3.4-5-18.1-42-20.2-43.6 0 2.7 11.7 43.4 12.7 54.2.9 8.7-.6 15.2-1.4 23.9l-3.2 14.9c-2.3.8-7.5-9-12.1-15.9-4-6-6.1-9.5-9.6-16 1-4.6 1.8-10.1 1.3-17.6s10.6-16.1 10.2-18.6c-.1-.8-3 1.1-5.9 3.1s-5.9 3.9-6.1 3c-.5-2.3-1.2-4.6-2-7-5.2-15.1-18.5-26.8-23.5-30 2.8 7.1 11.7 15.6 15.2 27.8s5 24.6 1.9 27c-4 3.2-14.2-1-22.6-6.2-12.1-7.5-15.8-17.6-19.6-17.6s8.4 12.9 10.1 20.3S98.3 97.3 96 97c-4.1-.5-5 1.6-1.7 2.7 4.9 1.6 13.8 3.2 18.6 3.9 16.1 2.1 30.2 1.7 43.3 14.3 10.9 10.5 14.8 20.2 17.1 35.6 1.3 8.3-9.9 5.3-30.5-7.2-7.4-4.2-16.7-12.1-18-25.8-1.6-3.7-3.5 10.3-1.1 15.7.8 1.9-4.6.5-10.9-.8-5.2-1.1-11.1-2.2-14.4-1.5-4.3 1.1 21.7 3.7 33.7 14 6.4 5.5 27.4 20.9 35.4 28.3 2.3 2.1 1.1 8.1-2.4 9.1-4.2 1.3-11.8.7-19.8-.4-14.3-1.9-20.5-9-27.1-14.8-6.6-5.9-15.1-20.9-15.1-20.9 0 4.8.7 11.9 3.6 16.9 2.6 4.3 4.3 6.7 7.6 10.6 0 0-26.4-6.5-33.4-6.5 1 2.7 17.4 6.3 25.1 10.7 9.2 5.2 40.4 21.2 39.4 23.8-2.1 5.5-28.3 3.7-37.4 4.8-9.3 1.1-23.9 2.7-24 5.7-.1 1.8 5.1 1.3 11.1.8 3.8-.3 8-.6 11.2-.3 15.8 1.5 26.7 1.6 40.3 5.3 9.6 2.6 21.1 9.9 23.2 14.4 2.1 4.4 4.5 8.5 4 21.9l-.9 33c-102.7 1.3-150.2 9.8-150.2 9.8s47.5 8.5 150.2 9.8l.9 33c.4 13.4-1.9 17.5-4 21.9-2.1 4.5-13.6 11.8-23.2 14.4-13.6 3.7-24.5 3.8-40.3 5.3-3.2.3-7.4 0-11.2-.3-6-.5-11.2-1-11.1.8.2 3 14.8 4.6 24 5.7 9.1 1 35.3-.7 37.4 4.8 1 2.7-30.2 18.6-39.4 23.8-7.7 4.5-24.1 8-25.1 10.7 7 0 33.4-6.5 33.4-6.5-3.2 3.9-4.9 6.3-7.6 10.6-3 5-3.6 12.1-3.6 16.9 0 0 8.6-15 15.1-20.9 6.6-5.9 12.7-12.9 27.1-14.8 7.9-1.1 15.5-1.7 19.8-.4 3.4 1.1 4.6 7 2.4 9.1-8 7.4-29 22.9-35.4 28.3-12 10.3-38.1 12.9-33.7 14 3.4.7 9.2-.4 14.4-1.5 6.3-1.3 11.8-2.7 10.9-.8-2.4 5.4-.4 19.4 1.1 15.7 1.3-13.7 10.5-21.6 18-25.8 20.6-12.6 31.7-15.5 30.5-7.2-2.3 15.4-6.2 25.1-17.1 35.6-13.1 12.6-27.2 12.2-43.3 14.3-4.9.6-13.8 2.2-18.6 3.9-3.3 1.1-2.4 3.2 1.7 2.7 2.4-.3 28.9-5 27.2 2.3-1.7 7.4-13.9 20.3-10.1 20.3s7.5-10.2 19.6-17.6c8.4-5.2 18.6-9.4 22.6-6.2 3.1 2.5 1.6 14.8-1.9 27s-12.4 20.6-15.2 27.8c5-3.2 18.3-14.9 23.5-30 .8-2.4 1.5-4.7 2-7 .2-.9 3.2 1.1 6.1 3 2.9 2 5.8 3.9 5.9 3.1.4-2.5-10.6-11.1-10.2-18.6.5-7.5-.3-12.9-1.3-17.6 3.4-6.4 5.6-9.9 9.6-16 4.6-6.9 9.8-16.7 12.1-15.9l3.2 14.9c.8 8.7 2.3 15.3 1.4 23.9-1 10.8-12.7 51.5-12.7 54.2 2-1.6 16.8-38.6 20.2-43.6 1.3-2.1 2.7-3.2 5-3.7 4-.9 5.6 1.6 9.1 5.3 3.2 5 4.7 8.1 6.5 13.8 2.2 6.7 2.2 11 3 18.1 1.2 9.9 1.6 15.5 1.5 25.5 3-2.1 7.3-31.4 2.5-48.4s-13.2-19.9-17.1-27.6 3.2-31.3 4-35.6c1.4-7 5.7-9.8 9.4-4.9 2.9 3.9 25 40.5 28.9 51.1 4 10.6 12.4 43.5 14.9 44.6-.3-7.1-6.6-28-7.8-35-1.4-7.6-2.3-15.9-2.3-18.1s7.1 5.7 14.5 12.4 15 13.5 16 12.4c-16.1-17.5-30.7-37.1-39.3-48.8-4.1-5.6-8.8-16.3-8.8-19.1s8.9 5.3 12.7 8.2c7.6 5.8 22 16.4 22.5 12.1 0 0-27.7-24.8-35.7-35.2-8.1-10.4-3.1-14 6.9-15.6s16 3.3 24.1 8.2c8.7 5.2 17.2 14.5 24.2 21.2 7.5 7.2 11.1 11.6 17.6 19.7 3.2-1.2-6.8-16.3-13.4-22.6-6.1-5.8-12.6-13.7-8.1-18.9 2.7-3.1 18.7-2.5 31.6-2 8.9.4 16.3.7 16.6-.1 1-2.6-35.8-10.5-54-10.7-18.2-.1-41.4-16.8-37.7-23s21.6-2.2 52.4 10.4c4.8.4-8.9-8.9-12.9-12 12.4-.4 32.5-9.7 31.9-12.4-19.5 6.2-30.5 6.6-45.1 2.2s-40-13-40-15.8c0-8-.3-18.4.7-32.8l1.1-20.4c98.4-1.6 143.9-9.7 143.9-9.7s-45.5-8.1-143.9-9.7l-1.1-20.4c-1-14.4-.7-24.8-.7-32.8s25.4-11.4 40-15.8 25.5-4 45.1 2.2c.5-2.7-19.5-12-31.9-12.4 4-3.1 17.6-12.4 12.9-12-30.8 12.6-48.7 16.6-52.4 10.4s19.5-22.9 37.7-23 55-8.1 54-10.7c-.3-.8-7.7-.5-16.6 0-12.9.5-29 1-31.6-2-4.5-5.2 1.9-13.1 8.1-18.9 6.6-6.3 16.6-21.4 13.4-22.6-6.5 8-10.1 12.4-17.6 19.7-7 6.8-15.5 16.1-24.2 21.2-8.1 4.8-14.1 9.8-24.1 8.2s-15-5.2-6.9-15.6 35.7-35.2 35.7-35.2c-.5-4.3-14.9 6.3-22.5 12.1-3.7 2.9-12.6 8.7-12.7 5.9 0-2.8 4.7-11.2 8.8-16.8 8.6-11.7 23.2-31.3 39.3-48.8-1-1.1-8.6 5.7-16 12.4-7.4 6.8-14.5 13.5-14.5 12.4 0-2.2.9-10.5 2.3-18.1 1.3-7 7.5-27.9 7.8-35-2.5 1.1-10.9 33.9-14.9 44.6-3.9 10.5-26 47.2-28.9 51.1-3.7 4.9-8 2.2-9.4-4.9-.8-4.3-7.9-27.9-4-35.6s12.3-10.6 17.1-27.6.5-46.3-2.5-48.4c0 10-.3 15.6-1.5 25.5"></path></clipPath></defs><g clipPath="url(#a)"><path fill="url(#b)" d="M22.7 34h354.7v532H22.7z"></path></g><path fill="#00b6be" d="M302.3 207c3.4 3.6 8.4 5.5 13.6 4.5s9.2-4.6 10.9-9.3c-3.4-3.6-8.4-5.5-13.6-4.5s-9.2 4.6-10.9 9.3m-28-64.9c0 4.2 3.4 7.5 7.5 7.5s7.5-3.4 7.5-7.5-3.4-7.5-7.5-7.5-7.5 3.4-7.5 7.5M79.2 190.4c1.8 5.7 6.4 10.3 12.5 11.8s12.3-.4 16.6-4.5c-1.8-5.7-6.4-10.3-12.5-11.8s-12.3.4-16.6 4.5M96 160.8c.4-5.3-1.9-10.7-6.5-14.1-4.6-3.3-10.4-3.8-15.4-1.8-.4 5.3 1.9 10.7 6.5 14.1 4.6 3.3 10.4 3.8 15.4 1.8m16.1-75.3c0-3.9-3.1-7-7-7s-7 3.1-7 7 3.1 7 7 7 7-3.1 7-7m1.3 40.4c.3-4.8-1.7-9.6-5.8-12.7-4.1-3-9.4-3.4-13.8-1.6-.3 4.8 1.7 9.6 5.8 12.7 4.1 3 9.4 3.4 13.8 1.6M126.7 227c-4.4-4-10.7-5.7-16.7-4-6.1 1.7-10.5 6.5-12.1 12.2 4.4 4 10.7 5.7 16.7 4 6.1-1.7 10.5-6.5 12.1-12.2m-.5-60.7c0 4.3 3.5 7.8 7.8 7.8s7.8-3.5 7.8-7.8-3.5-7.8-7.8-7.8-7.8 3.5-7.8 7.8m23.5-81.9c.9-5.9-1-12-5.8-16.2-4.8-4.1-11.1-5.2-16.8-3.5-.9 5.9 1 12 5.8 16.2 4.8 4.1 11.1 5.2 16.8 3.5m8.9 53.8c.4-5.3-1.9-10.7-6.5-14.1-4.6-3.3-10.4-3.8-15.4-1.8-.4 5.3 1.9 10.7 6.5 14.1 4.6 3.3 10.4 3.8 15.4 1.8m14.5-80c.9-4.1-.4-8.1-3.2-10.9-3.7 1.3-6.7 4.3-7.6 8.4s.4 8.1 3.2 10.9c3.7-1.3 6.7-4.3 7.6-8.4m11.7 48.1c1.4-4.8 0-9.8-3.1-13.3-4.5 1.3-8.3 4.8-9.7 9.6s0 9.8 3.1 13.3c4.5-1.3 8.3-4.8 9.7-9.6m26-28.7c3.4-5.6 3.9-12.7.8-18.9-1.1-2.1-2.6-3.8-4.2-5.3-3.2-2.9-7.2-4.8-11.5-5.1-3.4 5.6-3.9 12.7-.8 18.9 3.2 6.2 9.2 9.9 15.7 10.5m16.4 25.6c-5.6 1.9-10.2 6.6-11.6 12.7-1.4 6.2.6 12.3 4.8 16.5 5.6-1.9 10.2-6.6 11.6-12.7 1.4-6.2-.6-12.3-4.8-16.5m10.7-18.2c-3.9 0-7 3.1-7 7s3.1 7 7 7 7-3.1 7-7-3.1-7-7-7m9.2-32.1c2.3-4.5 1.9-9.7-.6-13.7-4.7.4-9.2 3.1-11.4 7.6-2.3 4.5-1.9 9.7.6 13.7 4.7-.4 9.2-3.1 11.4-7.6m4 14.2c-3.3-2.1-7.6-2.5-11.3-.7s-6.1 5.4-6.5 9.3c3.3 2.1 7.6 2.5 11.3.7s6.1-5.4 6.5-9.3m11.8 83.9c-4.2 1.4-7.6 4.9-8.7 9.5s.5 9.2 3.6 12.4c4.2-1.5 7.6-4.9 8.7-9.5s-.5-9.2-3.6-12.4m16.6-73.6c3.1-4 3.7-9.1 2.1-13.6-4.7-.5-9.6 1.3-12.7 5.3s-3.7 9.1-2.1 13.6c4.7.5 9.6-1.3 12.7-5.3m19.5 28.7c-4.4-4-10.7-5.7-16.7-4-6.1 1.7-10.5 6.5-12.1 12.2 4.4 4 10.7 5.7 16.7 4 6.1-1.7 10.5-6.5 12.1-12.2m.5 126.3c0-4.6-3.8-8.4-8.4-8.4s-8.4 3.8-8.4 8.4 3.8 8.4 8.4 8.4 8.4-3.7 8.4-8.4m22.6-73.6c-3.3-3-8-4.3-12.5-3-4.6 1.3-7.8 4.9-9.1 9.2 3.3 3 8 4.3 12.6 3s7.8-4.9 9.1-9.2"></path></svg>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto">

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
    </div>
  )
}
