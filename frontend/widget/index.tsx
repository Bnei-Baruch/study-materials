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
function detectHostDarkMode(): boolean {
  // Tailwind: dark class on html/body
  const htmlHasDark = document.documentElement.classList.contains('dark')
  const bodyHasDark = document.body.classList.contains('dark')
  console.log('[StudyMaterials] detectHostDarkMode - html.dark:', htmlHasDark, 'body.dark:', bodyHasDark)
  if (htmlHasDark || bodyHasDark) {
    return true
  }
  // MUI / Galaxy3: themeName in localStorage
  const themeName = localStorage.getItem('themeName')
  const themeKey = localStorage.getItem('theme')
  const stored = themeName || themeKey
  console.log('[StudyMaterials] detectHostDarkMode - themeName:', themeName, 'theme:', themeKey, 'stored:', stored)
  if (stored === 'dark') return true
  if (stored === 'light') return false
  // MUI data attribute
  const muiScheme = document.documentElement.getAttribute('data-mui-color-scheme') ||
                    document.body.getAttribute('data-mui-color-scheme')
  console.log('[StudyMaterials] detectHostDarkMode - muiScheme:', muiScheme)
  if (muiScheme === 'dark') return true
  // CSS color-scheme on body
  const bodyStyle = getComputedStyle(document.body)
  console.log('[StudyMaterials] detectHostDarkMode - colorScheme:', bodyStyle.colorScheme)
  if (bodyStyle.colorScheme === 'dark') return true
  // OS preference fallback
  const osDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  console.log('[StudyMaterials] detectHostDarkMode - OS prefers dark:', osDark)
  return osDark
}

function initWidget(container: HTMLElement, config: {
  eventId?: string
  language?: string
  apiBaseUrl?: string
  limit?: number
  cssBaseUrl?: string
  theme?: 'light' | 'dark' | 'auto'
}): string {
  const instanceId = generateInstanceId()
  const cssBaseUrl = config.cssBaseUrl || '/widget/'
  const themeMode = config.theme || 'auto'
  
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

  // Separate inner div for dark class — Tailwind's important selector
  // generates `[data-studymaterials-widget] .dark .dark\:*` which requires
  // .dark to be a DESCENDANT of the wrapper, not on it.
  const themeLayer = document.createElement('div')
  themeLayer.style.width = '100%'
  themeLayer.style.height = '100%'
  wrapper.appendChild(themeLayer)

  const applyDark = (isDark: boolean) => {
    console.log('[StudyMaterials] applyDark:', isDark)
    if (isDark) {
      themeLayer.classList.add('dark')
    } else {
      themeLayer.classList.remove('dark')
    }
    console.log('[StudyMaterials] themeLayer classes:', themeLayer.className)
  }

  console.log('[StudyMaterials] themeMode:', themeMode)
  if (themeMode === 'dark') {
    applyDark(true)
  } else if (themeMode === 'auto') {
    const detected = detectHostDarkMode()
    console.log('[StudyMaterials] auto-detected dark:', detected)
    applyDark(detected)

    // Watch for host page class/attribute changes (Tailwind, MUI)
    const observer = new MutationObserver(() => {
      applyDark(detectHostDarkMode())
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-mui-color-scheme', 'data-theme', 'style'] })
    observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-mui-color-scheme', 'data-theme', 'style'] })

    // Watch for OS-level preference changes
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const mqlHandler = () => applyDark(detectHostDarkMode())
    mql.addEventListener('change', mqlHandler)

    // Watch for localStorage changes (MUI/Galaxy3 store theme in localStorage)
    // storage event only fires cross-tab; for same-tab we intercept setItem
    const origSetItem = localStorage.setItem.bind(localStorage)
    localStorage.setItem = function(key: string, value: string) {
      origSetItem(key, value)
      if (key === 'themeName' || key === 'theme') {
        applyDark(value === 'dark')
      }
    }

    ;(themeLayer as any).__darkModeCleanup = () => {
      observer.disconnect()
      mql.removeEventListener('change', mqlHandler)
      localStorage.setItem = origSetItem
    }
  }

  shadowRoot.appendChild(wrapper)
  
  // Load CSS into Shadow DOM only (absolute URL)
  const linkElement = document.createElement('link')
  linkElement.rel = 'stylesheet'
  const cssUrl = cssBaseUrl + 'widget.css?v=1.1.0'
  linkElement.href = cssUrl
  shadowRoot.appendChild(linkElement)

  const resolvedTheme = themeLayer.classList.contains('dark') ? 'dark' : 'light'
  console.log('[StudyMaterials] resolvedTheme:', resolvedTheme, 'themeLayer.classList:', themeLayer.className)
  const root = createRoot(themeLayer)
  
  root.render(
    <React.StrictMode>
      <StudyMaterialsWidget
        eventId={config.eventId}
        language={config.language || 'he'}
        apiBaseUrl={config.apiBaseUrl}
        limit={config.limit || 10}
        theme={resolvedTheme}
      />
    </React.StrictMode>
  )
  
  // Store instance
  widgetInstances.set(instanceId, {
    id: instanceId,
    root,
    container: shadowHost,
    unmount: () => {
      if ((themeLayer as any).__darkModeCleanup) {
        (themeLayer as any).__darkModeCleanup()
      }
      root.unmount()
    }
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

