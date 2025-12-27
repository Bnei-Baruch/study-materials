# Study Materials Widget

A universal JavaScript widget for embedding study materials on any website.

## Quick Start

### 1. Include the widget script

```html
<script src="https://your-domain.com/widget/widget.js"></script>
```

### 2. Add a widget container

```html
<div 
  data-studymaterials-widget
  data-event-id="YOUR_EVENT_ID"
  data-language="he"
></div>
```

That's it! The widget will automatically load and display the study materials.

## Integration Methods

### Method 1: Manual Container

Place the widget in a specific location on your page:

```html
<script src="https://your-domain.com/widget/widget.js"></script>

<div 
  data-studymaterials-widget
  data-event-id="df2b081d-884f-40ac"
  data-language="he"
  data-position="inline"
  data-width="320px"
></div>
```

### Method 2: Auto-Inject (Fixed Sidebar)

Automatically inject the widget as a fixed sidebar:

```html
<script 
  src="https://your-domain.com/widget/widget.js"
  data-auto-inject="true"
  data-event-id="df2b081d-884f-40ac"
  data-language="he"
  data-position="fixed-right"
></script>
```

### Method 3: JavaScript API

Programmatically load the widget:

```javascript
StudyMaterialsWidget.load('eventId', 'he', {
  position: 'inline',
  apiUrl: 'https://api.your-domain.com',
  width: '320px',
  target: document.getElementById('container')
});
```

### Method 4: Browser Bookmarklet

Create a bookmarklet for users to inject the widget on any page:

```javascript
javascript:(function(){
  const s=document.createElement('script');
  s.src='https://your-domain.com/widget/widget.js';
  s.setAttribute('data-auto-inject','true');
  s.setAttribute('data-event-id','YOUR_EVENT_ID');
  document.head.appendChild(s);
})();
```

## Configuration Options

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-event-id` | string | **required** | Event ID to display |
| `data-language` | string | `he` | UI language (he/en/ru/es/de/it/fr/uk) |
| `data-api-url` | string | production API | Custom API endpoint |
| `data-position` | string | `inline` | `inline`, `fixed-right`, `fixed-left` |
| `data-width` | string | `320px` | Widget width |
| `data-auto-inject` | boolean | `false` | Auto-create container |

## Supported Languages

- Hebrew (he) - עברית
- English (en)
- Russian (ru) - Русский
- Spanish (es) - Español
- German (de) - Deutsch
- Italian (it) - Italiano
- French (fr) - Français
- Ukrainian (uk) - Українська

## Features

- **Compact Design**: Optimized for sidebar and small spaces (320px width)
- **Color-Coded Sections**: Visual distinction between lesson parts
- **Collapsible Sections**: Expand/collapse individual parts
- **Share Functionality**: Share individual parts or entire lesson
- **Copy Links**: One-click link copying
- **RTL Support**: Automatic right-to-left layout for Hebrew
- **Multi-Language**: Full translations for all UI text
- **Responsive**: Works on desktop and mobile devices

## Building the Widget

### Development Build

```bash
npm run build:widget
```

This creates:
- `public/widget/widget.js` - Loader script (~3KB)
- `public/widget/widget.bundle.js` - Main bundle (~1.1MB unminified)
- `public/widget/widget.css` - Styles (~2KB)

### Production Build

```bash
NODE_ENV=production npm run build:widget
```

Production builds are minified and optimized:
- Bundle size: ~80-100KB gzipped
- No source maps
- Tree-shaken dependencies

## Testing

Open `public/widget-demo.html` in your browser to test all integration methods:

```bash
cd frontend/public
python3 -m http.server 8000
```

Then visit `http://localhost:8000/widget-demo.html`

## Deployment

1. Build the widget:
   ```bash
   npm run build:widget
   ```

2. Deploy the `public/widget/` directory to your CDN or web server

3. Ensure CORS is enabled on your API endpoints:
   ```go
   w.Header().Set("Access-Control-Allow-Origin", "*")
   w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
   ```

4. Share the integration code with your users

## Browser Support

- Chrome 49+
- Firefox 52+
- Safari 10+
- Edge 15+
- iOS Safari 10+
- Chrome for Android 49+

## Security

- Widget code is loaded from your trusted domain
- All API calls use HTTPS in production
- No external dependencies loaded from third parties
- Content Security Policy compliant

## Troubleshooting

### Widget doesn't appear

1. Check browser console for errors
2. Verify the event ID is correct
3. Ensure the API endpoint is accessible
4. Check CORS headers are set

### Styles conflict with parent page

The widget uses scoped CSS with prefixed classes. If you still see conflicts:

1. Use Shadow DOM for complete isolation (advanced)
2. Increase CSS specificity in `widget.css`

### Widget too large

In production mode, the widget bundle is automatically:
- Minified
- Tree-shaken
- Gzip compressed by your server

Expected size: ~80-100KB gzipped

## License

Proprietary - Bnei Baruch

