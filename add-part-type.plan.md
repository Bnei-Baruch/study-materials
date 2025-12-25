# Add Part Type Field to Lesson Parts

## Overview
Add a `part_type` field to distinguish between manually-created live lessons and auto-filled recorded lessons. This is a key step toward the full system where different part types have different creation flows.

## Current State
```go
type LessonPart struct {
    ID          string
    Title       string
    Description string
    Date        time.Time
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
    PartType    string    // NEW: "live_lesson" | "recorded_lesson"
    Sources     []Source
    CreatedAt   time.Time
}
```

## Part Types

### 1. `live_lesson`
- **Created manually** by user
- User fills in title, description, sources manually
- Sources selected via autocomplete search
- **Current POC flow** - this is what we're already doing

### 2. `recorded_lesson`
- **Auto-filled** from kabbalahmedia URL
- User provides URL like: `https://kabbalahmedia.info/he/lessons/cu/o3Yx5Gim?c=E3vEpCno`
- System extracts from archive-backend API:
  - Lesson date
  - Sources studied
  - Transcription links
- User can still edit after auto-fill

## Migration Path to Full System

### Current (Phase 1.4)
```
LessonPart {
  title, description, date, part_type, sources
}
```

### Phase 2: Add events
```
Event {
  date, type: "daily_lesson"
  parts: []EventPart
}

EventPart {
  part_type: "live_lesson" | "recorded_lesson"
  ... (same as current LessonPart)
}
```

### Phase 3: Different creation flows
```
if part_type == "live_lesson":
  → Manual form (current POC)

if part_type == "recorded_lesson":
  → URL input → fetch from archive-backend → pre-fill
```

**No throwaway work** - part_type field stays throughout!

## Implementation Tasks

### 1. Backend - Update Models
**File:** `storage/models.go`

Add `PartType` field:
```go
type LessonPart struct {
    ID          string    `json:"id"`
    Title       string    `json:"title"`
    Description string    `json:"description"`
    Date        time.Time `json:"date"`
    PartType    string    `json:"part_type"`  // NEW: "live_lesson" or "recorded_lesson"
    Sources     []Source  `json:"sources"`
    CreatedAt   time.Time `json:"created_at"`
}

type CreatePartRequest struct {
    Title       string   `json:"title"`
    Description string   `json:"description"`
    Date        string   `json:"date"`
    PartType    string   `json:"part_type"`  // NEW: optional, defaults to "live_lesson"
    Sources     []Source `json:"sources"`
}
```

### 2. Backend - Update API Handler
**File:** `api/handle_parts_poc.go`

Validate and default part_type:
```go
func (a *App) HandleCreatePart(w http.ResponseWriter, r *http.Request) {
    // ... decode request ...
    
    // Default part_type to "live_lesson" if not provided
    partType := req.PartType
    if partType == "" {
        partType = "live_lesson"
    }
    
    // Validate part_type
    if partType != "live_lesson" && partType != "recorded_lesson" {
        http.Error(w, "Invalid part_type, must be 'live_lesson' or 'recorded_lesson'", http.StatusBadRequest)
        return
    }
    
    part := &storage.LessonPart{
        Title:       req.Title,
        Description: req.Description,
        Date:        date,
        PartType:    partType,  // NEW
        Sources:     req.Sources,
    }
    // ... save ...
}
```

### 3. Frontend - Add Part Type (Hidden for Now)
**File:** `frontend/app/page.tsx`

For now, always send `"live_lesson"` (since we only have manual creation):
```tsx
// In handleSubmit:
body: JSON.stringify({ 
  title, 
  description, 
  date, 
  part_type: "live_lesson",  // NEW: hardcoded for now
  sources 
})

// Later when we add recorded lesson flow:
const [partType, setPartType] = useState<'live_lesson' | 'recorded_lesson'>('live_lesson')

// Show different forms based on partType
{partType === 'live_lesson' && (
  // Current manual form
)}

{partType === 'recorded_lesson' && (
  // Future: URL input form
)}
```

For now, we'll keep it simple - no UI changes needed, just send `"live_lesson"`.

### 4. Test
- Create part (should default to "live_lesson")
- Create part with explicit "live_lesson"
- Create part with "recorded_lesson" (to test validation)
- Verify JSON storage includes part_type

## Example JSON Output
```json
{
  "id": "uuid",
  "title": "Morning Lesson",
  "description": "Study of Shamati...",
  "date": "2025-12-23T00:00:00Z",
  "part_type": "live_lesson",
  "sources": [...],
  "created_at": "2025-12-23T03:33:24..."
}
```

## Benefits
1. ✅ Distinguishes manual vs auto-filled parts
2. ✅ Prepares for recorded lesson flow (URL input)
3. ✅ Aligns with final system architecture
4. ✅ Simple enum field, easy to validate
5. ✅ Defaults to current behavior ("live_lesson")

## Validation Rules
- Part type **defaults** to `"live_lesson"` if not provided
- Must be one of: `"live_lesson"` or `"recorded_lesson"`
- Stored as string for JSON compatibility

## Next Steps After This
After adding part_type:
1. Add `language` field (default "he")
2. Create `Event` model (date, type, number)
3. Link parts to events (add event_id)
4. Implement recorded lesson flow (URL → auto-fill)

---

**This change continues the incremental approach with zero throwaway work!**

