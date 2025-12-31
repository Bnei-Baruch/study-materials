'use client'

import React, { useState, useEffect } from 'react'
import { EmbeddedEventsList } from './EmbeddedEventsList'
import { EmbeddedLessonSidebar } from './EmbeddedLessonSidebar'

interface StudyMaterialsWidgetProps {
  eventId?: string
  language?: string
  apiBaseUrl?: string
  limit?: number
}

export function StudyMaterialsWidget({
  eventId,
  language = 'he',
  apiBaseUrl = 'http://10.66.1.76:8080',
  limit = 10,
}: StudyMaterialsWidgetProps) {
  const [view, setView] = useState<'list' | 'detail'>(eventId ? 'detail' : 'list')
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(eventId)
  const [currentLanguage, setCurrentLanguage] = useState(language)

  // Load language from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('studymaterials-language')
      if (savedLanguage && !eventId) {
        // Only use saved language if no eventId was provided (list mode)
        setCurrentLanguage(savedLanguage)
      }
    }
  }, [eventId])

  const handleSelectEvent = (id: string) => {
    setSelectedEventId(id)
    setView('detail')
  }

  const handleBack = () => {
    setView('list')
    setSelectedEventId(undefined)
  }

  const handleLanguageChange = (lang: string) => {
    setCurrentLanguage(lang)
    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('studymaterials-language', lang)
    }
  }

  if (view === 'list') {
    return (
      <EmbeddedEventsList
        language={currentLanguage}
        apiBaseUrl={apiBaseUrl}
        limit={limit}
        onSelectEvent={handleSelectEvent}
        onLanguageChange={handleLanguageChange}
      />
    )
  }

  return (
    <EmbeddedLessonSidebar
      eventId={selectedEventId!}
      language={currentLanguage}
      apiBaseUrl={apiBaseUrl}
      onBack={handleBack}
    />
  )
}

