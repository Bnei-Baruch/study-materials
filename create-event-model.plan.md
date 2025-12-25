# Create Event Model and Link Parts to Events

## Overview
Create an Event model to group lesson parts into events (daily lessons, meals, conventions). This matches the original requirement: "User creates the daily lesson event with its date and number, then creates parts within it."

## Current State
```
LessonPart (standalone)
  - date
  - title
  - description
  - type
  - language
  - sources
```

## Target State
```
Event
  - id
  - date
  - type (daily_lesson, meal, convention, etc.)
  - number (for multiple events on same day)
  - created_at

LessonPart
  - event_id (optional, links to Event)
  - order (position within event)
  - ... all existing fields stay
```

## Event Types

Based on requirements:
- `daily_lesson` - Daily morning/evening lessons (most common)
- `meal` - Special meals (e.g., Tu B'Shvat meal)
- `convention` - Multi-day conventions
- `lecture` - Single lectures/talks
- `other` - Other event types

## Migration Strategy

### Phase 3.1 (NOW): Create Event model
- Add Event struct
- Add event storage (JSON files in `data/events/`)
- Add event CRUD API endpoints
- Keep parts independent for now (backward compatible)

### Phase 3.2: Link parts to events
- Add `event_id` field to parts (optional)
- Add `order` field to parts
- Parts can exist without events (backward compatible)

### Phase 3.3: Frontend integration
- Create event first, then parts within it
- Date defaults to event's date

**All existing parts continue to work!**

## Implementation Tasks

### 1. Backend - Create Event Model
**File:** `storage/models.go`

```go
// Event represents a study event (daily lesson, meal, convention, etc.)
type Event struct {
    ID        string    `json:"id"`
    Date      time.Time `json:"date"`       // Event date
    Type      string    `json:"type"`       // "daily_lesson", "meal", "convention", etc.
    Number    int       `json:"number"`     // Event number for same day (1, 2, ...)
    CreatedAt time.Time `json:"created_at"`
}

// CreateEventRequest is the request body for creating an event
type CreateEventRequest struct {
    Date   string `json:"date"`   // ISO format: YYYY-MM-DD
    Type   string `json:"type"`   // Event type
    Number int    `json:"number"` // Event number, defaults to 1
}
```

### 2. Backend - Event Storage
**File:** `storage/event_store.go` (NEW)

```go
package storage

import (
    "encoding/json"
    "fmt"
    "os"
    "path/filepath"
    "time"

    "github.com/google/uuid"
)

// SaveEvent saves an event to a JSON file
func (s *Store) SaveEvent(event *Event) error {
    if event.ID == "" {
        event.ID = uuid.New().String()
    }
    if event.CreatedAt.IsZero() {
        event.CreatedAt = time.Now()
    }

    filename := filepath.Join(s.dataDir, "events", event.ID+".json")
    
    // Create events directory if it doesn't exist
    eventsDir := filepath.Join(s.dataDir, "events")
    if err := os.MkdirAll(eventsDir, 0755); err != nil {
        return err
    }

    data, err := json.MarshalIndent(event, "", "  ")
    if err != nil {
        return err
    }

    return os.WriteFile(filename, data, 0644)
}

// GetEvent retrieves an event by ID
func (s *Store) GetEvent(id string) (*Event, error) {
    filename := filepath.Join(s.dataDir, "events", id+".json")
    
    data, err := os.ReadFile(filename)
    if err != nil {
        return nil, err
    }

    var event Event
    if err := json.Unmarshal(data, &event); err != nil {
        return nil, err
    }

    return &event, nil
}

// ListEvents lists all events
func (s *Store) ListEvents() ([]*Event, error) {
    eventsDir := filepath.Join(s.dataDir, "events")
    
    // Create directory if it doesn't exist
    if err := os.MkdirAll(eventsDir, 0755); err != nil {
        return nil, err
    }

    files, err := os.ReadDir(eventsDir)
    if err != nil {
        return nil, err
    }

    var events []*Event
    for _, file := range files {
        if file.IsDir() || filepath.Ext(file.Name()) != ".json" {
            continue
        }

        id := file.Name()[:len(file.Name())-5] // Remove .json
        event, err := s.GetEvent(id)
        if err != nil {
            continue
        }
        events = append(events, event)
    }

    return events, nil
}
```

### 3. Backend - Event API Handlers
**File:** `api/handle_events.go` (NEW)

```go
package api

import (
    "encoding/json"
    "fmt"
    "net/http"
    "time"

    "github.com/Bnei-Baruch/study-material-service/storage"
    "github.com/gorilla/mux"
)

// HandleCreateEvent creates a new event
func (a *App) HandleCreateEvent(w http.ResponseWriter, r *http.Request) {
    var req storage.CreateEventRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Invalid request body", http.StatusBadRequest)
        return
    }

    // Validate date
    if req.Date == "" {
        http.Error(w, "Date is required", http.StatusBadRequest)
        return
    }

    date, err := time.Parse("2006-01-02", req.Date)
    if err != nil {
        http.Error(w, "Invalid date format, use YYYY-MM-DD", http.StatusBadRequest)
        return
    }

    // Validate type
    if req.Type == "" {
        req.Type = "daily_lesson" // Default
    }
    validTypes := []string{"daily_lesson", "meal", "convention", "lecture", "other"}
    valid := false
    for _, t := range validTypes {
        if req.Type == t {
            valid = true
            break
        }
    }
    if !valid {
        http.Error(w, "Invalid event type", http.StatusBadRequest)
        return
    }

    // Default number to 1
    if req.Number == 0 {
        req.Number = 1
    }

    // Create event
    event := &storage.Event{
        Date:   date,
        Type:   req.Type,
        Number: req.Number,
    }

    if err := a.store.SaveEvent(event); err != nil {
        http.Error(w, fmt.Sprintf("Failed to save event: %v", err), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(event)
}

// HandleGetEvent retrieves an event by ID
func (a *App) HandleGetEvent(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    id := vars["id"]

    event, err := a.store.GetEvent(id)
    if err != nil {
        http.Error(w, fmt.Sprintf("Event not found: %v", err), http.StatusNotFound)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(event)
}

// HandleListEvents lists all events
func (a *App) HandleListEvents(w http.ResponseWriter, r *http.Request) {
    events, err := a.store.ListEvents()
    if err != nil {
        http.Error(w, fmt.Sprintf("Failed to list events: %v", err), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "events": events,
        "total":  len(events),
    })
}
```

### 4. Backend - Register Event Routes
**File:** `api/api.go`

Add to `initRouters()`:
```go
// Event endpoints
a.router.HandleFunc("/api/events", a.HandleCreateEvent).Methods(http.MethodPost)
a.router.HandleFunc("/api/events", a.HandleListEvents).Methods(http.MethodGet)
a.router.HandleFunc("/api/events/{id}", a.HandleGetEvent).Methods(http.MethodGet)
```

### 5. Update .gitignore
Add events directory:
```
data/events/
```

### 6. Test Event API
- Create event
- Get event by ID
- List all events
- Verify JSON storage

## Example Event JSON
```json
{
  "id": "event-uuid",
  "date": "2025-12-23T00:00:00Z",
  "type": "daily_lesson",
  "number": 1,
  "created_at": "2025-12-23T03:50:00..."
}
```

## Benefits
1. ✅ Groups parts into logical events
2. ✅ Supports multiple events per day (number field)
3. ✅ Different event types (lessons, meals, conventions)
4. ✅ Backward compatible (existing parts still work)
5. ✅ Matches original requirements

## Next Steps After This
After creating events:
1. Add `event_id` and `order` fields to parts
2. Frontend: Create event first, then parts within it
3. Parts inherit date from event
4. Add translations map to parts

---

**This change brings us to the event-based architecture!**
