package storage

import "time"

// LessonPart represents a lesson part with title, description, date, type, language, and sources
type LessonPart struct {
	ID                     string       `json:"id" bson:"_id"`
	Title                  string       `json:"title" bson:"title"`
	Description            string       `json:"description" bson:"description"`
	Date                   time.Time    `json:"date" bson:"date"`
	PartType               string       `json:"part_type" bson:"part_type"`                                                     // "live_lesson" or "recorded_lesson"
	Language               string       `json:"language" bson:"language"`                                                       // ISO 639-1 code (e.g., "he", "en", "ru")
	EventID                string       `json:"event_id,omitempty" bson:"event_id,omitempty"`                                   // Optional: links part to an event
	PartNumber             *int         `json:"part_number" bson:"part_number"`                                                 // nil=legacy (display falls back to order), 0=Preparation, 1+=Part N
	Order                  int          `json:"order" bson:"order"`                                                             // Sort position within event (auto-assigned)
	ExcerptsLink           string       `json:"excerpts_link,omitempty" bson:"excerpts_link,omitempty"`                         // Optional: link to selected excerpts
	TranscriptLink         string       `json:"transcript_link,omitempty" bson:"transcript_link,omitempty"`                     // Optional: link to transcript
	LessonLink             string       `json:"lesson_link,omitempty" bson:"lesson_link,omitempty"`                             // Optional: kabbalahmedia lesson URL
	ProgramLink            string       `json:"program_link,omitempty" bson:"program_link,omitempty"`                           // Optional: link to program
	ReadingBeforeSleepLink string       `json:"reading_before_sleep_link,omitempty" bson:"reading_before_sleep_link,omitempty"` // Optional: for preparation parts (order=0)
	LessonPreparationLink  string       `json:"lesson_preparation_link,omitempty" bson:"lesson_preparation_link,omitempty"`     // Optional: for preparation parts (order=0)
	LineupForHostsLink     string       `json:"lineup_for_hosts_link,omitempty" bson:"lineup_for_hosts_link,omitempty"`         // Optional: lineup for hosts link
	RecordedLessonDate     string       `json:"recorded_lesson_date,omitempty" bson:"recorded_lesson_date,omitempty"`           // Optional: date the recorded lesson was given (YYYY-MM-DD)
	Sources                []Source     `json:"sources" bson:"sources"`
	CustomLinks            []CustomLink `json:"custom_links,omitempty" bson:"custom_links,omitempty"` // Optional: custom links with titles (language-specific)
	ShowUpdatedBadge       bool         `json:"show_updated_badge" bson:"show_updated_badge"`
	CreatedAt              time.Time    `json:"created_at" bson:"created_at"`
}

// Source represents a study source from kabbalahmedia
type Source struct {
	SourceID    string `json:"source_id" bson:"source_id"`
	SourceTitle string `json:"source_title" bson:"source_title"`
	SourceURL   string `json:"source_url" bson:"source_url"`
	PageNumber  string `json:"page_number,omitempty" bson:"page_number,omitempty"`   // Optional: page in source (e.g., "42", "15-17")
	StartPoint  string `json:"start_point,omitempty" bson:"start_point,omitempty"`   // Optional: paragraph text marking the start of relevant section
	EndPoint    string `json:"end_point,omitempty" bson:"end_point,omitempty"`       // Optional: paragraph text marking the end of relevant section
}

// CustomLink represents a custom link with a custom title (language-specific)
type CustomLink struct {
	Title string `json:"title" bson:"title"`
	URL   string `json:"url" bson:"url"`
}

// CreatePartRequest is the request body for creating a part
type CreatePartRequest struct {
	Title                  string       `json:"title"`
	Description            string       `json:"description"`
	Date                   string       `json:"date"`                                // ISO format: YYYY-MM-DD
	PartType               string       `json:"part_type"`                           // "live_lesson" or "recorded_lesson", defaults to "live_lesson"
	Language               string       `json:"language"`                            // ISO 639-1 code, defaults to "he"
	EventID                string       `json:"event_id,omitempty"`                  // Optional: links part to an event
	PartNumber             int          `json:"part_number"`                         // Display label and group key within event (0=Preparation, 1+=Part N)
	Order                  int          `json:"order"`                               // Sort position within event (auto-assigned)
	TemplateID             string       `json:"template_id,omitempty"`               // Optional: ID of template used (for auto-translating)
	ExcerptsLink           string       `json:"excerpts_link,omitempty"`             // Optional: link to selected excerpts
	TranscriptLink         string       `json:"transcript_link,omitempty"`           // Optional: link to transcript
	LessonLink             string       `json:"lesson_link,omitempty"`               // Optional: kabbalahmedia lesson URL
	ProgramLink            string       `json:"program_link,omitempty"`              // Optional: link to program
	ReadingBeforeSleepLink string       `json:"reading_before_sleep_link,omitempty"` // Optional: for preparation parts (order=0)
	LessonPreparationLink  string       `json:"lesson_preparation_link,omitempty"`   // Optional: for preparation parts (order=0)
	LineupForHostsLink     string       `json:"lineup_for_hosts_link,omitempty"`     // Optional: lineup for hosts link
	RecordedLessonDate     string       `json:"recorded_lesson_date,omitempty"`      // Optional: date the recorded lesson was given (YYYY-MM-DD)
	Sources                []Source     `json:"sources"`
	CustomLinks            []CustomLink `json:"custom_links,omitempty"` // Optional: custom links with titles (language-specific)
	ShowUpdatedBadge       bool         `json:"show_updated_badge"`
}

// Event represents a study event (morning lesson, noon lesson, evening lesson, meal, convention, etc.)
type Event struct {
	ID          string            `json:"id" bson:"_id"`
	Date        time.Time         `json:"date" bson:"date"`                                 // Event date
	StartTime   string            `json:"start_time,omitempty" bson:"start_time,omitempty"` // Optional: start time in HH:MM format
	EndTime     string            `json:"end_time,omitempty" bson:"end_time,omitempty"`     // Optional: end time in HH:MM format
	Type        string            `json:"type" bson:"type"`                                 // "morning_lesson", "noon_lesson", "evening_lesson", "meal", "convention", "lecture", "other"
	Number      int               `json:"number" bson:"number"`                             // Event number for same day (1, 2, ...)
	Order       int               `json:"order" bson:"order"`                               // Display order (lower numbers appear first)
	Titles      map[string]string `json:"titles,omitempty" bson:"titles,omitempty"`         // Multi-language titles (he, en, ru, es, de, it, fr, uk)
	Public      bool              `json:"public" bson:"public"`                             // Whether event is public
	EmailSentAt *time.Time        `json:"email_sent_at,omitempty" bson:"email_sent_at,omitempty"` // Track when email was sent to Google Group
	CreatedAt   time.Time         `json:"created_at" bson:"created_at"`
}

// EventType represents a configurable event type stored in MongoDB
type EventType struct {
	ID        string            `json:"id" bson:"_id"`
	Name      string            `json:"name" bson:"name"`           // Unique slug, e.g. "morning_lesson"
	Titles    map[string]string `json:"titles" bson:"titles"`       // Multi-language titles
	Color     string            `json:"color" bson:"color"`         // Tailwind color name, e.g. "blue", "amber"
	Order     int               `json:"order" bson:"order"`         // Display order
	CreatedAt time.Time         `json:"created_at" bson:"created_at"`
	UpdatedAt time.Time         `json:"updated_at" bson:"updated_at"`
}

// CreateEventTypeRequest is the request body for creating an event type
type CreateEventTypeRequest struct {
	Name   string            `json:"name"`
	Titles map[string]string `json:"titles"`
	Color  string            `json:"color"`
	Order  *int              `json:"order,omitempty"`
}

// UpdateEventTypeRequest is the request body for updating an event type
type UpdateEventTypeRequest struct {
	Titles map[string]string `json:"titles,omitempty"`
	Color  string            `json:"color,omitempty"`
	Order  *int              `json:"order,omitempty"`
}

// CreateEventRequest is the request body for creating an event
type CreateEventRequest struct {
	Date      string            `json:"date"`                 // ISO format: YYYY-MM-DD
	StartTime string            `json:"start_time,omitempty"` // Optional: start time in HH:MM format
	EndTime   string            `json:"end_time,omitempty"`   // Optional: end time in HH:MM format
	Type      string            `json:"type"`                 // Event type, defaults to "morning_lesson"
	Number    int               `json:"number"`               // Event number, defaults to 1
	Order     *int              `json:"order,omitempty"`      // Optional: display order (defaults to 0)
	Titles    map[string]string `json:"titles,omitempty"`     // Optional: custom titles for the event (he, en, ru, es, de, it, fr, uk)
	Public    *bool             `json:"public,omitempty"`     // Whether event is public, defaults to false
}
