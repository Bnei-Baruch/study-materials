import React from 'react'
import { createRoot } from 'react-dom/client'
import { StudyMaterialsWidget } from '../components/StudyMaterialsWidget'

// Widget initialization function
export function initWidget(container: HTMLElement, config: {
  eventId?: string  // Now optional
  language?: string
  apiBaseUrl?: string
  limit?: number  // Number of events to show in list
}) {
  const root = createRoot(container)
  root.render(
    <React.StrictMode>
      <StudyMaterialsWidget
        eventId={config.eventId}
        language={config.language || 'he'}
        apiBaseUrl={config.apiBaseUrl || 'http://localhost:8080'}
        limit={config.limit || 10}
      />
    </React.StrictMode>
  )
  
  return () => root.unmount()
}

// Make it available globally
if (typeof window !== 'undefined') {
  (window as any).StudyMaterialsWidget = { initWidget }
}
