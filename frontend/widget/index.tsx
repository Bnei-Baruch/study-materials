import React from 'react'
import { createRoot } from 'react-dom/client'
import { EmbeddedLessonSidebar } from '../components/EmbeddedLessonSidebar'

// Widget initialization function
export function initWidget(container: HTMLElement, config: {
  eventId: string
  language?: string
  apiBaseUrl?: string
  onBack?: () => void
}) {
  const root = createRoot(container)
  root.render(
    <React.StrictMode>
      <EmbeddedLessonSidebar
        eventId={config.eventId}
        language={config.language || 'he'}
        apiBaseUrl={config.apiBaseUrl || 'http://localhost:8080'}
        onBack={config.onBack}
      />
    </React.StrictMode>
  )
  
  return () => root.unmount()
}

// Make it available globally
if (typeof window !== 'undefined') {
  (window as any).StudyMaterialsWidget = { initWidget }
}
