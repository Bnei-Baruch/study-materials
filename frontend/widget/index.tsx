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
  cssBaseUrl?: string  // Base URL for CSS (defaults to /widget/)
}): string {
  const instanceId = generateInstanceId()
  const cssBaseUrl = config.cssBaseUrl || '/widget/'
  
  // Create Shadow DOM host
  const shadowHost = document.createElement('div')
  shadowHost.setAttribute('data-studymaterials-widget-shadow', instanceId)
  shadowHost.style.width = '100%'
  shadowHost.style.height = '100%'
  container.appendChild(shadowHost)
  
  // Attach Shadow DOM
  const shadowRoot = shadowHost.attachShadow({ mode: 'open' })
  
  // Create wrapper inside Shadow DOM
  const wrapper = document.createElement('div')
  wrapper.setAttribute('data-studymaterials-widget', '')
  wrapper.style.width = '100%'
  wrapper.style.height = '100%'
  shadowRoot.appendChild(wrapper)
  
  // Load CSS into Shadow DOM only (absolute URL)
  const linkElement = document.createElement('link')
  linkElement.rel = 'stylesheet'
  const cssUrl = cssBaseUrl + 'widget.css?v=1.0.0'
  console.log('🔗 Widget CSS URL:', cssUrl, 'baseUrl:', cssBaseUrl)
  linkElement.href = cssUrl
  shadowRoot.appendChild(linkElement)
  
  const root = createRoot(wrapper)
  
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
    container: shadowHost, // Store the shadow host
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
    
    // Remove wrapper from DOM (this is the wrapper we created, not the user's container)
    if (instance.container && instance.container.parentNode) {
      instance.container.parentNode.removeChild(instance.container)
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
    ...(window as any).StudyMaterialsWidget, // Preserve existing properties from loader.js
    initWidget,
    destroyWidget,
    destroyAllWidgets
  }
}

