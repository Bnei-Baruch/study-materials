package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/Bnei-Baruch/study-material-service/storage"
	"github.com/gorilla/mux"
)

// DuplicateEventRequest represents the request to duplicate an event
type DuplicateEventRequest struct {
	NewDate string `json:"new_date"` // YYYY-MM-DD format
}

// HandleDuplicateEvent duplicates an event and all its parts to a new date
func (a *App) HandleDuplicateEvent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	eventID := vars["id"]

	// Parse request body
	var req DuplicateEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Parse new date
	newDate, err := time.Parse("2006-01-02", req.NewDate)
	if err != nil {
		http.Error(w, "Invalid date format, use YYYY-MM-DD", http.StatusBadRequest)
		return
	}

	// Get original event
	originalEvent, err := a.eventStore.GetEvent(eventID)
	if err != nil {
		http.Error(w, "Event not found", http.StatusNotFound)
		return
	}

	// Create new event with the new date
	newEvent := &storage.Event{
		Date:   newDate,
		Type:   originalEvent.Type,
		Number: originalEvent.Number,
		Order:  originalEvent.Order,  // Copy order
		Titles: originalEvent.Titles, // Copy titles
		Public: originalEvent.Public,
	}

	if err := a.eventStore.SaveEvent(newEvent); err != nil {
		http.Error(w, fmt.Sprintf("Failed to create duplicate event: %v", err), http.StatusInternalServerError)
		return
	}

	// Get all parts for the original event
	allParts, err := a.store.ListParts()
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to list parts: %v", err), http.StatusInternalServerError)
		return
	}

	// Duplicate all parts (all languages)
	duplicatedParts := 0
	for _, originalPart := range allParts {
		if originalPart.EventID == eventID {
			// Create a copy with new event ID
			newPart := &storage.LessonPart{
				Title:                  originalPart.Title,
				Description:            originalPart.Description,
				Date:                   newDate,
				PartType:               originalPart.PartType,
				Language:               originalPart.Language,
				EventID:                newEvent.ID,
				Order:                  originalPart.Order,
				ExcerptsLink:           originalPart.ExcerptsLink,
				TranscriptLink:         originalPart.TranscriptLink,
				LessonLink:             originalPart.LessonLink,
				ProgramLink:            originalPart.ProgramLink,
				ReadingBeforeSleepLink: originalPart.ReadingBeforeSleepLink,
				LessonPreparationLink:  originalPart.LessonPreparationLink,
				RecordedLessonDate:     originalPart.RecordedLessonDate,
				Sources:                originalPart.Sources,
				CustomLinks:            originalPart.CustomLinks,
			}

			if err := a.store.SavePart(newPart); err != nil {
				fmt.Printf("Warning: Failed to duplicate part %s: %v\n", originalPart.ID, err)
			} else {
				duplicatedParts++
			}
		}
	}

	fmt.Printf("Duplicated event %s to %s with %d parts\n", eventID, newEvent.ID, duplicatedParts)

	// Return the new event
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(newEvent)
}
