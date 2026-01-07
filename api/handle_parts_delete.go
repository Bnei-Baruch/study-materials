package api

import (
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
)

// HandleDeletePart deletes a lesson part by ID
// If the part is Hebrew (he), it deletes all translations (all languages with same event_id and order)
func (a *App) HandleDeletePart(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	// Get the part to check its language, event_id, and order
	part, err := a.store.GetPart(id)
	if err != nil {
		http.Error(w, "Part not found", http.StatusNotFound)
		return
	}

	// If it's Hebrew, delete all translations (same event_id and order)
	if part.Language == "he" && part.EventID != "" {
		// Get all parts for this event
		allParts, err := a.store.ListParts()
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to list parts: %v", err), http.StatusInternalServerError)
			return
		}

		// Find and delete all parts with same event_id and order
		deletedCount := 0
		for _, p := range allParts {
			if p.EventID == part.EventID && p.Order == part.Order {
				if err := a.store.DeletePart(p.ID); err != nil {
					fmt.Printf("Warning: Failed to delete part %s: %v\n", p.ID, err)
				} else {
					deletedCount++
				}
			}
		}
		fmt.Printf("Deleted Hebrew part and %d translations (total %d parts)\n", deletedCount-1, deletedCount)
	} else {
		// For non-Hebrew parts, just delete the single part
		if err := a.store.DeletePart(id); err != nil {
			http.Error(w, fmt.Sprintf("Failed to delete part: %v", err), http.StatusInternalServerError)
			return
		}
	}

	w.WriteHeader(http.StatusNoContent)
}
