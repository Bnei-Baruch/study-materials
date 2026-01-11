package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gorilla/mux"
)

// UpdateEventRequest represents the request to update an event
type UpdateEventRequest struct {
	Date      *string           `json:"date,omitempty"`       // Optional: update date (YYYY-MM-DD)
	Titles    map[string]string `json:"titles,omitempty"`     // Optional: update titles
	StartTime *string           `json:"start_time,omitempty"` // Optional: update start time (HH:MM)
	EndTime   *string           `json:"end_time,omitempty"`   // Optional: update end time (HH:MM)
	Order     *int              `json:"order,omitempty"`      // Optional: update order
	Public    *bool             `json:"public,omitempty"`     // Optional: update public status
}

// HandleUpdateEvent updates an existing event
func (a *App) HandleUpdateEvent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	eventId := vars["id"]

	// Get existing event
	event, err := a.eventStore.GetEvent(eventId)
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

	// Update date if provided
	if req.Date != nil {
		parsedDate, err := time.Parse("2006-01-02", *req.Date)
		if err != nil {
			http.Error(w, fmt.Sprintf("Invalid date format: %v", err), http.StatusBadRequest)
			return
		}
		event.Date = parsedDate
	}

	// Update start time if provided
	if req.StartTime != nil {
		event.StartTime = *req.StartTime
	}

	// Update end time if provided
	if req.EndTime != nil {
		event.EndTime = *req.EndTime
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
	if err := a.eventStore.SaveEvent(event); err != nil {
		http.Error(w, fmt.Sprintf("Failed to update event: %v", err), http.StatusInternalServerError)
		return
	}

	// Return updated event
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(event)
}
