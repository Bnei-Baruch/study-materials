# Add Language Field to Lesson Parts

## Overview
Add a `language` field to specify the language of the lesson part content. This is a critical step toward the multi-language system where parts can have translations.

## Current State
```go
type LessonPart struct {
    ID          string
    Title       string
    Description string
    Date        time.Time
    PartType    string
    Sources     []Source
    CreatedAt   time.Time
}
```

## Target State
```go
type LessonPart struct {
    ID          string
    Title       string
    Description string
    Date        time.Time
    PartType    string
    Language    string    // NEW: "he", "en", "ru", "es", etc.
    Sources     []Source
    CreatedAt   time.Time
}
```

## Migration Path to Full System

### Current (Phase 2.0)
```
LessonPart {
  title, description (in source language)
  language: "he"  ← NEW: identifies the language
}
```

### Phase 3: Add translations
```
LessonPart {
  title, description (source language)
  language: "he"
  translations: {
    "en": { title: "...", description: "..." },
    "ru": { title: "...", description: "..." }
  }
}
```

**No throwaway work** - language field stays and becomes critical for translations!

## Supported Languages

Based on kabbalahmedia.info, common languages:
- `he` - Hebrew (default, source language)
- `en` - English
- `ru` - Russian
- `es` - Spanish
- `de` - German
- `it` - Italian
- `fr` - French
- `tr` - Turkish
- `ua` - Ukrainian

## Implementation Tasks

### 1. Backend - Update Models
**File:** `storage/models.go`

Add `Language` field:
```go
type LessonPart struct {
    ID          string    `json:"id"`
    Title       string    `json:"title"`
    Description string    `json:"description"`
    Date        time.Time `json:"date"`
    PartType    string    `json:"part_type"`
    Language    string    `json:"language"`  // NEW: ISO 639-1 code (e.g., "he", "en")
    Sources     []Source  `json:"sources"`
    CreatedAt   time.Time `json:"created_at"`
}

type CreatePartRequest struct {
    Title       string   `json:"title"`
    Description string   `json:"description"`
    Date        string   `json:"date"`
    PartType    string   `json:"part_type"`
    Language    string   `json:"language"`  // NEW: defaults to "he"
    Sources     []Source `json:"sources"`
}
```

### 2. Backend - Update API Handler
**File:** `api/handle_parts_poc.go`

Default and validate language:
```go
func (a *App) HandleCreatePart(w http.ResponseWriter, r *http.Request) {
    // ... existing validation ...
    
    // Default language to "he" (Hebrew) if not provided
    language := req.Language
    if language == "" {
        language = "he"
    }
    
    // Basic validation (2-letter ISO code)
    if len(language) != 2 {
        http.Error(w, "Invalid language code, must be 2-letter ISO 639-1 code", http.StatusBadRequest)
        return
    }
    
    part := &storage.LessonPart{
        Title:       req.Title,
        Description: req.Description,
        Date:        date,
        PartType:    partType,
        Language:    language,  // NEW
        Sources:     req.Sources,
    }
    // ... save ...
}
```

### 3. Frontend - Add Language (Hidden for Now)
**File:** `frontend/app/page.tsx`

For now, always send `"he"` (since we only have Hebrew input):
```tsx
// In handleSubmit:
body: JSON.stringify({ 
  title, 
  description, 
  date, 
  part_type: 'live_lesson',
  language: 'he',  // NEW: hardcoded for now
  sources 
})

// Later when we add multi-language UI:
const [language, setLanguage] = useState('he')

<select value={language} onChange={(e) => setLanguage(e.target.value)}>
  <option value="he">עברית (Hebrew)</option>
  <option value="en">English</option>
  <option value="ru">Русский (Russian)</option>
  <option value="es">Español (Spanish)</option>
</select>
```

For now, keep it simple - no UI changes needed, just send `"he"`.

### 4. Test
- Create part (should default to "he")
- Create part with explicit "he"
- Create part with "en" (to test validation)
- Verify JSON storage includes language
- Test invalid language code (e.g., "invalid")

## Example JSON Output
```json
{
  "id": "uuid",
  "title": "שיעור בוקר",
  "description": "לימוד שמעתי...",
  "date": "2025-12-23T00:00:00Z",
  "part_type": "live_lesson",
  "language": "he",
  "sources": [...],
  "created_at": "2025-12-23T03:39:37..."
}
```

## Benefits
1. ✅ Identifies the language of title/description
2. ✅ Prepares for multi-language translations
3. ✅ Aligns with final system architecture
4. ✅ Simple string field, easy to validate
5. ✅ Defaults to Hebrew (source language)

## Validation Rules
- Language **defaults** to `"he"` if not provided
- Must be a 2-letter ISO 639-1 code
- Common: he, en, ru, es, de, it, fr, tr, ua

## Next Steps After This
After adding language:
1. Create `Event` model (date, type, number)
2. Link parts to events (add event_id)
3. Add translations map to parts
4. Implement recorded lesson flow (URL → auto-fill)

---

**This change continues the incremental approach with zero throwaway work!**
