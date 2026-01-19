package storage

import (
	"fmt"
	"math"
	"math/rand"
	"sync"
	"time"
)

const (
	// IDLength is the length of generated short IDs (6 characters)
	IDLength = 6
	// Charset for generating IDs - alphanumeric characters
	charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
)

var (
	seededRand = rand.New(rand.NewSource(time.Now().UnixNano()))
	idMutex    sync.RWMutex
	usedIDs    = make(map[string]bool)
)

// generateShortID generates a random 6-character alphanumeric ID
// It ensures uniqueness by checking against previously generated IDs
func generateShortID() string {
	idMutex.Lock()
	defer idMutex.Unlock()

	for {
		id := randomString(IDLength)
		if !usedIDs[id] {
			usedIDs[id] = true
			return id
		}
	}
}

// randomString generates a random string of specified length
func randomString(length int) string {
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[seededRand.Intn(len(charset))]
	}
	return string(b)
}

// RegisterID registers an existing ID to prevent collision
// This should be called when loading IDs from storage
func RegisterID(id string) {
	idMutex.Lock()
	defer idMutex.Unlock()
	usedIDs[id] = true
}

// ClearRegisteredIDs clears all registered IDs
// Use this with caution - typically only for testing
func ClearRegisteredIDs() {
	idMutex.Lock()
	defer idMutex.Unlock()
	usedIDs = make(map[string]bool)
}

// GetIDInfo returns information about generated IDs for debugging
func GetIDInfo() map[string]interface{} {
	idMutex.RLock()
	defer idMutex.RUnlock()
	return map[string]interface{}{
		"total_generated": len(usedIDs),
		"charset_length": len(charset),
		"possible_combinations": fmt.Sprintf("%.0f", math.Pow(float64(len(charset)), IDLength)),
	}
}
