/**
 * Study Materials Widget Loader
 * 
 * This script detects widget containers and loads the widget bundle dynamically.
 * Usage:
 * <script src="https://your-domain.com/widget/widget.js"></script>
 * <div data-studymaterials-widget data-event-id="..." data-language="he"></div>
 * 
 * Or auto-inject:
 * <script src="..." data-auto-inject="true" data-event-id="..." data-language="he"></script>
 */

(function() {
  'use strict';
  
  const WIDGET_VERSION = '1.0.0';
  const currentScript = document.currentScript || document.querySelector('script[src*="widget.js"]');
  const scriptSrc = currentScript ? currentScript.src : '';
  const baseUrl = scriptSrc.replace(/widget\.js.*$/, '');
  
  // Prevent duplicate loading
  if (window.__STUDYMATERIALS_WIDGET_LOADED__) {
    console.warn('Study Materials Widget already loaded');
    return;
  }
  window.__STUDYMATERIALS_WIDGET_LOADED__ = true;

  // Load CSS
  function loadCSS() {
    if (document.querySelector('link[href*="widget.css"]')) return;
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = baseUrl + 'widget.css?v=' + WIDGET_VERSION;
    document.head.appendChild(link);
  }

  // Load widget bundle
  function loadBundle() {
    return new Promise((resolve, reject) => {
      if (window.StudyMaterialsWidget) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = baseUrl + 'widget.bundle.js?v=' + WIDGET_VERSION;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Initialize widget in container
  function initWidgetInContainer(container) {
    const eventId = container.getAttribute('data-event-id');
    const language = container.getAttribute('data-language') || 'he';
    const apiUrl = container.getAttribute('data-api-url') || 'http://localhost:8080';
    const position = container.getAttribute('data-position') || 'inline';
    const width = container.getAttribute('data-width') || '320px';

    if (!eventId) {
      console.error('Widget container missing data-event-id attribute');
      return;
    }

    // Apply positioning styles
    if (position === 'fixed-right') {
      container.style.cssText = `
        position: fixed;
        top: 0;
        right: 0;
        height: 100vh;
        width: ${width};
        z-index: 9999;
        box-shadow: -2px 0 10px rgba(0,0,0,0.1);
      `;
    } else if (position === 'fixed-left') {
      container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        width: ${width};
        z-index: 9999;
        box-shadow: 2px 0 10px rgba(0,0,0,0.1);
      `;
    } else {
      container.style.cssText = `
        width: ${width};
        height: 100%;
        min-height: 400px;
      `;
    }

    // Wait for bundle to load
    loadBundle()
      .then(() => {
        if (!window.StudyMaterialsWidget) {
          throw new Error('Widget bundle failed to initialize');
        }

        window.StudyMaterialsWidget.initWidget(container, {
          eventId: eventId,
          language: language,
          apiBaseUrl: apiUrl,
        });
      })
      .catch(error => {
        console.error('Failed to initialize widget:', error);
        container.innerHTML = `
          <div style="padding: 20px; text-align: center; color: #dc2626;">
            Failed to load study materials widget
          </div>
        `;
      });
  }

  // Auto-inject mode
  function handleAutoInject() {
    const autoInject = currentScript.getAttribute('data-auto-inject');
    if (autoInject !== 'true') return;

    const eventId = currentScript.getAttribute('data-event-id');
    const language = currentScript.getAttribute('data-language') || 'he';
    const apiUrl = currentScript.getAttribute('data-api-url') || 'http://localhost:8080';
    const position = currentScript.getAttribute('data-position') || 'fixed-right';
    const width = currentScript.getAttribute('data-width') || '320px';

    if (!eventId) {
      console.error('Auto-inject mode requires data-event-id attribute on script tag');
      return;
    }

    // Create container
    const container = document.createElement('div');
    container.setAttribute('data-studymaterials-widget', '');
    container.setAttribute('data-event-id', eventId);
    container.setAttribute('data-language', language);
    container.setAttribute('data-api-url', apiUrl);
    container.setAttribute('data-position', position);
    container.setAttribute('data-width', width);

    document.body.appendChild(container);
    initWidgetInContainer(container);
  }

  // Find and initialize all widget containers
  function initAllWidgets() {
    loadCSS();

    // Find existing containers
    const containers = document.querySelectorAll('[data-studymaterials-widget]');
    containers.forEach(initWidgetInContainer);

    // Check for auto-inject
    handleAutoInject();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllWidgets);
  } else {
    initAllWidgets();
  }

  // Expose manual initialization function
  window.StudyMaterialsWidget = window.StudyMaterialsWidget || {};
  window.StudyMaterialsWidget.version = WIDGET_VERSION;
  window.StudyMaterialsWidget.load = function(eventId, language, options) {
    options = options || {};
    const container = document.createElement('div');
    container.setAttribute('data-studymaterials-widget', '');
    container.setAttribute('data-event-id', eventId);
    container.setAttribute('data-language', language || 'he');
    
    if (options.apiUrl) {
      container.setAttribute('data-api-url', options.apiUrl);
    }
    if (options.position) {
      container.setAttribute('data-position', options.position);
    }
    if (options.width) {
      container.setAttribute('data-width', options.width);
    }
    if (options.target) {
      options.target.appendChild(container);
    } else {
      document.body.appendChild(container);
    }

    loadCSS();
    initWidgetInContainer(container);
    
    return container;
  };
})();
