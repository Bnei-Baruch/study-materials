package api

import (
	"encoding/json"
	"net/http"
)

// HandleGetTemplates returns the template configuration
func (a *App) HandleGetTemplates(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(a.templateConfig)
}
