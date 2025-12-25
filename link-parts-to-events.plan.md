# Link Parts to Events

## Overview
Add `event_id` and `order` fields to LessonPart to link parts to events. Parts can now belong to events, enabling the workflow: "Create event → Create parts within event."

## Current State
```
Event (independent)
  - id, date, type, number

LessonPart (independent)
  - id, title, description, date, type, language, sources
```

## Target State
```
Event
  - id, date, type, number

LessonPart
  - event_id (optional) ← NEW: Links to parent event
  - order (optional)    ← NEW: Position within event (1, 2, 3...)
  - ... all existing fields
```

## Key Design Decisions

### 1. Optional event_id (Backward Compatible)
- Parts CAN exist without an event (for standalone content)
- Parts CAN belong to an event (when created within event workflow)
- **All existing parts continue to work!**

### 2. Order Field
- Indicates part position within an event (1, 2, 3, ...)
- Only relevant when part belongs to an event
- Allows ordering multiple parts in a lesson

### 3. Date Behavior
- Parts still have their own `date` field
- When creating part within event: date defaults to event's date
- Allows flexibility for edge cases

## Implementation Tasks

### 1. Backend - Update LessonPart Model
**File:** `storage/models.go`

```go
type LessonPart struct {
    ID          string    `json:"id"`
    Title       string    `json:"title"`
    Description string    `json:"description"`
    Date        time.Time `json:"date"`
    PartType    string    `json:"part_type"`
    Language    string    `json:"language"`
    EventID     string    `json:"event_id,omitempty"` // NEW: Optional link to event
    Order       int       `json:"order,omitempty"`    // NEW: Position within event
    Sources     []Source  `json:"sources"`
    CreatedAt   time.Time `json:"created_at"`
}

type CreatePartRequest struct {
    Title       string   `json:"title"`
    Description string   `json:"description"`
    Date        string   `json:"date"`
    PartType    string   `json:"part_type"`
    Language    string   `json:"language"`
    EventID     string   `json:"event_id,omitempty"` // NEW: Optional event link
    Order       int      `json:"order,omitempty"`    // NEW: Part order
    Sources     []Source `json:"sources"`
}
```

### 2. Backend - Update API Handler
**File:** `api/handle_parts_poc.go`

```go
// In HandleCreatePart, after validation:

// If event_id is provided, verify event exists
if req.EventID != "" {
    _, err := a.store.GetEvent(req.EventID)
    if err != nil {
        http.Error(w, "Event not found", http.StatusNotFound)
        return
    }
}

part := &storage.LessonPart{
    Title:       req.Title,
    Description: req.Description,
    Date:        date,
    PartType:    partType,
    Language:    language,
    EventID:     req.EventID,  // NEW
    Order:       req.Order,    // NEW
    Sources:     req.Sources,
}
```

### 3. Backend - Add Endpoint to Get Parts by Event
**File:** `api/handle_parts_poc.go`

```go
// HandleGetEventParts retrieves all parts for an event
func (a *App) HandleGetEventParts(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    eventID := vars["event_id"]

    // Verify event exists
    _, err := a.store.GetEvent(eventID)
    if err != nil {
        http.Error(w, "Event not found", http.StatusNotFound)
        return
    }

    // Get all parts and filter by event_id
    allParts, err := a.store.ListParts()
    if err != nil {
        http.Error(w, fmt.Sprintf("Failed to list parts: %v", err), http.StatusInternalServerError)
        return
    }

    var eventParts []*storage.LessonPart
    for _, part := range allParts {
        if part.EventID == eventID {
            eventParts = append(eventParts, part)
        }
    }

    // Sort by order
    sort.Slice(eventParts, func(i, j int) bool {
        return eventParts[i].Order < eventParts[j].Order
    })

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "parts": eventParts,
        "total": len(eventParts),
    })
}
```

### 4. Backend - Register New Route
**File:** `api/api.go`

```go
// Get parts for specific event
a.router.HandleFunc("/api/events/{event_id}/parts", a.HandleGetEventParts).Methods(http.MethodGet)
```

### 5. Frontend - No Changes Needed Yet
Current frontend creates standalone parts (no event_id).
This continues to work! Event integration comes in Phase 3.2.

### 6. Test
- Create part without event_id (backward compatible)
- Create part with event_id and order
- Create multiple parts for same event with different orders
- Get parts by event_id (sorted by order)
- Try invalid event_id (should fail)

## Example Part JSON (Linked to Event)
```json
{
  "id": "part-uuid",
  "title": "שיעור בוקר חלק 1",
  "description": "לימוד שמעתי...",
  "date": "2025-12-23T00:00:00Z",
  "part_type": "live_lesson",
  "language": "he",
  "event_id": "8bd7cdf1-681a-4f8d-b47b-7445ed11b727",
  "order": 1,
  "sources": [...],
  "created_at": "2025-12-23T03:50:00..."
}
```

## Example Part JSON (Standalone)
```json
{
  "id": "part-uuid",
  "title": "Standalone Lesson",
  "date": "2025-12-23T00:00:00Z",
  ...
  // No event_id - works fine!
}
```

## Benefits
1. ✅ Parts can belong to events
2. ✅ Multiple parts per event, ordered
3. ✅ Backward compatible (existing parts work)
4. ✅ Flexible (parts can be standalone OR in events)
5. ✅ Enables event-based workflow

## Migration Path
- **Phase 3.0** (done): Event model created ✓
- **Phase 3.1** (now): Link parts to events ✓
- **Phase 3.2**: Frontend creates event first, then parts
- **Phase 4.0**: Add translations map

---

**This change connects the two models without breaking anything!**


