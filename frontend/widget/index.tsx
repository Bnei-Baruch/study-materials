import React from 'react'
import { createRoot, Root } from 'react-dom/client'
import { StudyMaterialsWidget } from '../components/StudyMaterialsWidget'

// Widget instance registry
interface WidgetInstance {
  id: string
  root: Root
  container: HTMLElement
  unmount: () => void
}

const widgetInstances = new Map<string, WidgetInstance>()

// Generate unique instance ID
function generateInstanceId(): string {
  return `widget-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// Widget initialization function
function initWidget(container: HTMLElement, config: {
  eventId?: string  // Now optional
  language?: string
  apiBaseUrl?: string
  limit?: number  // Number of events to show in list
}): string {
  const root = createRoot(container)
  const instanceId = generateInstanceId()
  
  root.render(
    <React.StrictMode>
      <StudyMaterialsWidget
        eventId={config.eventId}
        language={config.language || 'he'}
        apiBaseUrl={config.apiBaseUrl || 'http://10.66.1.76:8080'}
        limit={config.limit || 10}
      />
    </React.StrictMode>
  )
  
  // Store instance
  widgetInstances.set(instanceId, {
    id: instanceId,
    root,
    container,
    unmount: () => root.unmount()
  })
  
  return instanceId
}

// Widget destruction function
function destroyWidget(instanceId: string): boolean {
  const instance = widgetInstances.get(instanceId)
  
  if (!instance) {
    console.warn(`Widget instance ${instanceId} not found`)
    return false
  }
  
  try {
    // Unmount React
    instance.unmount()
    
    // Clear DOM
    if (instance.container && instance.container.parentNode) {
      instance.container.innerHTML = ''
    }
    
    // Remove from registry
    widgetInstances.delete(instanceId)
    
    return true
  } catch (error) {
    console.error('Error destroying widget:', error)
    return false
  }
}

// Destroy all widgets
function destroyAllWidgets(): void {
  const instanceIds = Array.from(widgetInstances.keys())
  instanceIds.forEach(id => destroyWidget(id))
}

// Export for esbuild to pick up with globalName
export { initWidget, destroyWidget, destroyAllWidgets }

// Also set on window.StudyMaterialsWidget for the loader
if (typeof window !== 'undefined') {
  (window as any).StudyMaterialsWidget = {
    initWidget,
    destroyWidget,
    destroyAllWidgets
  }
}

