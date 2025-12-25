package api

import (
	"encoding/json"
	"fmt"
	"net/http"
)

// HandleSearchSources proxies search requests to kabbalahmedia sqdata API
func (a *App) HandleSearchSources(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"sources": []interface{}{},
			"total":   0,
		})
		return
	}

	// Search using kabbalahmedia client
	sources, err := a.kabbalahmediaClient.SearchSources(query)
	if err != nil {
		http.Error(w, fmt.Sprintf("Search failed: %v", err), http.StatusInternalServerError)
		return
	}

	// Return results
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"sources": sources,
		"total":   len(sources),
	})
}
