package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/Bnei-Baruch/study-material-service/storage"
	"github.com/gorilla/mux"
)

// HandleCreatePart creates a new lesson part (POC)
func (a *App) HandleCreatePart(w http.ResponseWriter, r *http.Request) {
	bodyBytes, _ := io.ReadAll(r.Body)
	fmt.Printf("=== CREATE PART REQUEST ===\n%s\n===========================\n", string(bodyBytes))
	r.Body = io.NopCloser(strings.NewReader(string(bodyBytes)))

	var req storage.CreatePartRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.Order == nil {
		fmt.Printf("DECODED: order=nil\n")
	} else {
		fmt.Printf("DECODED: order=%d\n", *req.Order)
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
		partType = "live_lesson"
	}
	if partType != "live_lesson" && partType != "recorded_lesson" {
		http.Error(w, "Invalid part_type, must be 'live_lesson' or 'recorded_lesson'", http.StatusBadRequest)
		return
	}

	// Default and validate language
	language := req.Language
	if language == "" {
		language = "he"
	}
	if len(language) != 2 {
		http.Error(w, "Invalid language code, must be 2-letter ISO 639-1 code", http.StatusBadRequest)
		return
	}

	// If event_id is provided, verify event exists and check if it's a lesson event
	isLessonEvent := false
	if req.EventID != "" {
		event, err := a.eventStore.GetEvent(req.EventID)
		if err != nil {
			http.Error(w, "Event not found", http.StatusNotFound)
			return
		}
		isLessonEvent = event.Type == "morning_lesson" || event.Type == "noon_lesson" || event.Type == "evening_lesson"
	}

	// Validate Order is required for lesson events
	if isLessonEvent && req.Order == nil {
		http.Error(w, "Order (part number) is required for lesson events", http.StatusBadRequest)
		return
	}

	// Calculate next position if not provided (position 0 means auto-assign)
	position := req.Position
	if position == 0 && req.EventID != "" {
		allParts, err := a.store.ListParts()
		if err == nil {
			maxPosition := 0
			for _, p := range allParts {
				if p.EventID == req.EventID && p.Position > maxPosition {
					maxPosition = p.Position
				}
			}
			position = maxPosition + 1
		} else {
			position = 1
		}
	} else if position == 0 {
		position = 1
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
		Position:               position,
		ExcerptsLink:           req.ExcerptsLink,
		TranscriptLink:         req.TranscriptLink,
		LessonLink:             req.LessonLink,
		ProgramLink:            req.ProgramLink,
		ReadingBeforeSleepLink: req.ReadingBeforeSleepLink,
		LessonPreparationLink:  req.LessonPreparationLink,
		LineupForHostsLink:     req.LineupForHostsLink,
		RecordedLessonDate:     req.RecordedLessonDate,
		StartTime:              req.StartTime,
		EndTime:                req.EndTime,
		Sources:                req.Sources,
		CustomLinks:            req.CustomLinks,
	}

	if err := a.store.SavePart(part); err != nil {
		http.Error(w, fmt.Sprintf("Failed to save part: %v", err), http.StatusInternalServerError)
		return
	}

	// Auto-create translation stubs for other languages
	supportedLanguages := a.templateConfig.Languages

	templateMap := make(map[string]map[string]string)
	for _, tmpl := range a.templateConfig.Templates {
		templateMap[tmpl.ID] = tmpl.Translations
	}

	for _, lang := range supportedLanguages {
		if lang == part.Language {
			continue
		}

		// Determine title for translation stub
		stubTitle := "[Translation needed]"
		if part.Order != nil && *part.Order == 0 {
			// For preparation parts, use translated title from config
			if translatedTitle, ok := a.templateConfig.Preparation[lang]; ok {
				stubTitle = translatedTitle
			}
		} else if req.TemplateID != "" {
			if template, ok := templateMap[req.TemplateID]; ok {
				if translatedTitle, ok := template[lang]; ok {
					stubTitle = translatedTitle
				}
			}
		}

		// Translate source titles to the target language
		translatedSources := make([]storage.Source, len(part.Sources))
		for i, source := range part.Sources {
			sourceTitle, err := a.kabbalahmediaClient.GetSourceTitle(source.SourceID, lang)
			if err != nil {
				fmt.Printf("Warning: Failed to get source title for %s in %s: %v\n", source.SourceID, lang, err)
				translatedSources[i] = source
			} else {
				originalURL := fmt.Sprintf("https://kabbalahmedia.info/sources/%s", source.SourceID)
				translatedSources[i] = storage.Source{
					SourceID:    source.SourceID,
					SourceTitle: sourceTitle,
					SourceURL:   originalURL,
				}
			}
		}

		translationStub := &storage.LessonPart{
			Title:                  stubTitle,
			Description:            "",
			Date:                   part.Date,
			PartType:               part.PartType,
			Language:               lang,
			EventID:                part.EventID,
			Order:                  part.Order,
			Position:               part.Position,
			ExcerptsLink:           part.ExcerptsLink,
			TranscriptLink:         part.TranscriptLink,
			LessonLink:             part.LessonLink,
			ProgramLink:            part.ProgramLink,
			ReadingBeforeSleepLink: part.ReadingBeforeSleepLink,
			LessonPreparationLink:  part.LessonPreparationLink,
			LineupForHostsLink:     part.LineupForHostsLink,
			RecordedLessonDate:     part.RecordedLessonDate,
			StartTime:              part.StartTime,
			EndTime:                part.EndTime,
			Sources:                translatedSources,
		}

		if err := a.store.SavePart(translationStub); err != nil {
			fmt.Printf("Warning: Failed to create %s translation stub: %v\n", lang, err)
		}
	}

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

	existingPart, err := a.store.GetPart(partID)
	if err != nil {
		http.Error(w, "Part not found", http.StatusNotFound)
		return
	}

	var req storage.CreatePartRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Update all editable fields
	existingPart.Title = req.Title
	existingPart.Description = req.Description
	existingPart.Order = req.Order
	existingPart.Position = req.Position
	existingPart.Sources = req.Sources
	existingPart.ExcerptsLink = req.ExcerptsLink
	existingPart.TranscriptLink = req.TranscriptLink
	existingPart.LessonLink = req.LessonLink
	existingPart.ProgramLink = req.ProgramLink
	existingPart.ReadingBeforeSleepLink = req.ReadingBeforeSleepLink
	existingPart.LessonPreparationLink = req.LessonPreparationLink
	existingPart.LineupForHostsLink = req.LineupForHostsLink
	existingPart.RecordedLessonDate = req.RecordedLessonDate
	existingPart.StartTime = req.StartTime
	existingPart.EndTime = req.EndTime
	existingPart.CustomLinks = req.CustomLinks

	if req.Date != "" {
		date, err := time.Parse("2006-01-02", req.Date)
		if err == nil {
			existingPart.Date = date
		}
	}

	if err := a.store.SavePart(existingPart); err != nil {
		http.Error(w, fmt.Sprintf("Failed to update part: %v", err), http.StatusInternalServerError)
		return
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

	languageFilter := r.URL.Query().Get("language")

	_, err := a.eventStore.GetEvent(eventID)
	if err != nil {
		http.Error(w, "Event not found", http.StatusNotFound)
		return
	}

	allParts, err := a.store.ListParts()
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to list parts: %v", err), http.StatusInternalServerError)
		return
	}

	var eventParts []*storage.LessonPart
	for _, part := range allParts {
		if part.EventID == eventID {
			if languageFilter == "" || part.Language == languageFilter {
				eventParts = append(eventParts, part)
			}
		}
	}

	// Sort by position, then by language
	sort.Slice(eventParts, func(i, j int) bool {
		if eventParts[i].Position != eventParts[j].Position {
			return eventParts[i].Position < eventParts[j].Position
		}
		return eventParts[i].Language < eventParts[j].Language
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"parts": eventParts,
		"total": len(eventParts),
	})
}
