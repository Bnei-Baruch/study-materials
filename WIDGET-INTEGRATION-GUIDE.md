# Study Materials Widget Integration Guide

## Overview

The Study Materials Widget is a universal JavaScript component that can be embedded on any website to display lesson materials in a compact sidebar format. Perfect for video conference platforms (Zoom, Teams), learning management systems, or any website.

## Quick Start (5 minutes)

### Step 1: Copy the integration code

```html
<!-- Add to your HTML -->
<script src="http://localhost:3000/widget/widget.js"></script>

<div 
  data-studymaterials-widget
  data-event-id="YOUR_EVENT_ID"
  data-language="he"
></div>
```

### Step 2: Get your event ID

1. Go to the admin panel: `http://localhost:3000/events`
2. Click on an event
3. Copy the Event ID from the URL or page

### Step 3: Test it!

Open your webpage and the widget will automatically load with your study materials.

## Live Demo

Open the demo page to see all integration methods in action:

```
http://localhost:3000/widget-demo.html
```

The demo shows:
- Manual container placement
- Auto-inject fixed sidebar
- JavaScript API integration
- Split-screen layout (video conference style)

## Integration Methods

### Method 1: Simple Embed (Recommended)

Best for: Adding widget to a specific location on your page

```html
<script src="http://localhost:3000/widget/widget.js"></script>

<div 
  data-studymaterials-widget
  data-event-id="df2b081d-884f-40ac"
  data-language="he"
  data-position="inline"
></div>
```

### Method 2: Fixed Sidebar

Best for: Floating widget that doesn't affect page layout

```html
<script 
  src="http://localhost:3000/widget/widget.js"
  data-auto-inject="true"
  data-event-id="df2b081d-884f-40ac"
  data-language="he"
  data-position="fixed-right"
></script>
```

### Method 3: JavaScript API

Best for: Dynamic loading or single-page applications

```javascript
<script src="http://localhost:3000/widget/widget.js"></script>

<script>
// Load widget programmatically
StudyMaterialsWidget.load('df2b081d-884f-40ac', 'he', {
  position: 'inline',
  apiUrl: 'http://localhost:8080',
  width: '320px',
  target: document.getElementById('my-container')
});
</script>
```

### Method 4: Bookmarklet

Best for: Users who want to inject widget on any page

Create a browser bookmark with this URL:

```javascript
javascript:(function(){const s=document.createElement('script');s.src='http://localhost:3000/widget/widget.js';s.setAttribute('data-auto-inject','true');s.setAttribute('data-event-id','YOUR_EVENT_ID');s.setAttribute('data-api-url','http://localhost:8080');document.head.appendChild(s);})();
```

Users click the bookmark to inject the widget on any page!

## Configuration Options

| Option | Values | Default | Description |
|--------|--------|---------|-------------|
| `data-event-id` | string | **required** | The UUID of the event to display |
| `data-language` | he, en, ru, es, de, it, fr, uk | `he` | UI language |
| `data-api-url` | URL | `http://localhost:8080` | Backend API endpoint |
| `data-position` | inline, fixed-right, fixed-left | `inline` | Widget positioning |
| `data-width` | CSS width | `320px` | Widget width |

## Real-World Use Cases

### 1. Zoom Web App Integration

Inject the widget as a fixed sidebar in Zoom's web interface:

```html
<script 
  src="https://your-domain.com/widget/widget.js"
  data-auto-inject="true"
  data-event-id="today-lesson-id"
  data-language="he"
  data-position="fixed-left"
></script>
```

### 2. Custom Learning Platform

Embed in your platform with split-screen layout:

```html
<div style="display: grid; grid-template-columns: 1fr 320px; gap: 20px;">
  <!-- Your video/content -->
  <div>
    <video src="lesson-video.mp4"></video>
  </div>
  
  <!-- Study materials widget -->
  <div 
    data-studymaterials-widget
    data-event-id="lesson-123"
    data-language="en"
  ></div>
</div>
```

### 3. WordPress Plugin

Create a WordPress shortcode:

```php
add_shortcode('study_materials', function($atts) {
  $event_id = $atts['event'] ?? '';
  $lang = $atts['lang'] ?? 'he';
  
  return '
    <div 
      data-studymaterials-widget
      data-event-id="' . esc_attr($event_id) . '"
      data-language="' . esc_attr($lang) . '"
    ></div>
  ';
});
```

Usage: `[study_materials event="event-id" lang="he"]`

### 4. Browser Extension

Create a Chrome extension that injects the widget on specific sites:

```javascript
// content-script.js
const script = document.createElement('script');
script.src = 'https://your-domain.com/widget/widget.js';
script.setAttribute('data-auto-inject', 'true');
script.setAttribute('data-event-id', getCurrentEventId());
script.setAttribute('data-position', 'fixed-right');
document.head.appendChild(script);
```

## Multi-Language Support

The widget automatically translates all UI text based on the `data-language` attribute:

- **Hebrew (he)** - עברית - RTL layout
- **English (en)** - English
- **Russian (ru)** - Русский
- **Spanish (es)** - Español
- **German (de)** - Deutsch
- **Italian (it)** - Italiano
- **French (fr)** - Français
- **Ukrainian (uk)** - Українська

Example with language switcher:

```html
<select onchange="changeLanguage(this.value)">
  <option value="he">עברית</option>
  <option value="en">English</option>
  <option value="ru">Русский</option>
</select>

<div id="widget-container"></div>

<script>
function changeLanguage(lang) {
  const container = document.getElementById('widget-container');
  container.innerHTML = '';
  container.setAttribute('data-studymaterials-widget', '');
  container.setAttribute('data-event-id', 'YOUR_EVENT_ID');
  container.setAttribute('data-language', lang);
}
</script>
```

## Features

### Visual Features
- ✅ Compact 320px width design
- ✅ Color-coded sections (orange, blue, green, purple)
- ✅ Collapsible/expandable lesson parts
- ✅ Sticky header with event title and date
- ✅ Icons for different content types (book, video, document, audio)
- ✅ RTL support for Hebrew

### Functional Features
- ✅ Share individual lesson parts
- ✅ Share entire lesson
- ✅ Copy links on hover
- ✅ Real-time API data fetching
- ✅ Loading and error states
- ✅ Responsive design
- ✅ Works on mobile devices

### Technical Features
- ✅ Zero dependencies on parent page
- ✅ Scoped CSS (no style conflicts)
- ✅ CORS-enabled API calls
- ✅ Small bundle size (80-100KB gzipped in production)
- ✅ Works in all modern browsers
- ✅ CSP compliant

## Development

### Build Widget

```bash
cd frontend
npm run build:widget
```

Output files in `public/widget/`:
- `widget.js` - Loader script
- `widget.bundle.js` - Main bundle
- `widget.css` - Styles

### Test Locally

1. Start the backend:
```bash
./study-material-service-poc server
```

2. Start the frontend:
```bash
cd frontend
npm run dev
```

3. Open demo page:
```
http://localhost:3000/widget-demo.html
```

### Production Build

```bash
NODE_ENV=production npm run build:widget
```

Production optimizations:
- Minified JavaScript
- Tree-shaken dependencies
- No source maps
- ~80KB gzipped bundle

## Deployment

### Step 1: Build for production

```bash
cd frontend
NODE_ENV=production npm run build:widget
```

### Step 2: Deploy widget files

Upload `public/widget/` directory to your CDN or web server:
- `widget.js`
- `widget.bundle.js`
- `widget.css`

### Step 3: Update integration URLs

Change from `http://localhost:3000/widget/widget.js` to your production URL:
```html
<script src="https://cdn.your-domain.com/widget/widget.js"></script>
```

### Step 4: Configure API URL

For production, set the API URL:
```html
<div 
  data-studymaterials-widget
  data-event-id="..."
  data-api-url="https://api.your-domain.com"
></div>
```

## Troubleshooting

### Widget doesn't appear

**Check 1**: Open browser console (F12) and look for errors

**Check 2**: Verify event ID is correct
```javascript
// Test in console
fetch('http://localhost:8080/api/events/YOUR_EVENT_ID')
  .then(r => r.json())
  .then(console.log)
```

**Check 3**: Ensure backend is running
```bash
curl http://localhost:8080/health
# Should return: OK
```

**Check 4**: Check CORS headers
```bash
curl -I http://localhost:8080/api/events/YOUR_EVENT_ID
# Should include: Access-Control-Allow-Origin: *
```

### Widget conflicts with page styles

The widget uses scoped CSS with `[data-studymaterials-widget]` prefix. If you still see conflicts:

1. Increase specificity in `widget.css`
2. Use `!important` for critical styles
3. Consider Shadow DOM for complete isolation (advanced)

### Widget is too large

**Development build**: ~1.1MB (includes source maps, not minified)
**Production build**: ~80-100KB gzipped

Always use production build for deployment:
```bash
NODE_ENV=production npm run build:widget
```

### Share button doesn't work

The share functionality uses the Web Share API (mobile) with clipboard fallback (desktop).

On desktop, clicking share copies the content to clipboard.
On mobile, it opens the native share sheet.

Both methods work in all modern browsers.

## Security

### CORS Configuration

The backend is configured to allow cross-origin requests:

```go
// api/api.go
a.cors = cors.New(cors.Options{
  AllowedOrigins: []string{"*"},
  AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
  AllowedHeaders: []string{"Accept", "Content-Type", "Authorization"},
})
```

For production, restrict to specific domains:
```go
AllowedOrigins: []string{
  "https://your-domain.com",
  "https://trusted-partner.com",
}
```

### Content Security Policy

The widget is CSP compliant. Add to your CSP:
```
script-src 'self' https://your-domain.com;
connect-src 'self' https://api.your-domain.com;
style-src 'self' 'unsafe-inline' https://your-domain.com;
```

### XSS Protection

All user content is sanitized. The widget uses React which escapes output by default.

## Support

For issues or questions:
1. Check the demo page: `http://localhost:3000/widget-demo.html`
2. Review browser console for errors
3. Check backend logs: `./study-material-service-poc server`
4. Refer to `frontend/widget/README.md` for technical details

## Next Steps

1. ✅ Widget is built and ready to use
2. ⏭️ Test with a real event from your admin panel
3. ⏭️ Try different integration methods
4. ⏭️ Build for production when ready to deploy
5. ⏭️ Share integration code with your users

Happy embedding! 🎉
