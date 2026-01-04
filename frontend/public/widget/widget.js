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
  
  // Calculate base URL - convert relative to absolute
  let baseUrl = scriptSrc.replace(/widget\.js.*$/, '');
  if (baseUrl && !baseUrl.startsWith('http')) {
    // Convert relative to absolute URL
    baseUrl = new URL(baseUrl, window.location.href).href;
  }
  
  // Prevent duplicate loading
  if (window.__STUDYMATERIALS_WIDGET_LOADED__) {
    console.warn('Study Materials Widget already loaded');
    return;
  }
  window.__STUDYMATERIALS_WIDGET_LOADED__ = true;

  // Load CSS - DISABLED FOR TESTING
  function loadCSS() {
    // CSS loading temporarily disabled to test if CSS is causing button style conflicts
    return;
  }

  // Load widget bundle
  function loadBundle() {
    return new Promise((resolve, reject) => {
      if (window.StudyMaterialsWidget && window.StudyMaterialsWidget.initWidget) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = baseUrl + 'widget.bundle.js?v=' + WIDGET_VERSION + '&t=' + Date.now();
      script.onload = () => {
        // Double-check that the bundle loaded correctly
        if (window.StudyMaterialsWidget && window.StudyMaterialsWidget.initWidget) {
          resolve();
        } else {
          reject(new Error('Bundle loaded but initWidget not available'));
        }
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Initialize widget in container
  function initWidgetInContainer(container) {
    const eventId = container.getAttribute('data-event-id');  // Optional now
    const language = container.getAttribute('data-language') || 'he';
    const apiUrl = container.getAttribute('data-api-url');  // REQUIRED - no fallback
    const limit = parseInt(container.getAttribute('data-limit') || '10');
    const position = container.getAttribute('data-position') || 'inline';
    const width = container.getAttribute('data-width') || '320px';

    // Validate required attributes
    if (!apiUrl) {
      console.error('Widget Error: data-api-url attribute is required');
      container.innerHTML = '<div style="color: red; padding: 10px;">Error: Missing data-api-url attribute</div>';
      return Promise.reject(new Error('Missing data-api-url'));
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
      // Inline mode - let container fill its parent width (responsive)
      container.style.cssText = `
        width: 100%;
        height: 100%;
        min-height: 400px;
      `;
    }

    // Wait for bundle to load and return instance ID
    return loadBundle()
      .then(() => {
        if (!window.StudyMaterialsWidget) {
          throw new Error('Widget bundle failed to initialize');
        }

        // initWidget now returns instance ID
        const instanceId = window.StudyMaterialsWidget.initWidget(container, {
          eventId: eventId || undefined,
          language: language,
          apiBaseUrl: apiUrl,
          limit: limit,
          cssBaseUrl: baseUrl,
        });
        
        return instanceId;
      })
      .catch(error => {
        console.error('Failed to initialize widget:', error);
        container.innerHTML = `
          <div style="padding: 20px; text-align: center; color: #dc2626;">
            Failed to load study materials widget
          </div>
        `;
        return null;
      });
  }

  // Auto-inject mode
  function handleAutoInject() {
    const autoInject = currentScript.getAttribute('data-auto-inject');
    if (autoInject !== 'true') return;

    const eventId = currentScript.getAttribute('data-event-id');  // Optional now
    const language = currentScript.getAttribute('data-language') || 'he';
    const apiUrl = currentScript.getAttribute('data-api-url');  // REQUIRED - no fallback
    const limit = parseInt(currentScript.getAttribute('data-limit') || '10');
    const position = currentScript.getAttribute('data-position') || 'fixed-right';
    const width = currentScript.getAttribute('data-width') || '320px';

    // Validate required attributes
    if (!apiUrl) {
      console.error('Widget Error: data-api-url attribute is required for auto-inject');
      return;
    }

    // Create container
    const container = document.createElement('div');
    container.setAttribute('data-studymaterials-widget', '');
    if (eventId) {
      container.setAttribute('data-event-id', eventId);
    }
    container.setAttribute('data-language', language);
    container.setAttribute('data-api-url', apiUrl);
    container.setAttribute('data-limit', limit.toString());
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
    containers.forEach(container => {
      if (!container.dataset.initialized) {
        initWidgetInContainer(container).then(instanceId => {
          if (instanceId) {
            container.dataset.initialized = 'true';
            container.dataset.widgetInstanceId = instanceId;
          }
        });
      }
    });

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
  
  // Main load function - returns widget instance with destroy method
  window.StudyMaterialsWidget.load = function(eventId, language, options) {
    options = options || {};
    const container = document.createElement('div');
    container.setAttribute('data-studymaterials-widget', '');
    if (eventId) {
      container.setAttribute('data-event-id', eventId);
    }
    container.setAttribute('data-language', language || 'he');
    
    if (options.apiUrl) {
      container.setAttribute('data-api-url', options.apiUrl);
    }
    if (options.limit) {
      container.setAttribute('data-limit', options.limit.toString());
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
    
    // Store instance reference for returning
    let widgetInstance = {
      container: container,
      id: null,
      destroy: function() {
        if (this.id && window.StudyMaterialsWidget && window.StudyMaterialsWidget.destroyWidget) {
          window.StudyMaterialsWidget.destroyWidget(this.id);
        } else if (this.container && this.container.parentNode) {
          // Fallback cleanup
          this.container.innerHTML = '';
          this.container.parentNode.removeChild(this.container);
        }
      }
    };
    
    // Initialize widget and store instance ID
    initWidgetInContainer(container).then(instanceId => {
      if (instanceId) {
        widgetInstance.id = instanceId;
        container.dataset.widgetInstanceId = instanceId;
      }
    });
    
    return widgetInstance;
  };
  
  // Expose destroy function for standalone use
  window.StudyMaterialsWidget.destroy = function(widgetInstance) {
    if (widgetInstance && widgetInstance.destroy) {
      widgetInstance.destroy();
    } else if (typeof widgetInstance === 'string') {
      // Support direct instance ID
      window.StudyMaterialsWidget.destroyWidget(widgetInstance);
    }
  };
})();

