# Galaxy3 Widget Integration Update

## Changes Required for galaxy3 Project

To use the new widget `destroy()` method in galaxy3, update the following file:

**File:** `galaxy3/src/apps/VirtualApp/components/StudyMaterialsWidget.js`

---

## Current Code (Lines 1-78)

Replace the entire file with this updated version:

```javascript
import React from "react";

const StudyMaterialsWidget = ({language = 'he', apiUrl = 'http://10.66.1.76:8080'}) => {
  const containerRef = React.useRef(null);
  const widgetInstanceRef = React.useRef(null); // NEW: Track widget instance

  React.useEffect(() => {
    // Load the widget script if not already loaded
    const loadScript = () => {
      return new Promise((resolve) => {
        const existingScript = document.querySelector('script[src*="widget.js"]');
        if (existingScript) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'http://10.66.1.76:3000/widget/widget.js';
        script.onload = () => resolve();
        script.onerror = () => resolve();
        document.head.appendChild(script);
      });
    };

    // Initialize widget using the exposed load() method
    const initWidget = async () => {
      await loadScript();
      
      // Small delay to ensure script is fully executed
      setTimeout(() => {
        if (containerRef.current && window.StudyMaterialsWidget && window.StudyMaterialsWidget.load) {
          // Clear existing content
          containerRef.current.innerHTML = '';
          
          // NEW: load() now returns widget instance with destroy() method
          const widgetInstance = window.StudyMaterialsWidget.load(
            null, // eventId (null = events list)
            language,
            { 
              apiUrl: apiUrl,
              limit: 10,
              target: containerRef.current // Mount in our container
            }
          );
          
          // NEW: Store instance for cleanup
          widgetInstanceRef.current = widgetInstance;
        }
      }, 100);
    };

    initWidget();

    // NEW: Proper cleanup using destroy()
    return () => {
      if (widgetInstanceRef.current && widgetInstanceRef.current.destroy) {
        widgetInstanceRef.current.destroy();
        widgetInstanceRef.current = null;
      }
    };
  }, [language, apiUrl]);

  return (
    <div
      ref={containerRef}
      style={{
        height: 'calc(100vh - 140px)',
        width: '100%',
        overflow: 'hidden',
        backgroundColor: '#fff'
      }}
    />
  );
};

export default StudyMaterialsWidget;
```

---

## Key Changes

### 1. Added `widgetInstanceRef`
```javascript
const widgetInstanceRef = React.useRef(null); // Track widget instance
```

### 2. Store widget instance
```javascript
const widgetInstance = window.StudyMaterialsWidget.load(...);
widgetInstanceRef.current = widgetInstance; // Store it
```

### 3. Proper cleanup
```javascript
return () => {
  if (widgetInstanceRef.current && widgetInstanceRef.current.destroy) {
    widgetInstanceRef.current.destroy(); // ✨ Use destroy() method
    widgetInstanceRef.current = null;
  }
};
```

### OLD vs NEW Cleanup

**OLD (memory leak):**
```javascript
return () => {
  if (containerRef.current) {
    containerRef.current.innerHTML = ''; // ❌ Doesn't unmount React!
  }
};
```

**NEW (proper cleanup):**
```javascript
return () => {
  if (widgetInstanceRef.current) {
    widgetInstanceRef.current.destroy(); // ✅ Properly unmounts React
    widgetInstanceRef.current = null;
  }
};
```

---

## Testing After Update

1. **Start galaxy3:**
   ```bash
   cd galaxy3
   npm start
   ```

2. **Test widget lifecycle:**
   - Click "Study Materials" button
   - Widget should load ✅
   - Close sidebar
   - Widget should destroy ✅
   - Open sidebar again
   - Widget should load fresh ✅
   - Check browser console - no React warnings ✅

3. **Check for memory leaks:**
   - Open DevTools → Memory tab
   - Take heap snapshot
   - Open/close widget 10 times
   - Take another snapshot
   - Compare - should not grow significantly

---

## Benefits

- ✅ No memory leaks
- ✅ Proper React unmounting
- ✅ No console warnings
- ✅ Widget can be reopened cleanly
- ✅ Better performance

---

## Need Help?

If you encounter issues:
1. Check browser console for errors
2. Verify widget script loads: `http://10.66.1.76:3000/widget/widget.js`
3. Ensure study-material-service backend is running
4. Rebuild widget if needed: `cd study-material-service/frontend && npm run build:widget`






