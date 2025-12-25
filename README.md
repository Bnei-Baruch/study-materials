# Study Material Service

Modern lesson authoring and management system with multi-language support, kabbalahmedia integration, and intuitive event-based workflow.

## 🎯 Current Status: Production Ready

A comprehensive lesson authoring system that replaces the old Google Docs-based workflow. The legacy service has been moved to `legacy-google-service/`.

## ✨ Features

### Event Management
- ✅ Create events (Morning Lesson, Noon Lesson, Evening Lesson, Meal, Convention, Lecture, Other)
- ✅ Multi-language event titles (8 languages)
- ✅ Drag-and-drop event reordering
- ✅ Duplicate events with all parts
- ✅ Delete events with cascade deletion
- ✅ Public/Private toggle for events
- ✅ Event numbering system

### Lesson Parts
- ✅ Create lesson parts with title, description, and sources
- ✅ Part types: Preparation (0), regular parts (1-10), recorded lessons
- ✅ Auto-filled preparation titles (Reading Before Sleep, Lesson Preparation)
- ✅ Recorded lesson date field
- ✅ Template system (7 pre-made templates)
- ✅ Multiple custom links per part

### Multi-Language Support
- ✅ 8 languages: Hebrew, English, Russian, Spanish, German, Italian, French, Ukrainian
- ✅ Auto-generation of translation stubs
- ✅ Inline editing for all languages
- ✅ Language-specific source titles
- ✅ Title capitalization per language rules

### Source Management
- ✅ Real-time search from kabbalahmedia API (multi-language)
- ✅ Hierarchical source display with page numbers
- ✅ Editable source links per language
- ✅ Full source management (add/edit/remove) for Hebrew parts
- ✅ Language-agnostic source URLs

### Links & Resources
- ✅ Excerpts, transcript, lesson, and program links
- ✅ Preparation-specific links (Reading Before Sleep, Lesson Preparation)
- ✅ Custom links with titles (language-specific)
- ✅ Clickable source names in event view

## 🚀 Quick Start

```bash
# Start both servers
./START-POC.sh

# Or manually:
# Terminal 1: Backend
./study-material-service-poc server

# Terminal 2: Frontend
cd frontend && npm run dev
```

Then open: **http://localhost:3000**

## 📖 Documentation

- **[POC-README.md](POC-README.md)** - Complete POC guide
- **[POC-SUMMARY.md](POC-SUMMARY.md)** - Overview and summary
- **[POC-CHANGELOG.md](POC-CHANGELOG.md)** - Version history

## 🏗️ Architecture

```
Backend (Go)
├── cmd/                  # Main server entry point
├── storage/              # JSON file storage layer
│   ├── models.go        # Data models (Event, LessonPart, Source)
│   ├── json_store.go    # Part storage
│   └── event_store.go   # Event storage
├── integrations/         # External API clients
│   └── kabbalahmedia/   # Source search and caching
├── api/                  # REST API handlers
│   ├── api.go           # Router and CORS
│   ├── handle_parts_*.go      # Part CRUD operations
│   ├── handle_events_*.go     # Event CRUD operations
│   ├── handle_sources.go      # Source search
│   └── handle_templates.go    # Template config
├── templates.json        # Template configuration
└── config.toml          # Server configuration

Frontend (Next.js 16)
├── app/
│   ├── page.tsx              # Home/redirect
│   ├── layout.tsx            # Root layout
│   ├── events/
│   │   ├── page.tsx         # Event list (with drag-and-drop)
│   │   ├── create/page.tsx  # Create event form
│   │   └── [id]/page.tsx    # Event detail with parts
└── components/
    ├── PartForm.tsx          # Lesson part creation form
    ├── SourceSearch.tsx      # Source search autocomplete
    └── EventTypeBadge.tsx    # Event type display
```

## 📁 Project Structure

```
study-material-service/
├── cmd/
│   └── server.go                   # Server entry point
├── storage/                         # Data models and storage
│   ├── models.go
│   ├── json_store.go
│   └── event_store.go
├── integrations/
│   └── kabbalahmedia/
│       └── sqdata.go               # Source API client
├── api/                            # REST API handlers
│   ├── api.go
│   ├── handle_parts_poc.go
│   ├── handle_parts_delete.go
│   ├── handle_events.go
│   ├── handle_events_update.go
│   ├── handle_events_delete.go
│   ├── handle_events_duplicate.go
│   ├── handle_events_toggle_public.go
│   ├── handle_sources.go
│   ├── handle_source_title.go
│   └── handle_templates.go
├── frontend/                        # Next.js application
│   ├── app/
│   ├── components/
│   ├── package.json
│   └── tailwind.config.ts
├── data/                           # JSON data storage
│   ├── parts/                      # Lesson part files
│   └── events/                     # Event files
├── templates.json                  # Template configuration
├── config.toml                     # Server config
├── legacy-google-service/          # Old implementation
├── START-POC.sh                    # Quick start script
└── study-material-service-poc      # Compiled binary
```

## 🧪 API Endpoints

### Health Check
```bash
GET /health
```

### Event Endpoints
```bash
# Create a new event
POST /api/events
{
  "date": "2025-12-25",
  "type": "morning_lesson",
  "number": 1,
  "order": 0,
  "public": true,
  "titles": {
    "he": "שיעור בוקר",
    "en": "Morning Lesson"
  }
}

# List all events (sorted by order, then date)
GET /api/events

# Get a specific event
GET /api/events/{id}

# Update an event (titles, order, public status)
PUT /api/events/{id}
{
  "order": 5,
  "public": false,
  "titles": {
    "he": "שיעור מיוחד"
  }
}

# Delete an event (cascade deletes all parts)
DELETE /api/events/{id}

# Duplicate an event to a new date
POST /api/events/{id}/duplicate
{
  "new_date": "2025-12-26"
}

# Toggle event public status
PUT /api/events/{id}/toggle-public

# Get all parts for an event (filtered by language)
GET /api/events/{event_id}/parts?language=he
```

### Lesson Part Endpoints
```bash
# Create a new lesson part
POST /api/parts
{
  "event_id": "event-uuid",
  "order": 1,
  "title": "Shamati Article 1",
  "description": "Study of the first article...",
  "language": "he",
  "part_type": "live_lesson",
  "date": "2025-12-25",
  "template_id": "shamati",
  "recorded_lesson_date": "2025-12-24",
  "sources": [
    {
      "source_id": "qMeVwYFQ",
      "source_title": "שמעתי | א. אין מלך בלא עם",
      "source_url": "https://kabbalahmedia.info/sources/qMeVwYFQ",
      "page_number": "1"
    }
  ],
  "excerpts_link": "https://...",
  "transcript_link": "https://...",
  "lesson_link": "https://...",
  "program_link": "https://...",
  "reading_before_sleep_link": "https://...",
  "lesson_preparation_link": "https://...",
  "custom_links": [
    {
      "title": "Additional Material",
      "url": "https://..."
    }
  ]
}

# List all parts
GET /api/parts

# Get a specific part
GET /api/parts/{id}

# Update a lesson part (all fields editable)
PUT /api/parts/{id}
{
  "title": "Updated Title",
  "description": "New description",
  "sources": [...],
  "excerpts_link": "https://...",
  "custom_links": [...]
}

# Delete a lesson part (cascade deletes all translations if Hebrew)
DELETE /api/parts/{id}
```

### Source Endpoints
```bash
# Search sources (multi-language: he, ru, en, es)
GET /api/sources/search?q=zohar

Response:
{
  "sources": [
    {
      "source_id": "qMeVwYFQ",
      "title": "The Zohar | Volume 1 | Page 23",
      "url": "https://kabbalahmedia.info/sources/qMeVwYFQ"
    }
  ]
}

# Get source title in specific language
GET /api/sources/title?source_id=qMeVwYFQ&language=ru

Response:
{
  "title": "Зоар | Том 1 | Страница 23"
}
```

### Template Endpoints
```bash
# Get all available templates and languages
GET /api/templates

Response:
{
  "languages": ["he", "en", "ru", "es", "de", "it", "fr", "uk"],
  "preparation": {
    "he": "הכנה",
    "en": "Preparation"
  },
  "templates": [
    {
      "id": "shamati",
      "translations": {
        "he": "שמעתי",
        "en": "Shamati"
      }
    }
  ]
}
```

## 🎨 Frontend Features

### Event List Page
- Drag-and-drop event reordering
- Event list with Hebrew titles
- Date formatting with weekday
- Quick navigation to event details
- Create new event button

### Event Detail Page
- View all lesson parts for an event
- Language selector (8 languages)
- Add new parts with template selection
- Inline editing for all language versions
- Edit event titles in all languages
- Duplicate/delete event controls
- Toggle public/private status

### Create Event Page
- Event type selection (Morning/Noon/Evening Lesson, Meal, Convention, etc.)
- Date and number inputs
- Optional custom titles for all languages
- Default title generation

### Part Form
- Template-based part creation (7 templates)
- Part number selector (0-10, with Preparation)
- Auto-filled preparation titles and links
- Multi-language source search with autocomplete
- Add/edit/remove sources with page numbers
- Editable source links
- Multiple link fields (excerpts, transcript, lesson, program)
- Custom links with titles (language-specific)
- Recorded lesson date (for recorded lesson type)
- Rich description editor

### Source Management
- Real-time search across 4 languages (Hebrew, Russian, English, Spanish)
- Hierarchical source display (e.g., "The Zohar | Volume 1 | Page 23")
- Clickable source names with links
- Full source editing for Hebrew parts
- Language-specific source titles
- Page number support

## 🔄 Roadmap

### Completed ✅
- Event-based workflow with multi-language support
- Full CRUD operations for events and parts
- Multi-language translation system with auto-generation
- Template management system
- Drag-and-drop reordering
- Source search and management
- Custom links with titles

### Future Enhancements
1. Archive page with search and filters
2. Beautiful public view for published events
3. Authentication and user management
4. Automatic metadata fetching from kabbalahmedia archive-backend
5. Export to PDF/Word formats
6. Version history and change tracking
7. Collaborative editing features

## 📊 Project Stats

- **Backend:** Go 1.21+, ~2000+ lines across modular packages
- **Frontend:** Next.js 16 + React 19, TypeScript, ~1500+ lines
- **Storage:** JSON files (no database required)
- **API Response:** < 10ms (cached sources)
- **Source Cache:** Multi-language (he, ru, en, es), ~2MB, fetched on startup
- **Supported Languages:** 8 (Hebrew, English, Russian, Spanish, German, Italian, French, Ukrainian)
- **Templates:** 7 pre-configured (Shamati, TES, Zohar, Society, Conversations, Studying with Friends, Recorded Lesson)

## 🗂️ Legacy Service

The original Google Docs-based service has been moved to:
- **[legacy-google-service/](legacy-google-service/)** - Old implementation with Google Apps Script webhooks

## 🛠️ Technologies

### Backend
- **Language:** Go 1.21+
- **Router:** Gorilla Mux
- **CORS:** Enabled for cross-origin requests
- **Storage:** JSON file-based (simple, fast, no DB overhead)
- **External APIs:** 
  - kabbalahmedia.info/backend/sqdata (source search)
  - Multi-language caching with in-memory storage

### Frontend
- **Framework:** Next.js 16 with Turbopack
- **UI Library:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS 3.4
- **Drag & Drop:** @dnd-kit (core, sortable, utilities)
- **Build:** Modern ES modules with tree-shaking

### Development
- **Version Control:** Git
- **Repository:** github.com/Bnei-Baruch/study-materials
- **Hot Reload:** Enabled for both frontend and backend during development

## 📝 License

[Your License Here]

---

**Version:** 4.0 (Event-based workflow with multi-language support and drag-and-drop)  
**Last Updated:** December 25, 2025  
**Status:** ✅ Production Ready

