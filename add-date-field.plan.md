# Add Date Field to Lesson Parts

## Overview
Add a date field to lesson parts to track when each lesson occurred. This is a foundational step toward the full event-based system.

## Current State
```go
type LessonPart struct {
    ID          string
    Title       string
    Description string
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
    Date        time.Time  // NEW: When this lesson occurred
    Sources     []Source
    CreatedAt   time.Time  // When this record was created
}
```

## Migration Path to Full System

### Current (Phase 1.3)
```
LessonPart {
  title, description, date, sources
}
```

### Phase 2: Add event grouping
```
Event {
  date, number (e.g., lesson 1, 2 for same day)
  parts: []EventPart
}
```

### Phase 3: Multi-language
```
EventPart {
  title, description (source lang)
  language: "he"
  translations: {en: {...}, ru: {...}}
}
```

**No throwaway work** - date field stays throughout all phases!

## Implementation Tasks

### 1. Backend - Update Models
**File:** `storage/models.go`

Add `Date` field:
```go
type LessonPart struct {
    ID          string    `json:"id"`
    Title       string    `json:"title"`
    Description string    `json:"description"`
    Date        time.Time `json:"date"`  // NEW
    Sources     []Source  `json:"sources"`
    CreatedAt   time.Time `json:"created_at"`
}

type CreatePartRequest struct {
    Title       string    `json:"title"`
    Description string    `json:"description"`
    Date        string    `json:"date"`  // NEW: ISO format "2025-12-23"
    Sources     []Source  `json:"sources"`
}
```

### 2. Backend - Update API Handler
**File:** `api/handle_parts_poc.go`

Parse and validate date:
```go
func (a *App) HandleCreatePart(w http.ResponseWriter, r *http.Request) {
    // ... decode request ...
    
    // Parse date (required)
    if req.Date == "" {
        http.Error(w, "Date is required", http.StatusBadRequest)
        return
    }
    
    date, err := time.Parse("2006-01-02", req.Date)
    if err != nil {
        http.Error(w, "Invalid date format, use YYYY-MM-DD", http.StatusBadRequest)
        return
    }
    
    part := &storage.LessonPart{
        Title:       req.Title,
        Description: req.Description,
        Date:        date,  // NEW
        Sources:     req.Sources,
    }
    // ... save ...
}
```

### 3. Frontend - Add Date Picker
**File:** `frontend/app/page.tsx`

Add date input:
```tsx
const [date, setDate] = useState(() => {
  // Default to today
  const today = new Date()
  return today.toISOString().split('T')[0]
})

// In the form:
<div>
  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
    Lesson Date *
  </label>
  <input
    id="date"
    type="date"
    value={date}
    onChange={(e) => setDate(e.target.value)}
    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
  />
</div>

// In submit:
body: JSON.stringify({ title, description, date, sources })

// In success view:
<div>
  <span className="font-semibold text-gray-700">Date:</span>{' '}
  <span className="text-gray-600">
    {new Date(createdPart.date).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}
  </span>
</div>
```

### 4. Test
- Create part with date
- Verify JSON storage includes date
- Check API response
- Test frontend displays date correctly
- Test validation (invalid date format)

## Example JSON Output
```json
{
  "id": "uuid",
  "title": "Morning Lesson",
  "description": "Study of Shamati...",
  "date": "2025-12-23T00:00:00Z",
  "sources": [...],
  "created_at": "2025-12-23T03:26:19..."
}
```

## Benefits
1. ✅ Lessons are now associated with specific dates
2. ✅ Can filter/sort by date in the future
3. ✅ Moves toward event-based architecture
4. ✅ Date is preserved in all future phases
5. ✅ Simple, clean addition

## Validation Rules
- Date is **required**
- Format: `YYYY-MM-DD` (ISO 8601)
- Frontend defaults to today's date
- Backend validates format

## Next Steps After This
After adding date, natural progressions:
1. Add `part_type` (live_lesson vs recorded_lesson)
2. Add `language` field (default "he")
3. Add `part_order` (for multiple parts in one lesson)
4. Group parts into events

---

**This change continues the incremental approach with zero throwaway work!**
