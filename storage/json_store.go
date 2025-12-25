package storage

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/google/uuid"
)

// Store manages JSON file-based storage for lesson parts
type Store struct {
	dataDir string
	mu      sync.RWMutex
}

// NewStore creates a new Store instance
func NewStore(dataDir string) (*Store, error) {
	// Create data directory if it doesn't exist
	partsDir := filepath.Join(dataDir, "parts")
	if err := os.MkdirAll(partsDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create data directory: %w", err)
	}

	return &Store{
		dataDir: dataDir,
	}, nil
}

// SavePart saves a lesson part to a JSON file
func (s *Store) SavePart(part *LessonPart) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Generate ID if not set
	if part.ID == "" {
		part.ID = uuid.New().String()
	}

	// Set created time if not set
	if part.CreatedAt.IsZero() {
		part.CreatedAt = time.Now()
	}

	// Marshal to JSON
	data, err := json.MarshalIndent(part, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal part: %w", err)
	}

	// Write to file
	filename := filepath.Join(s.dataDir, "parts", fmt.Sprintf("%s.json", part.ID))
	if err := os.WriteFile(filename, data, 0644); err != nil {
		return fmt.Errorf("failed to write part file: %w", err)
	}

	return nil
}

// GetPart retrieves a lesson part by ID
func (s *Store) GetPart(id string) (*LessonPart, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	filename := filepath.Join(s.dataDir, "parts", fmt.Sprintf("%s.json", id))

	// Read file
	data, err := os.ReadFile(filename)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, fmt.Errorf("part not found: %s", id)
		}
		return nil, fmt.Errorf("failed to read part file: %w", err)
	}

	// Unmarshal JSON
	var part LessonPart
	if err := json.Unmarshal(data, &part); err != nil {
		return nil, fmt.Errorf("failed to unmarshal part: %w", err)
	}

	return &part, nil
}

// ListParts returns all lesson parts
func (s *Store) ListParts() ([]*LessonPart, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	partsDir := filepath.Join(s.dataDir, "parts")
	entries, err := os.ReadDir(partsDir)
	if err != nil {
		return nil, fmt.Errorf("failed to read parts directory: %w", err)
	}

	var parts []*LessonPart
	for _, entry := range entries {
		if entry.IsDir() || filepath.Ext(entry.Name()) != ".json" {
			continue
		}

		// Read and unmarshal each file
		data, err := os.ReadFile(filepath.Join(partsDir, entry.Name()))
		if err != nil {
			continue // Skip files we can't read
		}

		var part LessonPart
		if err := json.Unmarshal(data, &part); err != nil {
			continue // Skip invalid JSON
		}

		parts = append(parts, &part)
	}

	return parts, nil
}

// DeletePart deletes a lesson part by ID
func (s *Store) DeletePart(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	filename := filepath.Join(s.dataDir, "parts", fmt.Sprintf("%s.json", id))
	if err := os.Remove(filename); err != nil {
		return fmt.Errorf("failed to delete part: %w", err)
	}
	return nil
}
