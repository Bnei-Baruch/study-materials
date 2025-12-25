package api

import (
	"encoding/json"
	"net/http"

	"github.com/Bnei-Baruch/study-material-service/common"
)

// handleGetUnits returns lessons in legacy format (backward compatible)
// GET /api/units?lang=hebrew
func handleGetUnits(w http.ResponseWriter, r *http.Request) {
	lang := r.URL.Query().Get("lang")
	
	// If no language specified, use first available
	if lang == "" {
		lang = common.Cache.GetFirstLanguage()
		if lang == "" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("[]"))
			return
		}
	}

	lessons := common.Cache.GetLessonsByLanguage(lang)

	// Convert to legacy format
	var units []common.UnitForClient
	for _, lesson := range lessons {
		units = append(units, common.UnitForClient{
			Title:       lesson.Title,
			Description: lesson.Content,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	
	if len(units) == 0 {
		w.Write([]byte("[]"))
		return
	}
	
	json.NewEncoder(w).Encode(units)
}


