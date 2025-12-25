package api

import (
	"encoding/json"
	"io"
	"log"
	"net/http"

	"github.com/Bnei-Baruch/study-material-service/common"
	"github.com/spf13/viper"
)

// handleSync receives lesson updates from Google Apps Script
// POST /api/sync
func handleSync(w http.ResponseWriter, r *http.Request) {
	// Read request body
	body, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("Error reading sync request body: %v", err)
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Parse lessons
	var lessons []common.Lesson
	if err := json.Unmarshal(body, &lessons); err != nil {
		log.Printf("Error parsing sync request JSON: %v", err)
		http.Error(w, "invalid JSON format", http.StatusBadRequest)
		return
	}

	// Process HTML content
	editor := common.HtmlEditor{}
	for i := range lessons {
		lessons[i].Content = editor.Init(lessons[i].Content)
	}

	// Update cache
	maxPerLanguage := viper.GetInt("app.max-lessons-per-language")
	if maxPerLanguage == 0 {
		maxPerLanguage = 5 // default
	}
	
	common.Cache.UpdateLessons(lessons, maxPerLanguage)

	log.Printf("Cache updated with %d lessons", len(lessons))

	// Return success response
	response := common.SyncResponse{
		Success: true,
		Message: "lessons updated successfully",
		Count:   len(lessons),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}


