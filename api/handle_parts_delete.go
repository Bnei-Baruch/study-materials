package api

import (
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
)

// HandleDeletePart deletes a lesson part by ID.
// If the part is Hebrew, it deletes all language variants (same event_id and part_number).
func (a *App) HandleDeletePart(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	part, err := a.store.GetPart(id)
	if err != nil {
		http.Error(w, "Part not found", http.StatusNotFound)
		return
	}

	if part.Language == "he" && part.EventID != "" {
		allParts, err := a.store.ListParts()
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to list parts: %v", err), http.StatusInternalServerError)
			return
		}

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
		if err := a.store.DeletePart(id); err != nil {
			http.Error(w, fmt.Sprintf("Failed to delete part: %v", err), http.StatusInternalServerError)
			return
		}
	}

	w.WriteHeader(http.StatusNoContent)
}
