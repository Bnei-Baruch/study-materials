# Changelog

## Version 3.2 - Enhanced Fields (Dec 23, 2025)

### Added
- **Source page numbers** - Added `page_number` field to Source (optional)
  - Useful for Hebrew sources with page references
  - Example: "42", "15-17", "42-45"
  
- **Part links** - Added link fields to LessonPart (all optional):
  - `excerpts_link` - Link to selected excerpts
  - `transcript_link` - Link to transcript
  - `lesson_link` - Kabbalahmedia lesson URL
  - `additional_link` - Any additional resource

### Changed
- Updated `storage/models.go` - Added new fields to Source and LessonPart
- Updated `api/handle_parts_poc.go` - Pass through new fields
- Updated `frontend/app/page.tsx` - TypeScript interfaces

### Backward Compatible
- All new fields are optional
- Existing parts work without changes
- Fields only appear in JSON when provided

### Example
```json
{
  "title": "Morning Lesson Part 1",
  "excerpts_link": "https://kabbalahmedia.info/excerpts/abc123",
  "transcript_link": "https://kabbalahmedia.info/transcripts/xyz789",
  "lesson_link": "https://kabbalahmedia.info/he/lessons/cu/o3Yx5Gim",
  "additional_link": "https://example.com/notes",
  "sources": [
    {
      "source_id": "qMUUn22b",
      "source_title": "Shamati",
      "source_url": "https://kabbalahmedia.info/en/sources/qMUUn22b",
      "page_number": "42-45"
    }
  ]
}
```

---

## Version 3.1 - Link Parts to Events (Dec 23, 2025) 🔗

### Added
- **Event linking** - Parts can now belong to events
  - Added `event_id` field to LessonPart (optional)
  - Added `order` field to LessonPart (position within event)
  - Event validation: API verifies event exists before linking
  - New endpoint: `GET /api/events/{event_id}/parts` - Get all parts for an event (sorted by order)

### Changed
- Updated `storage/models.go` - Added EventID and Order fields
- Updated `api/handle_parts_poc.go` - Event validation and HandleGetEventParts
- Updated `api/api.go` - Registered new event parts route

### Backward Compatible
- Parts can exist **without** event_id (standalone parts) ✓
- All existing parts continue to work ✓
- Frontend doesn't need changes yet ✓

### New API Endpoint
- `GET /api/events/{event_id}/parts` - Get all parts for an event, sorted by order

### Example Part with Event
```json
{
  "id": "uuid",
  "title": "שיעור בוקר חלק 1",
  "description": "לימוד שמעתי...",
  "date": "2025-12-23T00:00:00Z",
  "part_type": "live_lesson",
  "language": "he",
  "event_id": "8bd7cdf1-681a-4f8d-b47b-7445ed11b727",
  "order": 1,
  "sources": [...],
  "created_at": "2025-12-23T03:57:08..."
}
```

### Example Standalone Part
```json
{
  "id": "uuid",
  "title": "Standalone Lesson",
  "date": "2025-12-24T00:00:00Z",
  ...
  // No event_id - works perfectly!
}
```

### Validation
- event_id is **optional**
- If provided, event must exist (404 if not found)
- order is optional (for sorting within event)

### Architecture
```
Event (1) ----< Parts (many)
  ↓
  Parts are sorted by order field
```

---

## Version 3.0 - Event Model (Dec 23, 2025) 🎉

### Added
- **Event model** to group lesson parts into events
  - Added `Event` struct with date, type, number fields
  - Event types: `daily_lesson`, `meal`, `convention`, `lecture`, `other`
  - Number field supports multiple events per day
  - JSON storage in `data/events/` directory
  - Complete CRUD API: create, get, list events

### New API Endpoints
- `POST /api/events` - Create event
- `GET /api/events` - List all events
- `GET /api/events/{id}` - Get event by ID

### Event Types
- `daily_lesson` - Daily morning/evening lessons (default)
- `meal` - Special meals (e.g., Tu B'Shvat meal)
- `convention` - Multi-day conventions
- `lecture` - Single lectures/talks
- `other` - Other event types

### Migration Path
This is a **major architectural milestone**:
- **Phase 3.0** (now): Event model created ✓
- **Phase 3.1**: Link parts to events (add event_id to parts)
- **Phase 3.2**: Frontend creates event first, then parts
- **Phase 4.0**: Add translations map to parts

**Backward Compatible** - Existing parts continue to work independently!

### Example Event JSON
```json
{
  "id": "8bd7cdf1-681a-4f8d-b47b-7445ed11b727",
  "date": "2025-12-23T00:00:00Z",
  "type": "daily_lesson",
  "number": 1,
  "created_at": "2025-12-23T03:47:54..."
}
```

### Validation
- Date is **required** (YYYY-MM-DD format)
- Type **defaults** to `"daily_lesson"` if omitted
- Type must be one of: daily_lesson, meal, convention, lecture, other
- Number **defaults** to `1` if omitted

---

## Version 2.0 - Language Field (Dec 23, 2025)

### Added
- **Language field** to identify content language
  - Added `language` field to `LessonPart` model (string, ISO 639-1)
  - Defaults to `"he"` (Hebrew - source language)
  - Validation: must be 2-letter ISO code (e.g., he, en, ru, es)
  - Frontend always sends `"he"` for now
  - Supports Hebrew, English, Russian, Spanish, and other languages

### Changed
- Updated `storage/models.go` - Added `Language string` field
- Updated `api/handle_parts_poc.go` - Validate and default language
- Updated `frontend/app/page.tsx` - Send language as "he"

### Migration Path
This is a critical step toward multi-language support:
- **Phase 2.0** (now): Language field identifies content language ✓
- **Phase 3.0**: Add translations map for other languages
- **Phase 4.0**: Multi-language UI with language selector

**No throwaway work** - language field becomes the key for translations!

### Supported Languages
Based on kabbalahmedia.info:
- `he` - עברית (Hebrew) - default
- `en` - English
- `ru` - Русский (Russian)
- `es` - Español (Spanish)
- `de` - Deutsch (German)
- `it` - Italiano (Italian)
- `fr` - Français (French)
- `tr` - Türkçe (Turkish)
- `ua` - Українська (Ukrainian)

### Example
```json
{
  "id": "uuid",
  "title": "שיעור בוקר",
  "description": "לימוד שמעתי...",
  "date": "2025-12-23T00:00:00Z",
  "part_type": "live_lesson",
  "language": "he",
  "sources": [...],
  "created_at": "2025-12-23T03:43:02..."
}
```

### Validation
- Language **defaults** to `"he"` if omitted
- Must be 2-letter ISO 639-1 code (400 if invalid)
- Common codes: he, en, ru, es, de, it, fr, tr, ua

---

## Version 1.4 - Part Type Field (Dec 23, 2025)

### Added
- **Part type field** to distinguish lesson part types
  - Added `part_type` field to `LessonPart` model (string)
  - Two types: `"live_lesson"` (manual) and `"recorded_lesson"` (auto-filled)
  - Defaults to `"live_lesson"` if not provided
  - Validation: must be one of the two valid types
  - Frontend always sends `"live_lesson"` for manual creation

### Changed
- Updated `storage/models.go` - Added `PartType string` field
- Updated `api/handle_parts_poc.go` - Validate and default part_type
- Updated `frontend/app/page.tsx` - Send part_type as "live_lesson"

### Migration Path
This prepares for different part creation flows:
- **Phase 1.4** (now): Part type field added ✓
- **Phase 2**: Implement recorded lesson flow (URL input → auto-fill)
- **Phase 3**: Event-based architecture with typed parts

**No throwaway work** - part_type persists through all phases!

### Part Types
- **`live_lesson`**: Manual creation (current POC flow)
  - User fills title, description, sources manually
  - Selected via autocomplete search
  
- **`recorded_lesson`**: Auto-filled from URL (future)
  - User provides kabbalahmedia URL
  - System auto-fills from archive-backend API
  - User can edit after auto-fill

### Example
```json
{
  "id": "uuid",
  "title": "Morning Lesson",
  "description": "Study of Shamati...",
  "date": "2025-12-23T00:00:00Z",
  "part_type": "live_lesson",
  "sources": [...],
  "created_at": "2025-12-23T03:39:37..."
}
```

### Validation
- Part type **defaults** to `"live_lesson"` if omitted
- Must be `"live_lesson"` or `"recorded_lesson"` (400 if invalid)

---

## Version 1.3 - Date Field (Dec 23, 2025)

### Added
- **Date field** for lesson parts (required)
  - Added `date` field to `LessonPart` model (time.Time)
  - Added date picker input in frontend (defaults to today)
  - Date validation: required, must be in YYYY-MM-DD format
  - Display formatted date in success view (e.g., "Monday, December 23, 2025")

### Changed
- Updated `storage/models.go` - Added `Date time.Time` field
- Updated `api/handle_parts_poc.go` - Parse and validate date (required)
- Updated `frontend/app/page.tsx` - Added date picker with today as default

### Migration Path
This change is foundational for the event-based system:
- **Phase 1.3** (now): Date field on parts ✓
- **Phase 2**: Group parts into events (date + event number)
- **Phase 3**: Multi-language support with translations

**No throwaway work** - date field persists through all phases!

### Example
```json
{
  "id": "uuid",
  "title": "Morning Lesson",
  "description": "Study of Shamati...",
  "date": "2025-12-23T00:00:00Z",
  "sources": [...],
  "created_at": "2025-12-23T03:33:24..."
}
```

### Validation
- Date is **required** (400 if missing)
- Format must be `YYYY-MM-DD` (400 if invalid)
- Past and future dates are accepted

---

## Version 1.2 - Description Field (Dec 23, 2025)

### Added
- **Description field** for lesson parts
  - Added `description` field to `LessonPart` model
  - Added textarea input in frontend (4 rows, optional)
  - Description is stored in JSON and returned by API
  - Display description in success view

### Changed
- Updated `storage/models.go` - Added `Description string` field
- Updated `api/handle_parts_poc.go` - Pass through description field
- Updated `frontend/app/page.tsx` - Added description textarea and display

### Migration Path
This change prepares for Phase 2 multi-language system:
- Current title + description will become the **source language** (Hebrew) content
- In Phase 2, we'll add a `language` field and `translations` map
- No refactoring needed - clean evolution from current structure

### Example
```json
{
  "id": "uuid",
  "title": "Morning Lesson - Dec 21, 2025",
  "description": "Study of Shamati articles focusing on faith above reason...",
  "sources": [...],
  "created_at": "2025-12-23T03:26:19..."
}
```

---

## Version 1.1 - Real API Integration (Dec 22, 2025)

### Added
- Real kabbalahmedia source search (replaces mock data)
- Source hierarchy caching on startup
- Recursive search through authors, collections, articles

### Changed
- `integrations/kabbalahmedia/sqdata.go` - Real API integration
- `cmd/server.go` - Increased timeout, pre-fetch sources
- `config.toml` - Updated timeout configuration

---

## Version 1.0 - Initial POC (Dec 22, 2025)

### Added
- JSON file storage for lesson parts
- REST API endpoints (create, get, list parts)
- Next.js frontend with Tailwind CSS
- Source autocomplete component
- Beautiful gradient UI
- Kabbalahmedia integration


