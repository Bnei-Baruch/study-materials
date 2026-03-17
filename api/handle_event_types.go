package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strings"

	"github.com/Bnei-Baruch/study-material-service/storage"
	"github.com/gorilla/mux"
)

var validNameRe = regexp.MustCompile(`^[a-z0-9_]+$`)

// HandleListEventTypes returns all event types sorted by order
func (a *App) HandleListEventTypes(w http.ResponseWriter, r *http.Request) {
	types, err := a.eventTypeStore.ListEventTypes()
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to list event types: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(types)
}

// HandleGetEventType retrieves a single event type by ID
func (a *App) HandleGetEventType(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]

	et, err := a.eventTypeStore.GetEventType(id)
	if err != nil {
		http.Error(w, fmt.Sprintf("Event type not found: %v", err), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(et)
}

// HandleCreateEventType creates a new event type
func (a *App) HandleCreateEventType(w http.ResponseWriter, r *http.Request) {
	var req storage.CreateEventTypeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	req.Name = strings.TrimSpace(strings.ToLower(req.Name))
	if req.Name == "" {
		http.Error(w, "name is required", http.StatusBadRequest)
		return
	}
	if !validNameRe.MatchString(req.Name) {
		http.Error(w, "name must contain only lowercase letters, digits, and underscores", http.StatusBadRequest)
		return
	}

	if req.Color == "" {
		req.Color = "gray"
	}
	if req.Titles == nil {
		req.Titles = map[string]string{"en": req.Name}
	}

	order := 0
	if req.Order != nil {
		order = *req.Order
	}

	et := &storage.EventType{
		Name:   req.Name,
		Titles: req.Titles,
		Color:  req.Color,
		Order:  order,
	}

	if err := a.eventTypeStore.CreateEventType(et); err != nil {
		if strings.Contains(err.Error(), "already exists") {
			http.Error(w, err.Error(), http.StatusConflict)
			return
		}
		http.Error(w, fmt.Sprintf("Failed to create event type: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(et)
}

// HandleUpdateEventType updates an existing event type
func (a *App) HandleUpdateEventType(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]

	et, err := a.eventTypeStore.GetEventType(id)
	if err != nil {
		http.Error(w, fmt.Sprintf("Event type not found: %v", err), http.StatusNotFound)
		return
	}

	var req storage.UpdateEventTypeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Titles != nil {
		et.Titles = req.Titles
	}
	if req.Color != "" {
		et.Color = req.Color
	}
	if req.Order != nil {
		et.Order = *req.Order
	}

	if err := a.eventTypeStore.UpdateEventType(et); err != nil {
		http.Error(w, fmt.Sprintf("Failed to update event type: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(et)
}

// HandleDeleteEventType deletes an event type by ID
func (a *App) HandleDeleteEventType(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]

	if err := a.eventTypeStore.DeleteEventType(id); err != nil {
		http.Error(w, fmt.Sprintf("Failed to delete event type: %v", err), http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
