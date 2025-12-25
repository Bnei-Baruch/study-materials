package api

import (
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
)

// HandleDeleteEvent deletes an event and all its parts (all languages)
func (a *App) HandleDeleteEvent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	eventID := vars["id"]

	// Verify event exists
	_, err := a.eventStore.GetEvent(eventID)
	if err != nil {
		http.Error(w, "Event not found", http.StatusNotFound)
		return
	}

	// Get all parts for this event
	allParts, err := a.store.ListParts()
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to list parts: %v", err), http.StatusInternalServerError)
		return
	}

	// Delete all parts associated with this event
	deletedParts := 0
	for _, part := range allParts {
		if part.EventID == eventID {
			if err := a.store.DeletePart(part.ID); err != nil {
				fmt.Printf("Warning: Failed to delete part %s: %v\n", part.ID, err)
			} else {
				deletedParts++
			}
		}
	}

	// Delete the event
	if err := a.eventStore.DeleteEvent(eventID); err != nil {
		http.Error(w, fmt.Sprintf("Failed to delete event: %v", err), http.StatusInternalServerError)
		return
	}

	fmt.Printf("Deleted event %s and %d parts\n", eventID, deletedParts)
	w.WriteHeader(http.StatusNoContent)
}
