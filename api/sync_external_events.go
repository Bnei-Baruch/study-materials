package api

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/Bnei-Baruch/study-material-service/storage"
	"go.mongodb.org/mongo-driver/bson"
)

const externalEventsURL = "https://events.kli.one/api/events"

// externalTypeMap maps events.kli.one types to local event types.
// "regular" is intentionally omitted — daily lessons are manually authored here.
var externalTypeMap = map[string]string{
	"conference": "convention",
	"holiday":    "holiday",
	"special":    "special_event",
}

type externalEvent struct {
	ID        string            `json:"id"`
	Type      string            `json:"type"`
	Date      string            `json:"date"`
	EndDate   string            `json:"endDate"`
	StartTime string            `json:"startTime"`
	EndTime   string            `json:"endTime"`
	Title     map[string]string `json:"title"`
}

// SyncExternalEvents fetches events from events.kli.one and upserts them locally.
// Only conference/holiday/special types are imported; past events are skipped.
// On update, only date, endDate, and titles are overwritten — admin-set fields
// (public, hide_from_lessons_tab, etc.) are never touched.
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

	today := time.Now().UTC().Truncate(24 * time.Hour)

	// Load all locally-synced events keyed by ExternalID
	existing, _, err := a.eventStore.ListEventsFiltered(
		bson.M{"external_id": bson.M{"$ne": ""}},
		1000, 0,
	)
	if err != nil {
		log.Printf("[sync] DB query error: %v", err)
		return
	}
	existingByExtID := make(map[string]*storage.Event, len(existing))
	for i := range existing {
		if existing[i].ExternalID != "" {
			existingByExtID[existing[i].ExternalID] = &existing[i]
		}
	}

	created, updated := 0, 0

	for _, ext := range extEvents {
		localType, ok := externalTypeMap[ext.Type]
		if !ok {
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
			// Update only date, endDate, and titles — never touch admin fields
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
				Public:             true,
				HideFromLessonsTab: true,
			}
			if err := a.eventStore.SaveEvent(event); err != nil {
				log.Printf("[sync] Create %s error: %v", ext.ID, err)
			} else {
				created++
			}
		}
	}

	log.Printf("[sync] Done: %d created, %d updated", created, updated)
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
