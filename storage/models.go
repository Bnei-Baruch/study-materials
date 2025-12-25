package storage

import "time"

// LessonPart represents a lesson part with title, description, date, type, language, and sources
type LessonPart struct {
	ID                     string       `json:"id"`
	Title                  string       `json:"title"`
	Description            string       `json:"description"`
	Date                   time.Time    `json:"date"`
	PartType               string       `json:"part_type"`                           // "live_lesson" or "recorded_lesson"
	Language               string       `json:"language"`                            // ISO 639-1 code (e.g., "he", "en", "ru")
	EventID                string       `json:"event_id,omitempty"`                  // Optional: links part to an event
	Order                  int          `json:"order"`                               // Position within event (0=preparation, 1, 2, 3...)
	ExcerptsLink           string       `json:"excerpts_link,omitempty"`             // Optional: link to selected excerpts
	TranscriptLink         string       `json:"transcript_link,omitempty"`           // Optional: link to transcript
	LessonLink             string       `json:"lesson_link,omitempty"`               // Optional: kabbalahmedia lesson URL
	ProgramLink            string       `json:"program_link,omitempty"`              // Optional: link to program
	ReadingBeforeSleepLink string       `json:"reading_before_sleep_link,omitempty"` // Optional: for preparation parts (order=0)
	LessonPreparationLink  string       `json:"lesson_preparation_link,omitempty"`   // Optional: for preparation parts (order=0)
	RecordedLessonDate     string       `json:"recorded_lesson_date,omitempty"`      // Optional: date the recorded lesson was given (YYYY-MM-DD)
	Sources                []Source     `json:"sources"`
	CustomLinks            []CustomLink `json:"custom_links,omitempty"` // Optional: custom links with titles (language-specific)
	CreatedAt              time.Time    `json:"created_at"`
}

// Source represents a study source from kabbalahmedia
type Source struct {
	SourceID    string `json:"source_id"`
	SourceTitle string `json:"source_title"`
	SourceURL   string `json:"source_url"`
	PageNumber  string `json:"page_number,omitempty"` // Optional: page in source (e.g., "42", "15-17")
}

// CustomLink represents a custom link with a custom title (language-specific)
type CustomLink struct {
	Title string `json:"title"`
	URL   string `json:"url"`
}

// CreatePartRequest is the request body for creating a part
type CreatePartRequest struct {
	Title                  string       `json:"title"`
	Description            string       `json:"description"`
	Date                   string       `json:"date"`                                // ISO format: YYYY-MM-DD
	PartType               string       `json:"part_type"`                           // "live_lesson" or "recorded_lesson", defaults to "live_lesson"
	Language               string       `json:"language"`                            // ISO 639-1 code, defaults to "he"
	EventID                string       `json:"event_id,omitempty"`                  // Optional: links part to an event
	Order                  int          `json:"order"`                               // Position within event (0=preparation, 1, 2, 3...)
	TemplateID             string       `json:"template_id,omitempty"`               // Optional: ID of template used (for auto-translating)
	ExcerptsLink           string       `json:"excerpts_link,omitempty"`             // Optional: link to selected excerpts
	TranscriptLink         string       `json:"transcript_link,omitempty"`           // Optional: link to transcript
	LessonLink             string       `json:"lesson_link,omitempty"`               // Optional: kabbalahmedia lesson URL
	ProgramLink            string       `json:"program_link,omitempty"`              // Optional: link to program
	ReadingBeforeSleepLink string       `json:"reading_before_sleep_link,omitempty"` // Optional: for preparation parts (order=0)
	LessonPreparationLink  string       `json:"lesson_preparation_link,omitempty"`   // Optional: for preparation parts (order=0)
	RecordedLessonDate     string       `json:"recorded_lesson_date,omitempty"`      // Optional: date the recorded lesson was given (YYYY-MM-DD)
	Sources                []Source     `json:"sources"`
	CustomLinks            []CustomLink `json:"custom_links,omitempty"` // Optional: custom links with titles (language-specific)
}

// Event represents a study event (morning lesson, noon lesson, evening lesson, meal, convention, etc.)
type Event struct {
	ID        string            `json:"id"`
	Date      time.Time         `json:"date"`             // Event date
	Type      string            `json:"type"`             // "morning_lesson", "noon_lesson", "evening_lesson", "meal", "convention", "lecture", "other"
	Number    int               `json:"number"`           // Event number for same day (1, 2, ...)
	Order     int               `json:"order"`            // Display order (lower numbers appear first)
	Titles    map[string]string `json:"titles,omitempty"` // Multi-language titles (he, en, ru, es, de, it, fr, uk)
	Public    bool              `json:"public"`           // Whether event is public
	CreatedAt time.Time         `json:"created_at"`
}

// CreateEventRequest is the request body for creating an event
type CreateEventRequest struct {
	Date   string            `json:"date"`             // ISO format: YYYY-MM-DD
	Type   string            `json:"type"`             // Event type, defaults to "morning_lesson"
	Number int               `json:"number"`           // Event number, defaults to 1
	Order  *int              `json:"order,omitempty"`  // Optional: display order (defaults to 0)
	Titles map[string]string `json:"titles,omitempty"` // Optional: custom titles for the event (he, en, ru, es, de, it, fr, uk)
	Public *bool             `json:"public,omitempty"` // Whether event is public, defaults to false
}
