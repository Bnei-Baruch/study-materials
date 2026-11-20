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
	TranscriptStartPoint   string       `json:"transcript_start_point,omitempty" bson:"transcript_start_point,omitempty"`       // Optional: start point in transcript (language-specific)
	TranscriptEndPoint     string       `json:"transcript_end_point,omitempty" bson:"transcript_end_point,omitempty"`           // Optional: end point in transcript (language-specific)
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
	ExternalID             string       `json:"external_id,omitempty" bson:"external_id,omitempty"` // External system ID for synced parts (bb-lineup slot id)
	// SyncBaseline is bb-lineup sync's private "last value I wrote" memory — nil
	// means this part has never been synced, or predates this field. Never
	// exposed over the API.
	SyncBaseline *LessonPartSyncBaseline `json:"-" bson:"sync_baseline,omitempty"`
	// PendingSync holds fresh bb-lineup values the sync couldn't apply because
	// a field had diverged from baseline. Exposed over the API so the admin UI
	// can render a per-field "lineup has a newer version" badge.
	PendingSync *LessonPartSyncPending `json:"pending_sync,omitempty" bson:"pending_sync,omitempty"`
}

// LessonPartSyncBaseline is bb-lineup sync's private memory of the last value IT
// wrote to each sync-owned, admin-editable field. Compared against the live
// field on every sync run: live == baseline means no one has touched the field
// since the last sync write (safe to refresh); live != baseline means something
// changed it since (leave it alone). Never exposed over the API.
type LessonPartSyncBaseline struct {
	Title                  string       `bson:"title"`
	Description            string       `bson:"description"`
	Date                   time.Time    `bson:"date"`
	PartNumber             *int         `bson:"part_number"`
	Order                  int          `bson:"order"`
	LessonLink             string       `bson:"lesson_link"`
	TranscriptLink         string       `bson:"transcript_link"`
	LineupForHostsLink     string       `bson:"lineup_for_hosts_link"`
	ProgramLink            string       `bson:"program_link"`
	RecordedLessonDate     string       `bson:"recorded_lesson_date"`
	ReadingBeforeSleepLink string       `bson:"reading_before_sleep_link"`
	LessonPreparationLink  string       `bson:"lesson_preparation_link"`
	Sources                []Source     `bson:"sources"`
	CustomLinks            []CustomLink `bson:"custom_links"`
}

// LessonPartSyncPending holds, per tracked field, the freshest bb-lineup value
// the sync computed on its most recent run while that field was diverged from
// baseline — so the admin UI can show "lineup has a newer version" and let the
// operator accept it. A nil pointer means "nothing pending right now"; pointer
// types (including for slices) exist purely to distinguish "nothing pending"
// from "pending value happens to be the zero value".
type LessonPartSyncPending struct {
	Title                  *string       `json:"title,omitempty" bson:"title,omitempty"`
	Description            *string       `json:"description,omitempty" bson:"description,omitempty"`
	Date                   *time.Time    `json:"date,omitempty" bson:"date,omitempty"`
	PartNumber             *int          `json:"part_number,omitempty" bson:"part_number,omitempty"`
	Order                  *int          `json:"order,omitempty" bson:"order,omitempty"`
	LessonLink             *string       `json:"lesson_link,omitempty" bson:"lesson_link,omitempty"`
	TranscriptLink         *string       `json:"transcript_link,omitempty" bson:"transcript_link,omitempty"`
	LineupForHostsLink     *string       `json:"lineup_for_hosts_link,omitempty" bson:"lineup_for_hosts_link,omitempty"`
	ProgramLink            *string       `json:"program_link,omitempty" bson:"program_link,omitempty"`
	RecordedLessonDate     *string       `json:"recorded_lesson_date,omitempty" bson:"recorded_lesson_date,omitempty"`
	ReadingBeforeSleepLink *string       `json:"reading_before_sleep_link,omitempty" bson:"reading_before_sleep_link,omitempty"`
	LessonPreparationLink  *string       `json:"lesson_preparation_link,omitempty" bson:"lesson_preparation_link,omitempty"`
	Sources                *[]Source     `json:"sources,omitempty" bson:"sources,omitempty"`
	CustomLinks            *[]CustomLink `json:"custom_links,omitempty" bson:"custom_links,omitempty"`
}

// IsEmpty reports whether no field currently has a pending sync value.
func (p *LessonPartSyncPending) IsEmpty() bool {
	if p == nil {
		return true
	}
	return p.Title == nil && p.Description == nil && p.Date == nil && p.PartNumber == nil &&
		p.Order == nil && p.LessonLink == nil && p.TranscriptLink == nil &&
		p.LineupForHostsLink == nil && p.ProgramLink == nil && p.RecordedLessonDate == nil &&
		p.ReadingBeforeSleepLink == nil && p.LessonPreparationLink == nil &&
		p.Sources == nil && p.CustomLinks == nil
}

// Source represents a study source from kabbalahmedia
type Source struct {
	SourceID    string `json:"source_id" bson:"source_id"`
	SourceTitle string `json:"source_title" bson:"source_title"`
	SourceURL   string `json:"source_url" bson:"source_url"`
	Volume      string `json:"volume,omitempty" bson:"volume,omitempty"`             // Optional: book volume the page number belongs to (e.g., "1")
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
	TranscriptStartPoint   string       `json:"transcript_start_point,omitempty"`    // Optional: start point in transcript
	TranscriptEndPoint     string       `json:"transcript_end_point,omitempty"`      // Optional: end point in transcript
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
	Public             bool              `json:"public" bson:"public"`                                           // Whether event is public
	EndDate            *time.Time        `json:"end_date,omitempty" bson:"end_date,omitempty"`                   // Optional: end date for multi-day events
	ParentEventID      string            `json:"parent_event_id,omitempty" bson:"parent_event_id,omitempty"`     // Optional: links session to parent convention
	HideFromLessonsTab bool              `json:"hide_from_lessons_tab" bson:"hide_from_lessons_tab"`             // When true, excluded from the daily lessons tab
	EmailSentAt        *time.Time        `json:"email_sent_at,omitempty" bson:"email_sent_at,omitempty"`         // Track when email was sent to Google Group
	CreatedAt          time.Time         `json:"created_at" bson:"created_at"`
	ExternalID         string            `json:"external_id,omitempty" bson:"external_id,omitempty"`             // External system ID for synced events (events.kli.one)
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
	Date               string            `json:"date"`                           // ISO format: YYYY-MM-DD
	StartTime          string            `json:"start_time,omitempty"`           // Optional: start time in HH:MM format
	EndTime            string            `json:"end_time,omitempty"`             // Optional: end time in HH:MM format
	Type               string            `json:"type"`                           // Event type, defaults to "morning_lesson"
	Number             int               `json:"number"`                         // Event number, defaults to 1
	Order              *int              `json:"order,omitempty"`                // Optional: display order (defaults to 0)
	Titles             map[string]string `json:"titles,omitempty"`               // Optional: custom titles for the event (he, en, ru, es, de, it, fr, uk)
	Public             *bool             `json:"public,omitempty"`               // Whether event is public, defaults to false
	EndDate            string            `json:"end_date,omitempty"`             // Optional: ISO format YYYY-MM-DD for multi-day events
	ParentEventID      string            `json:"parent_event_id,omitempty"`      // Optional: parent convention/event ID
	HideFromLessonsTab *bool             `json:"hide_from_lessons_tab,omitempty"` // Optional: hide from daily lessons tab
}
