package api

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"github.com/Bnei-Baruch/study-material-service/storage"
	"github.com/gorilla/mux"
)

// HandleGetTemplates returns the template configuration
func (a *App) HandleGetTemplates(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(a.templateConfig)
}

// HandleCreateTemplate creates a new template
func (a *App) HandleCreateTemplate(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	var req struct {
		ID           string            `json:"id"`
		Translations map[string]string `json:"translations"`
		Visible      bool              `json:"visible"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	// Validate
	if req.ID == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Template ID is required"})
		return
	}

	req.ID = strings.ToLower(strings.TrimSpace(req.ID))

	// Check for duplicate ID
	for _, t := range a.templateConfig.Templates {
		if t.ID == req.ID {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Template ID already exists"})
			return
		}
	}

	// Validate all languages have translations
	for _, lang := range a.templateConfig.Languages {
		if translation, ok := req.Translations[lang]; !ok || strings.TrimSpace(translation) == "" {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Missing translation for language: " + lang})
			return
		}
	}

	// Create template
	newTemplate := storage.TemplateDefinition{
		ID:           req.ID,
		Translations: req.Translations,
		Visible:      req.Visible,
	}

	a.templateConfig.Templates = append(a.templateConfig.Templates, newTemplate)

	// Save to MongoDB
	if err := a.templateStore.SaveConfig(a.templateConfig); err != nil {
		log.Printf("Error saving templates to MongoDB: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to save template"})
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(newTemplate)
}

// HandleUpdateTemplate updates an existing template
func (a *App) HandleUpdateTemplate(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	vars := mux.Vars(r)
	templateID := vars["id"]

	var req struct {
		Translations map[string]string `json:"translations"`
		Visible      bool              `json:"visible"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	// Find and update template
	found := false
	for i, t := range a.templateConfig.Templates {
		if t.ID == templateID {
			// Validate all languages have translations
			for _, lang := range a.templateConfig.Languages {
				if translation, ok := req.Translations[lang]; !ok || strings.TrimSpace(translation) == "" {
					w.WriteHeader(http.StatusBadRequest)
					json.NewEncoder(w).Encode(map[string]string{"error": "Missing translation for language: " + lang})
					return
				}
			}

			a.templateConfig.Templates[i].Translations = req.Translations
			a.templateConfig.Templates[i].Visible = req.Visible

			found = true
			break
		}
	}

	if !found {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Template not found"})
		return
	}

	// Save to MongoDB
	if err := a.templateStore.SaveConfig(a.templateConfig); err != nil {
		log.Printf("Error saving templates to MongoDB: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to save template"})
		return
	}

	// Return updated template
	for _, t := range a.templateConfig.Templates {
		if t.ID == templateID {
			json.NewEncoder(w).Encode(t)
			return
		}
	}
}

// HandleDeleteTemplate deletes a template
func (a *App) HandleDeleteTemplate(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	vars := mux.Vars(r)
	templateID := vars["id"]

	// Find and remove template
	found := false
	for i, t := range a.templateConfig.Templates {
		if t.ID == templateID {
			a.templateConfig.Templates = append(a.templateConfig.Templates[:i], a.templateConfig.Templates[i+1:]...)
			found = true
			break
		}
	}

	if !found {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Template not found"})
		return
	}

	// Save to MongoDB
	if err := a.templateStore.SaveConfig(a.templateConfig); err != nil {
		log.Printf("Error saving templates to MongoDB: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to save template"})
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Template deleted successfully"})
}
