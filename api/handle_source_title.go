package api

import (
	"encoding/json"
	"fmt"
	"net/http"
)

// HandleGetSourceTitle fetches a source title in a specific language
func (a *App) HandleGetSourceTitle(w http.ResponseWriter, r *http.Request) {
	sourceID := r.URL.Query().Get("id")
	language := r.URL.Query().Get("language")

	if sourceID == "" {
		http.Error(w, "Source ID is required", http.StatusBadRequest)
		return
	}

	if language == "" {
		language = "he" // Default to Hebrew
	}

	// Get the source title in the requested language
	title, err := a.kabbalahmediaClient.GetSourceTitle(sourceID, language)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to get source title: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"id":    sourceID,
		"title": title,
		"url":   fmt.Sprintf("https://kabbalahmedia.info/sources/%s", sourceID),
	})
}

