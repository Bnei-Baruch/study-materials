package api

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/Bnei-Baruch/study-material-service/storage"
	"github.com/gorilla/mux"
)

// acceptPendingScalar applies a pending value unconditionally, right now, and
// resets that field's baseline to match (so automatic sync resumes for it
// from the very next run, until the admin edits it again).
func acceptPendingScalar[T any](live, baseline *T, pending **T) bool {
	if *pending == nil {
		return false
	}
	*live = **pending
	*baseline = **pending
	*pending = nil
	return true
}

var bbPendingFieldAccessors = map[string]func(p *storage.LessonPart) bool{
	"title": func(p *storage.LessonPart) bool {
		return acceptPendingScalar(&p.Title, &p.SyncBaseline.Title, &p.PendingSync.Title)
	},
	"description": func(p *storage.LessonPart) bool {
		return acceptPendingScalar(&p.Description, &p.SyncBaseline.Description, &p.PendingSync.Description)
	},
	"date": func(p *storage.LessonPart) bool {
		return acceptPendingScalar(&p.Date, &p.SyncBaseline.Date, &p.PendingSync.Date)
	},
	"order": func(p *storage.LessonPart) bool {
		return acceptPendingScalar(&p.Order, &p.SyncBaseline.Order, &p.PendingSync.Order)
	},
	"lesson_link": func(p *storage.LessonPart) bool {
		return acceptPendingScalar(&p.LessonLink, &p.SyncBaseline.LessonLink, &p.PendingSync.LessonLink)
	},
	"transcript_link": func(p *storage.LessonPart) bool {
		return acceptPendingScalar(&p.TranscriptLink, &p.SyncBaseline.TranscriptLink, &p.PendingSync.TranscriptLink)
	},
	"lineup_for_hosts_link": func(p *storage.LessonPart) bool {
		return acceptPendingScalar(&p.LineupForHostsLink, &p.SyncBaseline.LineupForHostsLink, &p.PendingSync.LineupForHostsLink)
	},
	"program_link": func(p *storage.LessonPart) bool {
		return acceptPendingScalar(&p.ProgramLink, &p.SyncBaseline.ProgramLink, &p.PendingSync.ProgramLink)
	},
	"recorded_lesson_date": func(p *storage.LessonPart) bool {
		return acceptPendingScalar(&p.RecordedLessonDate, &p.SyncBaseline.RecordedLessonDate, &p.PendingSync.RecordedLessonDate)
	},
	"reading_before_sleep_link": func(p *storage.LessonPart) bool {
		return acceptPendingScalar(&p.ReadingBeforeSleepLink, &p.SyncBaseline.ReadingBeforeSleepLink, &p.PendingSync.ReadingBeforeSleepLink)
	},
	"lesson_preparation_link": func(p *storage.LessonPart) bool {
		return acceptPendingScalar(&p.LessonPreparationLink, &p.SyncBaseline.LessonPreparationLink, &p.PendingSync.LessonPreparationLink)
	},
	"sources": func(p *storage.LessonPart) bool {
		return acceptPendingScalar(&p.Sources, &p.SyncBaseline.Sources, &p.PendingSync.Sources)
	},
	"custom_links": func(p *storage.LessonPart) bool {
		return acceptPendingScalar(&p.CustomLinks, &p.SyncBaseline.CustomLinks, &p.PendingSync.CustomLinks)
	},
	// PartNumber is special-cased (not acceptPendingScalar) for the same
	// reason syncPartNumberField is: live is itself *int for an unrelated
	// reason (nil = legacy, "fall back to Order").
	"part_number": func(p *storage.LessonPart) bool {
		if p.PendingSync.PartNumber == nil {
			return false
		}
		pn, bn := *p.PendingSync.PartNumber, *p.PendingSync.PartNumber
		p.PartNumber = &pn
		p.SyncBaseline.PartNumber = &bn
		p.PendingSync.PartNumber = nil
		return true
	},
}

// HandleAcceptPendingSync accepts bb-lineup's latest pending value for ONE
// field of ONE part: applies it live and resets that field's baseline, so
// automatic sync resumes for it next run, until the admin edits it again.
// Every other field's pending/baseline state is untouched.
func (a *App) HandleAcceptPendingSync(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	partID := vars["id"]
	field := vars["field"]

	apply, ok := bbPendingFieldAccessors[field]
	if !ok {
		http.Error(w, fmt.Sprintf("Unknown field: %s", field), http.StatusBadRequest)
		return
	}

	part, err := a.store.GetPart(partID)
	if err != nil {
		http.Error(w, "Part not found", http.StatusNotFound)
		return
	}
	if part.SyncBaseline == nil || part.PendingSync == nil || !apply(part) {
		http.Error(w, "No pending sync value for that field", http.StatusConflict)
		return
	}
	if part.PendingSync.IsEmpty() {
		part.PendingSync = nil
	}

	if err := a.store.SavePart(part); err != nil {
		http.Error(w, fmt.Sprintf("Failed to save part: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(part)
}
