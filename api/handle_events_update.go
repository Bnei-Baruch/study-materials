package api

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
)

// UpdateEventRequest represents the request to update an event
type UpdateEventRequest struct {
	Titles map[string]string `json:"titles,omitempty"` // Optional: update titles
	Order  *int              `json:"order,omitempty"`  // Optional: update order
	Public *bool             `json:"public,omitempty"` // Optional: update public status
}

// HandleUpdateEvent updates an existing event
func (a *App) HandleUpdateEvent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	eventId := vars["id"]

	// Get existing event
	event, err := a.store.GetEvent(eventId)
	if err != nil {
		http.Error(w, "Event not found", http.StatusNotFound)
		return
	}

	// Parse request body
	var req UpdateEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Update titles if provided
	if req.Titles != nil {
		// If event doesn't have titles yet, generate defaults
		if event.Titles == nil {
			event.Titles = getDefaultTitles(event.Type)
		}

		// Merge with user-provided titles
		for lang, title := range req.Titles {
			if title != "" {
				event.Titles[lang] = title
			}
		}
	}

	// Update order if provided
	if req.Order != nil {
		event.Order = *req.Order
	}

	// Update public status if provided
	if req.Public != nil {
		event.Public = *req.Public
	}

	// Save updated event
	if err := a.store.SaveEvent(event); err != nil {
		http.Error(w, fmt.Sprintf("Failed to update event: %v", err), http.StatusInternalServerError)
		return
	}

	// Return updated event
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(event)
}
