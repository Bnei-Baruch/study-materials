package storage

import (
	"encoding/json"
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

	// Create events directory if it doesn't exist
	eventsDir := filepath.Join(s.dataDir, "events")
	if err := os.MkdirAll(eventsDir, 0755); err != nil {
		return err
	}

	filename := filepath.Join(eventsDir, event.ID+".json")

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

// DeleteEvent deletes an event by ID
func (s *Store) DeleteEvent(id string) error {
	filename := filepath.Join(s.dataDir, "events", id+".json")
	if err := os.Remove(filename); err != nil {
		return err
	}
	return nil
}


