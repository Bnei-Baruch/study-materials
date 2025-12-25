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

	// Validate and default type
	if req.Type == "" {
		req.Type = "morning_lesson" // Default
	}
	validTypes := []string{"morning_lesson", "noon_lesson", "evening_lesson", "meal", "convention", "lecture", "other"}
	valid := false
	for _, t := range validTypes {
		if req.Type == t {
			valid = true
			break
		}
	}
	if !valid {
		http.Error(w, "Invalid event type, must be one of: morning_lesson, noon_lesson, evening_lesson, meal, convention, lecture, other", http.StatusBadRequest)
		return
	}

	// Default number to 1
	if req.Number == 0 {
		req.Number = 1
	}

	// Default public to false
	isPublic := false
	if req.Public != nil {
		isPublic = *req.Public
	}

	// Create event
	event := &storage.Event{
		Date:   date,
		Type:   req.Type,
		Number: req.Number,
		Public: isPublic,
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
