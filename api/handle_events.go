package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/Bnei-Baruch/study-material-service/storage"
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/bson"
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

// HandleListEvents lists all events with optional filtering
// Query parameters:
//   - public (bool): filter by public status (e.g., ?public=true)
//   - limit (int): maximum number of results (e.g., ?limit=10)
//   - offset (int): offset for pagination (e.g., ?offset=20)
//   - from_date (string): filter events from this date (YYYY-MM-DD)
//   - to_date (string): filter events until this date (YYYY-MM-DD)
func (a *App) HandleListEvents(w http.ResponseWriter, r *http.Request) {
	queryParams := r.URL.Query()

	// Parse query parameters
	var publicFilter *bool
	if publicStr := queryParams.Get("public"); publicStr != "" {
		if publicStr == "true" {
			trueVal := true
			publicFilter = &trueVal
		} else if publicStr == "false" {
			falseVal := false
			publicFilter = &falseVal
		}
	}

	limit := 0
	if limitStr := queryParams.Get("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	offset := 0
	if offsetStr := queryParams.Get("offset"); offsetStr != "" {
		if parsedOffset, err := strconv.Atoi(offsetStr); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	fromDate := queryParams.Get("from_date")
	toDate := queryParams.Get("to_date")

	// Build MongoDB filter
	filter := bson.M{}

	if publicFilter != nil {
		filter["public"] = *publicFilter
	}

	// Date range filter
	if fromDate != "" || toDate != "" {
		dateFilter := bson.M{}
		if fromDate != "" {
			// Parse date and set to start of day
			if parsedDate, err := time.Parse("2006-01-02", fromDate); err == nil {
				dateFilter["$gte"] = parsedDate
			}
		}
		if toDate != "" {
			// Parse date and set to end of day
			if parsedDate, err := time.Parse("2006-01-02", toDate); err == nil {
				// Add 24 hours to include the entire end date
				dateFilter["$lte"] = parsedDate.Add(24 * time.Hour)
			}
		}
		if len(dateFilter) > 0 {
			filter["date"] = dateFilter
		}
	}

	// Use filtered query
	events, total, err := a.eventStore.ListEventsFiltered(filter, limit, offset)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to list events: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"events":   events,
		"total":    total,
		"returned": len(events),
		"limit":    limit,
		"offset":   offset,
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

