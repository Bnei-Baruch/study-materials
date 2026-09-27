package api

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/Bnei-Baruch/study-material-service/storage"
	"go.mongodb.org/mongo-driver/bson"
)

const externalEventsURL = "https://events.kli.one/api/events"

// regularEventsHorizonDays caps how far ahead "regular" (daily lesson/meal) events
// are imported. The external feed pre-expands recurrence out to ~5 years, so without
// a horizon a single sync would create thousands of far-future rows.
const regularEventsHorizonDays = 30

// externalTypeMap maps events.kli.one parent/container types to local event types.
// "regular" is handled separately by resolveRegularType, since it needs per-row
// keyword matching rather than a single fixed mapping.
var externalTypeMap = map[string]string{
	"conference": "convention",
	"holiday":    "holiday",
	"special":    "special_event",
}

// regularTypeKeywords maps a keyword (matched against the English title,
// case-insensitive, first match wins) to a local EventType slug.
var regularTypeKeywords = []struct {
	keyword  string
	typeName string
}{
	{"meal", "meal"},
	{"zohar", "zohar_lesson"},
	{"studying from the sources", "studying_from_the_sources"},
	{"morning lesson", "morning_lesson"},
	{"afternoon lesson", "noon_lesson"},
	{"noon lesson", "noon_lesson"},
	{"evening lesson", "evening_lesson"},
}

type externalEvent struct {
	ID        string            `json:"id"`
	Type      string            `json:"type"`
	Date      string            `json:"date"`
	EndDate   string            `json:"endDate"`
	StartTime string            `json:"startTime"`
	EndTime   string            `json:"endTime"`
	Title     map[string]string `json:"title"`
	ParentID  string            `json:"parentId"`
	Private   bool              `json:"private"`
}

func hasHebrewTitle(ext externalEvent) bool {
	return strings.TrimSpace(ext.Title["he"]) != ""
}

// isNotBroadcast reports whether the Hebrew title marks the row as not
// livestreamed (e.g. "תפילה (לא משודר)"). The English title is too
// inconsistent/sparse in the feed to rely on for this check.
func isNotBroadcast(ext externalEvent) bool {
	he := ext.Title["he"]
	return strings.Contains(he, "לא משודר") || strings.Contains(he, "אין שידור")
}

// normalizeTime zero-pads an "H:MM"/"HH:MM" time string to "HH:MM". The feed is
// inconsistent about padding (e.g. "2:40" vs "02:40"), which breaks any plain
// string comparison/sort downstream.
func normalizeTime(t string) string {
	h, m, ok := strings.Cut(t, ":")
	if !ok || len(h) == 0 || len(h) > 2 {
		return t
	}
	if len(h) == 1 {
		h = "0" + h
	}
	return h + ":" + m
}

// slotKey identifies a specific lesson/meal slot by date+type+start_time, used to
// detect a pre-existing, manually-created event that represents the same
// real-world slot as an incoming external row (so sync adopts it instead of
// creating a visual duplicate).
func slotKey(date time.Time, eventType, startTime string) string {
	return date.Format("2006-01-02") + "|" + eventType + "|" + startTime
}

// resolveRegularType maps a "regular" external event's English title to a local
// EventType slug, verifying the type actually exists in the DB and falling back
// to "other" otherwise (types are admin-managed and can be renamed/removed).
func resolveRegularType(a *App, titleEn string) string {
	t := strings.ToLower(titleEn)
	for _, m := range regularTypeKeywords {
		if strings.Contains(t, m.keyword) {
			if _, err := a.eventTypeStore.GetEventTypeByName(m.typeName); err == nil {
				return m.typeName
			}
			break
		}
	}
	return "other"
}

// SyncExternalEvents fetches events from events.kli.one and upserts them locally.
//
//   - conference/holiday/special rows become local "container" events (convention,
//     holiday, special_event), unchanged from before.
//   - regular rows (daily lessons, meals, ...) become local events too, within a
//     rolling horizon, linked to their parent container via ParentEventID when the
//     feed provides parentId. "Break" rows and rows with no Hebrew title are
//     skipped entirely. "Lesson Preparation" rows are not imported as their own
//     event; instead they widen the StartTime of the lesson they immediately
//     precede (same day, prep's endTime == lesson's startTime).
//   - Events previously synced but no longer present upstream are soft-unpublished
//     (Public=false) rather than deleted, so admin edits/content are never lost.
//
// On update, only date/endDate/titles/start_time/end_time/parent_event_id are
// overwritten — other admin-set fields (public, hide_from_lessons_tab, etc.) are
// never touched.
func (a *App) SyncExternalEvents() {
	log.Println("[sync] Fetching external events from", externalEventsURL)

	resp, err := http.Get(externalEventsURL)
	if err != nil {
		log.Printf("[sync] HTTP error: %v", err)
		return
	}
	defer resp.Body.Close()

	var extEvents []externalEvent
	if err := json.NewDecoder(resp.Body).Decode(&extEvents); err != nil {
		log.Printf("[sync] JSON decode error: %v", err)
		return
	}
	for i := range extEvents {
		extEvents[i].StartTime = normalizeTime(extEvents[i].StartTime)
		extEvents[i].EndTime = normalizeTime(extEvents[i].EndTime)
	}

	today := time.Now().UTC().Truncate(24 * time.Hour)
	regularHorizon := today.AddDate(0, 0, regularEventsHorizonDays)

	// Load every local event (no cap: this grows past 1000 over time as regular
	// events accumulate). Used both to match previously-synced rows by
	// ExternalID and to detect pre-existing manually-created events occupying
	// the same date+type+start_time slot as an incoming row.
	allEvents, _, err := a.eventStore.ListEventsFiltered(bson.M{}, 0, 0, false)
	if err != nil {
		log.Printf("[sync] DB query error: %v", err)
		return
	}
	existingByExtID := make(map[string]*storage.Event, len(allEvents))
	existingBySlot := make(map[string]*storage.Event, len(allEvents))
	var existing []storage.Event
	for i := range allEvents {
		if allEvents[i].ExternalID != "" {
			existingByExtID[allEvents[i].ExternalID] = &allEvents[i]
			existing = append(existing, allEvents[i])
		} else {
			existingBySlot[slotKey(allEvents[i].Date, allEvents[i].Type, allEvents[i].StartTime)] = &allEvents[i]
		}
	}

	// Group regular external events by date, to pair "Lesson Preparation" rows
	// with the lesson they immediately precede.
	regularByDate := make(map[string][]*externalEvent)
	for i := range extEvents {
		if extEvents[i].Type == "regular" {
			regularByDate[extEvents[i].Date] = append(regularByDate[extEvents[i].Date], &extEvents[i])
		}
	}
	prepStartByTargetExtID := make(map[string]string)
	for _, ext := range extEvents {
		if ext.Type != "regular" || !hasHebrewTitle(ext) {
			continue
		}
		if !strings.Contains(strings.ToLower(ext.Title["en"]), "preparation") {
			continue
		}
		for _, cand := range regularByDate[ext.Date] {
			if cand.ID != ext.ID && cand.StartTime == ext.EndTime {
				prepStartByTargetExtID[cand.ID] = ext.StartTime
				break
			}
		}
	}

	created, updated, orphaned := 0, 0, 0

	// Phase 1: conference/holiday/special container events.
	extIDToLocalID := make(map[string]string, len(extEvents))
	for _, ext := range extEvents {
		localType, ok := externalTypeMap[ext.Type]
		if !ok {
			continue
		}
		if ext.Private || !hasHebrewTitle(ext) {
			continue
		}
		if isNotBroadcast(ext) {
			continue
		}

		startDate, err := time.Parse("2006-01-02", ext.Date)
		if err != nil {
			continue
		}

		endDate := startDate
		var endDatePtr *time.Time
		if ext.EndDate != "" {
			if ed, err := time.Parse("2006-01-02", ext.EndDate); err == nil {
				endDate = ed
				endDatePtr = &ed
			}
		}

		if endDate.Before(today) {
			continue
		}

		titles := ext.Title
		if titles == nil {
			titles = map[string]string{}
		}

		if local, exists := existingByExtID[ext.ID]; exists {
			changed := false

			if !local.Date.Equal(startDate) {
				local.Date = startDate
				changed = true
			}
			if !equalTimePtrs(local.EndDate, endDatePtr) {
				local.EndDate = endDatePtr
				changed = true
			}
			if local.Titles == nil {
				local.Titles = make(map[string]string)
			}
			for k, v := range titles {
				if local.Titles[k] != v {
					local.Titles[k] = v
					changed = true
				}
			}

			if changed {
				if err := a.eventStore.SaveEvent(local); err != nil {
					log.Printf("[sync] Update %s error: %v", ext.ID, err)
				} else {
					updated++
				}
			}
			extIDToLocalID[ext.ID] = local.ID
		} else {
			event := &storage.Event{
				ExternalID:         ext.ID,
				Date:               startDate,
				EndDate:            endDatePtr,
				StartTime:          ext.StartTime,
				EndTime:            ext.EndTime,
				Type:               localType,
				Number:             1,
				Titles:             titles,
				Public:             false, // operator reviews and publishes manually
				HideFromLessonsTab: true,
			}
			if err := a.eventStore.SaveEvent(event); err != nil {
				log.Printf("[sync] Create %s error: %v", ext.ID, err)
				continue
			}
			created++
			extIDToLocalID[ext.ID] = event.ID
		}
	}

	// Phase 2: regular events (daily lessons, meals, ...), within the rolling horizon.
	for _, ext := range extEvents {
		if ext.Type != "regular" {
			continue
		}
		if ext.Private || !hasHebrewTitle(ext) {
			continue
		}
		if isNotBroadcast(ext) {
			continue
		}

		titleEn := strings.ToLower(ext.Title["en"])
		if strings.Contains(titleEn, "break") {
			continue
		}
		if strings.Contains(titleEn, "preparation") {
			continue // folded into its paired lesson's StartTime, not its own event
		}
		if ext.StartTime == "" && ext.EndTime == "" {
			continue // no time-of-day at all — not a schedulable lesson slot
		}

		startDate, err := time.Parse("2006-01-02", ext.Date)
		if err != nil {
			continue
		}
		if startDate.Before(today) || startDate.After(regularHorizon) {
			continue
		}

		var endDatePtr *time.Time
		if ext.EndDate != "" {
			if ed, err := time.Parse("2006-01-02", ext.EndDate); err == nil {
				endDatePtr = &ed
			}
		}

		titles := ext.Title
		if titles == nil {
			titles = map[string]string{}
		}

		startTime := ext.StartTime
		if prepStart, ok := prepStartByTargetExtID[ext.ID]; ok {
			startTime = prepStart
		}

		var parentEventID string
		if ext.ParentID != "" {
			parentEventID = extIDToLocalID[ext.ParentID]
		}

		if local, exists := existingByExtID[ext.ID]; exists {
			changed := false

			if !local.Date.Equal(startDate) {
				local.Date = startDate
				changed = true
			}
			if !equalTimePtrs(local.EndDate, endDatePtr) {
				local.EndDate = endDatePtr
				changed = true
			}
			if local.StartTime != startTime {
				local.StartTime = startTime
				changed = true
			}
			if local.EndTime != ext.EndTime {
				local.EndTime = ext.EndTime
				changed = true
			}
			if local.ParentEventID != parentEventID {
				local.ParentEventID = parentEventID
				changed = true
			}
			if local.Titles == nil {
				local.Titles = make(map[string]string)
			}
			for k, v := range titles {
				if local.Titles[k] != v {
					local.Titles[k] = v
					changed = true
				}
			}

			if changed {
				if err := a.eventStore.SaveEvent(local); err != nil {
					log.Printf("[sync] Update %s error: %v", ext.ID, err)
				} else {
					updated++
				}
			}
			extIDToLocalID[ext.ID] = local.ID
		} else {
			localType := resolveRegularType(a, ext.Title["en"])

			// A manually-created event may already occupy this exact
			// date+type+start_time slot (e.g. an admin pre-created "Meal" for a
			// day before this sync existed). Adopt it instead of creating a
			// visual duplicate: attach the ExternalID and sync its fields going
			// forward, same as any other previously-synced event.
			if match, ok := existingBySlot[slotKey(startDate, localType, startTime)]; ok {
				match.ExternalID = ext.ID
				match.Date = startDate
				match.EndDate = endDatePtr
				match.StartTime = startTime
				match.EndTime = ext.EndTime
				match.ParentEventID = parentEventID
				if match.Titles == nil {
					match.Titles = make(map[string]string)
				}
				for k, v := range titles {
					match.Titles[k] = v
				}
				if err := a.eventStore.SaveEvent(match); err != nil {
					log.Printf("[sync] Adopt %s error: %v", ext.ID, err)
					continue
				}
				updated++
				extIDToLocalID[ext.ID] = match.ID
				delete(existingBySlot, slotKey(startDate, localType, startTime))
				continue
			}

			event := &storage.Event{
				ExternalID:         ext.ID,
				Date:               startDate,
				EndDate:            endDatePtr,
				StartTime:          startTime,
				EndTime:            ext.EndTime,
				Type:               localType,
				Number:             1,
				Titles:             titles,
				Public:             false, // operator reviews and publishes manually
				ParentEventID:      parentEventID,
				HideFromLessonsTab: false,
			}
			if err := a.eventStore.SaveEvent(event); err != nil {
				log.Printf("[sync] Create %s error: %v", ext.ID, err)
				continue
			}
			created++
			extIDToLocalID[ext.ID] = event.ID
		}
	}

	// Phase 3: soft-unpublish events that no longer appear upstream at all.
	fetchedExtIDs := make(map[string]struct{}, len(extEvents))
	for _, ext := range extEvents {
		fetchedExtIDs[ext.ID] = struct{}{}
	}
	for i := range existing {
		local := &existing[i]
		if local.ExternalID == "" {
			continue
		}
		if _, stillPresent := fetchedExtIDs[local.ExternalID]; stillPresent {
			continue
		}
		if !local.Public {
			continue
		}
		local.Public = false
		if err := a.eventStore.SaveEvent(local); err != nil {
			log.Printf("[sync] Unpublish %s error: %v", local.ExternalID, err)
			continue
		}
		orphaned++
	}

	log.Printf("[sync] Done: %d created, %d updated, %d unpublished (no longer upstream)", created, updated, orphaned)
}

func equalTimePtrs(a, b *time.Time) bool {
	if a == nil && b == nil {
		return true
	}
	if a == nil || b == nil {
		return false
	}
	return a.Equal(*b)
}
