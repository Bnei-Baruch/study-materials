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

// HandleCreateEvent creates a new event
func (a *App) HandleCreateEvent(w http.ResponseWriter, r *http.Request) {
	var req storage.CreateEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate date
	if req.Date == "" {
		http.Error(w, "Date is required", http.StatusBadRequest)
		return
	}

	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		http.Error(w, "Invalid date format, use YYYY-MM-DD", http.StatusBadRequest)
		return
	}

	// Validate and default type
	if req.Type == "" {
		req.Type = "morning_lesson" // Default
	}
	validTypes := []string{"morning_lesson", "noon_lesson", "evening_lesson", "meal", "convention", "lecture", "other"}
	valid := false
	for _, t := range validTypes {
		if req.Type == t {
			valid = true
			break
		}
	}
	if !valid {
		http.Error(w, "Invalid event type, must be one of: morning_lesson, noon_lesson, evening_lesson, meal, convention, lecture, other", http.StatusBadRequest)
		return
	}

	// Default number to 1
	if req.Number == 0 {
		req.Number = 1
	}

	// Default public to false
	isPublic := false
	if req.Public != nil {
		isPublic = *req.Public
	}

	// Default order to 0
	order := 0
	if req.Order != nil {
		order = *req.Order
	}

	// Generate default titles for the event type
	titles := getDefaultTitles(req.Type)

	// Merge user-provided titles with defaults (user overrides take precedence)
	if req.Titles != nil {
		for lang, title := range req.Titles {
			if title != "" {
				titles[lang] = title
			}
		}
	}

	// Create event
	event := &storage.Event{
		Date:   date,
		Type:   req.Type,
		Number: req.Number,
		Order:  order,
		Titles: titles,
		Public: isPublic,
	}

	if err := a.eventStore.SaveEvent(event); err != nil {
		http.Error(w, fmt.Sprintf("Failed to save event: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(event)
}

// HandleGetEvent retrieves an event by ID
func (a *App) HandleGetEvent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	event, err := a.eventStore.GetEvent(id)
	if err != nil {
		http.Error(w, fmt.Sprintf("Event not found: %v", err), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(event)
}

// HandleListEvents lists all events sorted by order (asc) and date (desc)
func (a *App) HandleListEvents(w http.ResponseWriter, r *http.Request) {
	events, err := a.eventStore.ListEvents()
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to list events: %v", err), http.StatusInternalServerError)
		return
	}

	// Sort events by order (ascending), then by date (descending)
	// Events with lower order numbers appear first
	// Within same order, newer dates appear first
	sort.Slice(events, func(i, j int) bool {
		if events[i].Order != events[j].Order {
			return events[i].Order < events[j].Order
		}
		return events[i].Date.After(events[j].Date)
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"events": events,
		"total":  len(events),
	})
}

// getDefaultTitles returns default titles for an event type in all supported languages
func getDefaultTitles(eventType string) map[string]string {
	defaults := map[string]map[string]string{
		"morning_lesson": {
			"he": "שיעור בוקר",
			"en": "Morning Lesson",
			"ru": "Утренний урок",
			"es": "Lección matutina",
			"de": "Morgenlektion",
			"it": "Lezione mattutina",
			"fr": "Leçon du matin",
			"uk": "Ранковий урок",
		},
		"noon_lesson": {
			"he": "שיעור צהריים",
			"en": "Noon Lesson",
			"ru": "Дневной урок",
			"es": "Lección del mediodía",
			"de": "Mittagslektion",
			"it": "Lezione di mezzogiorno",
			"fr": "Leçon de midi",
			"uk": "Денний урок",
		},
		"evening_lesson": {
			"he": "שיעור ערב",
			"en": "Evening Lesson",
			"ru": "Вечерний урок",
			"es": "Lección nocturna",
			"de": "Abendlektion",
			"it": "Lezione serale",
			"fr": "Leçon du soir",
			"uk": "Вечірній урок",
		},
		"meal": {
			"he": "סעודה",
			"en": "Meal",
			"ru": "Трапеза",
			"es": "Comida",
			"de": "Mahlzeit",
			"it": "Pasto",
			"fr": "Repas",
			"uk": "Трапеза",
		},
		"convention": {
			"he": "כנס",
			"en": "Convention",
			"ru": "Конгресс",
			"es": "Congreso",
			"de": "Kongress",
			"it": "Congresso",
			"fr": "Congrès",
			"uk": "Конгрес",
		},
		"lecture": {
			"he": "הרצאה",
			"en": "Lecture",
			"ru": "Лекция",
			"es": "Conferencia",
			"de": "Vortrag",
			"it": "Conferenza",
			"fr": "Conférence",
			"uk": "Лекція",
		},
		"other": {
			"he": "אחר",
			"en": "Other",
			"ru": "Другое",
			"es": "Otro",
			"de": "Andere",
			"it": "Altro",
			"fr": "Autre",
			"uk": "Інше",
		},
	}

	if titles, ok := defaults[eventType]; ok {
		return titles
	}
	// Fallback to morning_lesson if type is unknown
	return defaults["morning_lesson"]
}
