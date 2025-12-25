package storage

import "go.mongodb.org/mongo-driver/bson"

// PartStore defines the interface for lesson part storage
type PartStore interface {
	SavePart(part *LessonPart) error
	GetPart(id string) (*LessonPart, error)
	ListParts() ([]*LessonPart, error)
	DeletePart(id string) error
}

// EventStore defines the interface for event storage
type EventStore interface {
	SaveEvent(event *Event) error
	GetEvent(id string) (*Event, error)
	ListEvents() ([]*Event, error)
	ListEventsFiltered(filter bson.M, limit, offset int) ([]Event, int, error)
	DeleteEvent(id string) error
}

// JSONStore adapters for JSON storage to match interfaces
// The existing Store already implements PartStore, we just need to add ListEventsFiltered

// ListEventsFiltered for JSON store (simple in-memory filtering)
func (s *Store) ListEventsFiltered(filter bson.M, limit, offset int) ([]Event, int, error) {
	// Get all events
	allEvents, err := s.ListEvents()
	if err != nil {
		return nil, 0, err
	}

	// Convert []*Event to []Event and apply filters
	var filtered []Event
	for _, event := range allEvents {
		// Apply filter
		matches := true

		// Check public filter
		if publicVal, ok := filter["public"]; ok {
			if publicBool, ok := publicVal.(bool); ok {
				if event.Public != publicBool {
					matches = false
				}
			}
		}

		// Check date filter (simplified - full implementation would parse date ranges)
		// For now, just check if date field exists in filter

		if matches {
			filtered = append(filtered, *event)
		}
	}

	total := len(filtered)

	// Apply offset and limit
	if offset > len(filtered) {
		offset = len(filtered)
	}
	filtered = filtered[offset:]

	if limit > 0 && len(filtered) > limit {
		filtered = filtered[:limit]
	}

	return filtered, total, nil
}
