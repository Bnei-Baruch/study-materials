package api

import (
	"encoding/json"
	"net/http"

	"github.com/Bnei-Baruch/study-material-service/common"
)

// handleGetLanguages returns available languages
// GET /api/languages
func handleGetLanguages(w http.ResponseWriter, r *http.Request) {
	languages := common.Cache.GetLanguages()

	response := common.LanguageResponse{
		Languages: languages,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}


