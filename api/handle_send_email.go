package api

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/mux"
)

type SendEmailRequest struct {
	IsUpdate bool `json:"is_update"`
}

// HandleSendEventEmail sends an email notification for an event to the configured Google Group
func (a *App) HandleSendEventEmail(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	eventID := vars["id"]

	// Parse request body
	var req SendEmailRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		// If no body or invalid JSON, assume it's not an update (initial send)
		req.IsUpdate = false
	}

	// Get event from database
	event, err := a.eventStore.GetEvent(eventID)
	if err != nil {
		http.Error(w, "Event not found", http.StatusNotFound)
		return
	}

	// Check if email already sent (only block initial send, not updates)
	if event.EmailSentAt != nil && !req.IsUpdate {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"already_sent": true,
			"sent_at":      event.EmailSentAt,
		})
		return
	}

	// Get event titles for all supported languages
	titleHe := event.Titles["he"]
	if titleHe == "" {
		titleHe = getDefaultTitle(event.Type, "he")
	}

	titleEn := event.Titles["en"]
	if titleEn == "" {
		titleEn = getDefaultTitle(event.Type, "en")
	}

	titleEs := event.Titles["es"]
	if titleEs == "" {
		titleEs = getDefaultTitle(event.Type, "es")
	}

	titleRu := event.Titles["ru"]
	if titleRu == "" {
		titleRu = getDefaultTitle(event.Type, "ru")
	}

	// Send email
	err = a.emailService.SendEventEmail(eventID, titleHe, titleEn, titleEs, titleRu, event.Date, event.StartTime, event.EndTime, req.IsUpdate)
	if err != nil {
		log.Printf("Failed to send email for event %s: %v", eventID, err)
		http.Error(w, fmt.Sprintf("Failed to send email: %v", err), http.StatusInternalServerError)
		return
	}

	// Update email_sent_at timestamp only on initial send
	now := time.Now()
	if event.EmailSentAt == nil {
		event.EmailSentAt = &now

		// Save updated event
		err = a.eventStore.SaveEvent(event)
		if err != nil {
			log.Printf("Failed to update event after sending email: %v", err)
			// Email was sent, so still return success
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":   true,
		"sent_at":   event.EmailSentAt,
		"is_update": req.IsUpdate,
	})
}

// Helper function for default titles
func getDefaultTitle(eventType, lang string) string {
	defaults := map[string]map[string]string{
		"morning_lesson": {
			"he": "שיעור בוקר",
			"en": "Morning Lesson",
			"es": "Lección Matutina",
			"ru": "Утренний Урок",
		},
		"noon_lesson": {
			"he": "שיעור צהריים",
			"en": "Noon Lesson",
			"es": "Lección del Mediodía",
			"ru": "Полуденный Урок",
		},
		"evening_lesson": {
			"he": "שיעור ערב",
			"en": "Evening Lesson",
			"es": "Lección Vespertina",
			"ru": "Вечерний Урок",
		},
		"meal": {
			"he": "ארוחה",
			"en": "Meal",
			"es": "Comida",
			"ru": "Трапеза",
		},
		"convention": {
			"he": "קונוונציה",
			"en": "Convention",
			"es": "Convención",
			"ru": "Конвенция",
		},
		"lecture": {
			"he": "הרצאה",
			"en": "Lecture",
			"es": "Conferencia",
			"ru": "Лекция",
		},
	}
	titles, ok := defaults[eventType]
	if !ok {
		titles = defaults["morning_lesson"] // Fallback
	}
	return titles[lang]
}




