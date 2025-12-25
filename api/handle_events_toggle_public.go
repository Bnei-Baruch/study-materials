package api

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
)

// TogglePublicRequest represents the request to toggle event public status
type TogglePublicRequest struct {
	Public bool `json:"public"`
}

// HandleToggleEventPublic toggles the public status of an event
func (a *App) HandleToggleEventPublic(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	eventId := vars["id"]

	// Get existing event
	event, err := a.eventStore.GetEvent(eventId)
	if err != nil {
		http.Error(w, "Event not found", http.StatusNotFound)
		return
	}

	// Parse request body
	var req TogglePublicRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Update public status
	event.Public = req.Public

	// Save updated event
	if err := a.eventStore.SaveEvent(event); err != nil {
		http.Error(w, fmt.Sprintf("Failed to update event: %v", err), http.StatusInternalServerError)
		return
	}

	// Return updated event
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(event)
}

