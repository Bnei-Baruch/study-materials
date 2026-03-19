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

// HandleSyncTemplates syncs templates from JSON file to MongoDB, merging with existing data
// This preserves all existing data and only adds new language translations
func (a *App) HandleSyncTemplates(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	// Load fresh templates from JSON file
	jsonConfig, err := storage.LoadTemplates("templates.json")
	if err != nil {
		log.Printf("Error loading templates from JSON: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to load templates.json"})
		return
	}

	// Get current config from database
	currentConfig, err := a.templateStore.GetConfig()
	if err != nil {
		log.Printf("Error getting current config: %v", err)
		// If no config exists, use the JSON config
		currentConfig = jsonConfig
	} else {
		// Merge templates: keep DB templates, add new language translations from JSON
		for i, dbTemplate := range currentConfig.Templates {
			// Find matching template in JSON
			for _, jsonTemplate := range jsonConfig.Templates {
				if dbTemplate.ID == jsonTemplate.ID {
					// Initialize translations map if nil
					if currentConfig.Templates[i].Translations == nil {
						currentConfig.Templates[i].Translations = make(map[string]string)
					}

					// Merge translations: add new languages from JSON
					for lang, text := range jsonTemplate.Translations {
						currentConfig.Templates[i].Translations[lang] = text
					}

					break
				}
			}
		}

		// Add any new templates from JSON that don't exist in DB
		for _, jsonTemplate := range jsonConfig.Templates {
			found := false
			for _, dbTemplate := range currentConfig.Templates {
				if dbTemplate.ID == jsonTemplate.ID {
					found = true
					break
				}
			}
			if !found {
				currentConfig.Templates = append(currentConfig.Templates, jsonTemplate)
			}
		}

		// Update languages list and preparation from JSON
		currentConfig.Languages = jsonConfig.Languages
		currentConfig.Preparation = jsonConfig.Preparation
	}

	// Save merged config back to database
	if err := a.templateStore.SaveConfig(currentConfig); err != nil {
		log.Printf("Error saving synced config: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to save synced templates"})
		return
	}

	// Update in-memory config
	a.templateConfig = currentConfig

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":       "Templates synced successfully",
		"templates":     len(currentConfig.Templates),
		"languages":     currentConfig.Languages,
	})
}
