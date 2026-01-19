package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"time"

	"github.com/Bnei-Baruch/study-material-service/storage"
	"github.com/gorilla/mux"
)

// HandleCreatePart creates a new lesson part (POC)
func (a *App) HandleCreatePart(w http.ResponseWriter, r *http.Request) {
	var req storage.CreatePartRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate
	if req.Title == "" {
		http.Error(w, "Title is required", http.StatusBadRequest)
		return
	}

	if req.Date == "" {
		http.Error(w, "Date is required", http.StatusBadRequest)
		return
	}

	// Parse date
	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		http.Error(w, "Invalid date format, use YYYY-MM-DD", http.StatusBadRequest)
		return
	}

	// Default and validate part_type
	partType := req.PartType
	if partType == "" {
		partType = "live_lesson" // Default to live_lesson
	}
	if partType != "live_lesson" && partType != "recorded_lesson" {
		http.Error(w, "Invalid part_type, must be 'live_lesson' or 'recorded_lesson'", http.StatusBadRequest)
		return
	}

	// Default and validate language
	language := req.Language
	if language == "" {
		language = "he" // Default to Hebrew
	}
	if len(language) != 2 {
		http.Error(w, "Invalid language code, must be 2-letter ISO 639-1 code", http.StatusBadRequest)
		return
	}

	// If event_id is provided, verify event exists
	if req.EventID != "" {
		_, err := a.eventStore.GetEvent(req.EventID)
		if err != nil {
			http.Error(w, "Event not found", http.StatusNotFound)
			return
		}
	}

	// Create part
	part := &storage.LessonPart{
		Title:                  req.Title,
		Description:            req.Description,
		Date:                   date,
		PartType:               partType,
		Language:               language,
		EventID:                req.EventID,
		Order:                  req.Order,
		ExcerptsLink:           req.ExcerptsLink,
		TranscriptLink:         req.TranscriptLink,
		LessonLink:             req.LessonLink,
		ProgramLink:            req.ProgramLink,
		ReadingBeforeSleepLink: req.ReadingBeforeSleepLink,
		LessonPreparationLink:  req.LessonPreparationLink,
		RecordedLessonDate:     req.RecordedLessonDate,
		Sources:                req.Sources,
		CustomLinks:            req.CustomLinks,
	}

	if err := a.store.SavePart(part); err != nil {
		http.Error(w, fmt.Sprintf("Failed to save part: %v", err), http.StatusInternalServerError)
		return
	}

	// Auto-create translation stubs for other languages
	// Use languages from template config
	supportedLanguages := a.templateConfig.Languages

	// Build template lookup map for quick access
	templateMap := make(map[string]map[string]string)
	for _, tmpl := range a.templateConfig.Templates {
		templateMap[tmpl.ID] = tmpl.Translations
	}

	for _, lang := range supportedLanguages {
		if lang == part.Language {
			continue // Skip the language we just created
		}

		// Determine title for translation stub
		stubTitle := "[Translation needed]"
		if part.Order == 0 {
			// For preparation parts, use translated title from config
			if translatedTitle, ok := a.templateConfig.Preparation[lang]; ok {
				stubTitle = translatedTitle
			}
		} else if req.TemplateID != "" {
			// If a template was used, use its translation from config
			if template, ok := templateMap[req.TemplateID]; ok {
				if translatedTitle, ok := template[lang]; ok {
					stubTitle = translatedTitle
				}
			}
		}

		// Translate source titles to the target language
		translatedSources := make([]storage.Source, len(part.Sources))
		for i, source := range part.Sources {
			// Fetch the source title in the target language
			sourceTitle, err := a.kabbalahmediaClient.GetSourceTitle(source.SourceID, lang)
			if err != nil {
				// If fetch fails, use the original title
				fmt.Printf("Warning: Failed to get source title for %s in %s: %v\n", source.SourceID, lang, err)
				translatedSources[i] = source
			} else {
				// Use the ORIGINAL kabbalahmedia URL, not the edited one
				originalURL := fmt.Sprintf("https://kabbalahmedia.info/sources/%s", source.SourceID)
				translatedSources[i] = storage.Source{
					SourceID:    source.SourceID,
					SourceTitle: sourceTitle,
					SourceURL:   originalURL, // Always use original kabbalahmedia URL
					PageNumber:  source.PageNumber,
					StartPoint:  source.StartPoint, // Copy start point
					EndPoint:    source.EndPoint,   // Copy end point
				}
			}
		}

		translationStub := &storage.LessonPart{
			Title:       stubTitle,
			Description: "", // Empty, to be filled by translator
			Date:        part.Date,
			PartType:    part.PartType,
			Language:    lang,
			EventID:     part.EventID,
			Order:       part.Order,
			// Copy shared links (same across languages)
			ExcerptsLink:           part.ExcerptsLink,
			TranscriptLink:         part.TranscriptLink,
			LessonLink:             part.LessonLink,
			ProgramLink:            part.ProgramLink,
			ReadingBeforeSleepLink: part.ReadingBeforeSleepLink,
			LessonPreparationLink:  part.LessonPreparationLink,
			RecordedLessonDate:     part.RecordedLessonDate, // Copy recorded lesson date
			// Use translated sources (same IDs, different titles)
			Sources: translatedSources,
		}

		if err := a.store.SavePart(translationStub); err != nil {
			// Log error but don't fail the request
			fmt.Printf("Warning: Failed to create %s translation stub: %v\n", lang, err)
		}
	}

	// Return created part
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(part)
}

// HandleGetPart retrieves a lesson part by ID (POC)
func (a *App) HandleGetPart(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	part, err := a.store.GetPart(id)
	if err != nil {
		http.Error(w, fmt.Sprintf("Part not found: %v", err), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(part)
}

// HandleUpdatePart updates an existing lesson part (all fields)
func (a *App) HandleUpdatePart(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	partID := vars["id"]

	// Get existing part
	existingPart, err := a.store.GetPart(partID)
	if err != nil {
		http.Error(w, "Part not found", http.StatusNotFound)
		return
	}

	// Parse update request
	var req storage.CreatePartRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Store old shared links to detect changes
	oldExcerptsLink := existingPart.ExcerptsLink
	oldTranscriptLink := existingPart.TranscriptLink
	oldLessonLink := existingPart.LessonLink
	oldProgramLink := existingPart.ProgramLink
	oldReadingBeforeSleepLink := existingPart.ReadingBeforeSleepLink
	oldLessonPreparationLink := existingPart.LessonPreparationLink
	oldRecordedLessonDate := existingPart.RecordedLessonDate

	// Update all editable fields
	existingPart.Title = req.Title
	existingPart.Description = req.Description
	existingPart.Order = req.Order
	existingPart.Sources = req.Sources
	existingPart.ExcerptsLink = req.ExcerptsLink
	existingPart.TranscriptLink = req.TranscriptLink
	existingPart.LessonLink = req.LessonLink
	existingPart.ProgramLink = req.ProgramLink
	existingPart.ReadingBeforeSleepLink = req.ReadingBeforeSleepLink
	existingPart.LessonPreparationLink = req.LessonPreparationLink
	existingPart.RecordedLessonDate = req.RecordedLessonDate
	existingPart.CustomLinks = req.CustomLinks

	// Parse and update date if provided
	if req.Date != "" {
		date, err := time.Parse("2006-01-02", req.Date)
		if err == nil {
			existingPart.Date = date
		}
	}

	// Don't change: ID, language, event_id, created_at

	if err := a.store.SavePart(existingPart); err != nil {
		http.Error(w, fmt.Sprintf("Failed to update part: %v", err), http.StatusInternalServerError)
		return
	}

	// If any shared links changed, update them in all language versions of the same part
	if existingPart.EventID != "" && (
		oldExcerptsLink != req.ExcerptsLink ||
		oldTranscriptLink != req.TranscriptLink ||
		oldLessonLink != req.LessonLink ||
		oldProgramLink != req.ProgramLink ||
		oldReadingBeforeSleepLink != req.ReadingBeforeSleepLink ||
		oldLessonPreparationLink != req.LessonPreparationLink ||
		oldRecordedLessonDate != req.RecordedLessonDate) {

		// Get all parts for this event
		allParts, err := a.store.ListParts()
		if err == nil {
			for _, part := range allParts {
				// Find other language versions of the same part (same event_id and order)
				if part.EventID == existingPart.EventID &&
					part.Order == existingPart.Order &&
					part.Language != existingPart.Language {
					// Update shared links in other languages
					part.ExcerptsLink = req.ExcerptsLink
					part.TranscriptLink = req.TranscriptLink
					part.LessonLink = req.LessonLink
					part.ProgramLink = req.ProgramLink
					part.ReadingBeforeSleepLink = req.ReadingBeforeSleepLink
					part.LessonPreparationLink = req.LessonPreparationLink
					part.RecordedLessonDate = req.RecordedLessonDate

					if err := a.store.SavePart(part); err != nil {
						fmt.Printf("Warning: Failed to update %s translation: %v\n", part.Language, err)
					}
				}
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(existingPart)
}

// HandleListParts lists all lesson parts (POC)
func (a *App) HandleListParts(w http.ResponseWriter, r *http.Request) {
	parts, err := a.store.ListParts()
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to list parts: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"parts": parts,
		"total": len(parts),
	})
}

// HandleGetEventParts retrieves all parts for a specific event
func (a *App) HandleGetEventParts(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	eventID := vars["event_id"]

	// Get language filter from query param (optional)
	languageFilter := r.URL.Query().Get("language")

	// Verify event exists
	_, err := a.eventStore.GetEvent(eventID)
	if err != nil {
		http.Error(w, "Event not found", http.StatusNotFound)
		return
	}

	// Get all parts and filter by event_id
	allParts, err := a.store.ListParts()
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to list parts: %v", err), http.StatusInternalServerError)
		return
	}

	var eventParts []*storage.LessonPart
	for _, part := range allParts {
		if part.EventID == eventID {
			// Apply language filter if provided
			if languageFilter == "" || part.Language == languageFilter {
				eventParts = append(eventParts, part)
			}
		}
	}

	// Sort by order, then by language for consistent ordering
	sort.Slice(eventParts, func(i, j int) bool {
		if eventParts[i].Order != eventParts[j].Order {
			return eventParts[i].Order < eventParts[j].Order
		}
		return eventParts[i].Language < eventParts[j].Language
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"parts": eventParts,
		"total": len(eventParts),
	})
}
