package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/Bnei-Baruch/study-material-service/storage"
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/bson"
)

func splitAndTrim(s string) []string {
	parts := strings.Split(s, ",")
	result := make([]string, 0, len(parts))
	for _, p := range parts {
		if t := strings.TrimSpace(p); t != "" {
			result = append(result, t)
		}
	}
	return result
}

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

	// Validate and default type using database
	if req.Type == "" {
		req.Type = "morning_lesson" // Default
	}
	eventTypeDef, err := a.eventTypeStore.GetEventTypeByName(req.Type)
	if err != nil {
		http.Error(w, fmt.Sprintf("Invalid event type: %s", req.Type), http.StatusBadRequest)
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

	// Generate default titles from the database event type definition
	titles := make(map[string]string)
	for lang, title := range eventTypeDef.Titles {
		titles[lang] = title
	}

	// Merge user-provided titles with defaults (user overrides take precedence)
	if req.Titles != nil {
		for lang, title := range req.Titles {
			if title != "" {
				titles[lang] = title
			}
		}
	}

	// Parse optional end date
	var endDate *time.Time
	if req.EndDate != "" {
		if parsed, err := time.Parse("2006-01-02", req.EndDate); err == nil {
			endDate = &parsed
		}
	}

	// Determine hide_from_lessons_tab: explicit value wins; otherwise auto-hide when parent is set
	hideFromLessonsTab := false
	if req.HideFromLessonsTab != nil {
		hideFromLessonsTab = *req.HideFromLessonsTab
	} else if req.ParentEventID != "" {
		hideFromLessonsTab = true
	}

	// Create event
	event := &storage.Event{
		Date:               date,
		StartTime:          req.StartTime,
		EndTime:            req.EndTime,
		Type:               req.Type,
		Number:             req.Number,
		Order:              order,
		Titles:             titles,
		Public:             isPublic,
		EndDate:            endDate,
		ParentEventID:      req.ParentEventID,
		HideFromLessonsTab: hideFromLessonsTab,
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
//   - types (string): comma-separated event types to include (e.g., ?types=convention,holiday)
//   - exclude_types (string): comma-separated event types to exclude
//   - parent_id (string): filter by parent event ID (sessions of a convention)
//   - hide_from_lessons_tab (bool): filter by hide_from_lessons_tab flag
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
			if parsedDate, err := time.Parse("2006-01-02", fromDate); err == nil {
				dateFilter["$gte"] = parsedDate
			}
		}
		if toDate != "" {
			if parsedDate, err := time.Parse("2006-01-02", toDate); err == nil {
				dateFilter["$lte"] = parsedDate.Add(24 * time.Hour)
			}
		}
		if len(dateFilter) > 0 {
			filter["date"] = dateFilter
		}
	}

	// Type inclusion filter (?types=convention,holiday,special_event)
	if typesStr := queryParams.Get("types"); typesStr != "" {
		types := splitAndTrim(typesStr)
		if len(types) > 0 {
			filter["type"] = bson.M{"$in": types}
		}
	}

	// Type exclusion filter (?exclude_types=convention,holiday,special_event)
	if excludeTypesStr := queryParams.Get("exclude_types"); excludeTypesStr != "" {
		types := splitAndTrim(excludeTypesStr)
		if len(types) > 0 {
			filter["type"] = bson.M{"$nin": types}
		}
	}

	// Parent event filter (?parent_id=abc123)
	if parentID := queryParams.Get("parent_id"); parentID != "" {
		filter["parent_event_id"] = parentID
	}

	// Hide from lessons tab filter (?hide_from_lessons_tab=true)
	if hideStr := queryParams.Get("hide_from_lessons_tab"); hideStr != "" {
		if hideStr == "true" {
			filter["hide_from_lessons_tab"] = true
		} else if hideStr == "false" {
			filter["hide_from_lessons_tab"] = bson.M{"$in": []interface{}{false, nil}}
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
			"tr": "Sabah Dersi",
			"pt-BR": "Aula da Manhã",
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
			"tr": "Öğlen Dersi",
			"pt-BR": "Aula do Meio-dia",
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
			"tr": "Akşam Dersi",
			"pt-BR": "Aula da Noite",
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
			"tr": "Yemek",
			"pt-BR": "Refeição",
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
			"tr": "Kongre",
			"pt-BR": "Congresso",
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
			"tr": "Ders",
			"pt-BR": "Palestra",
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
			"tr": "Diğer",
			"pt-BR": "Outro",
		},
	}

	if titles, ok := defaults[eventType]; ok {
		return titles
	}
	// Fallback to morning_lesson if type is unknown
	return defaults["morning_lesson"]
}
