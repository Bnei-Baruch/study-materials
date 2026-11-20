package api

import (
	"reflect"
	"time"

	"github.com/Bnei-Baruch/study-material-service/storage"
)

// syncScalarField is the per-field rule every tracked field goes through,
// replacing the old unconditional `existing.Field = fresh` line.
//   - live == baseline: nothing has touched the field since the last sync
//     write — apply fresh to both live and baseline.
//   - live != baseline but live == fresh: the divergence has self-resolved
//     (the edit happens to already match upstream) — just catch baseline up,
//     no pending badge needed.
//   - otherwise: a human (or any other writer) changed it — leave live and
//     baseline alone, park fresh in *pending so the admin UI can offer it.
//
// PartNumber needs its own variant (syncPartNumberField below) because the
// live field is itself a nilable pointer for an unrelated reason (nil =
// legacy part, falls back to Order).
func syncScalarField[T any](live, baseline *T, fresh T, pending **T) {
	if reflect.DeepEqual(*live, *baseline) {
		*live = fresh
		*baseline = fresh
		*pending = nil
		return
	}
	if reflect.DeepEqual(*live, fresh) {
		*baseline = fresh
		*pending = nil
		return
	}
	freshCopy := fresh
	*pending = &freshCopy
}

// sliceEqual treats a nil slice and a non-nil empty slice as equal, unlike
// reflect.DeepEqual (which treats a nil/non-nil mismatch as unequal even when
// both have zero elements). Sources/CustomLinks can legitimately arrive as
// either representation — Mongo's bson "omitempty" decodes a genuinely-empty
// field to nil, while freshly-parsed bb-lineup data or this package's own
// append-based construction can produce a non-nil empty slice for the exact
// same "no items" meaning — so a raw reflect.DeepEqual would see a
// divergence that was never actually a human edit.
func sliceEqual[T any](a, b []T) bool {
	if len(a) == 0 && len(b) == 0 {
		return true
	}
	return reflect.DeepEqual(a, b)
}

// syncSliceField is syncScalarField's slice-aware counterpart, using
// sliceEqual instead of reflect.DeepEqual so nil-vs-empty never causes a
// false divergence (see sliceEqual doc comment). Used for Sources/CustomLinks
// in place of the generic syncScalarField.
func syncSliceField[T any](live, baseline *[]T, fresh []T, pending **[]T) {
	if sliceEqual(*live, *baseline) {
		*live = fresh
		*baseline = fresh
		*pending = nil
		return
	}
	if sliceEqual(*live, fresh) {
		*baseline = fresh
		*pending = nil
		return
	}
	freshCopy := fresh
	*pending = &freshCopy
}

// adoptSliceField is adoptScalarField's slice-aware counterpart: "never set"
// means len(live) == 0 (regardless of nil-ness), not strictly live == nil —
// Sources in particular is never actually nil on a live document (no
// "omitempty" on that field), so a strict zero-value (nil) comparison would
// wrongly treat every brand-new, never-filled-in part as "already set by the
// operator" and block it from ever receiving bb-lineup's real content.
func adoptSliceField[T any](live *[]T, fresh []T, pending **[]T) {
	if len(*live) == 0 {
		*live = fresh
		return
	}
	if sliceEqual(*live, fresh) {
		return
	}
	freshCopy := fresh
	*pending = &freshCopy
}

func syncPartNumberField(existing *storage.LessonPart, baseline *storage.LessonPartSyncBaseline, fresh int, pending *storage.LessonPartSyncPending) {
	matched := existing.PartNumber == nil && baseline.PartNumber == nil
	if !matched && existing.PartNumber != nil && baseline.PartNumber != nil {
		matched = *existing.PartNumber == *baseline.PartNumber
	}
	if matched {
		pn, bn := fresh, fresh
		existing.PartNumber = &pn
		baseline.PartNumber = &bn
		pending.PartNumber = nil
		return
	}
	if existing.PartNumber != nil && *existing.PartNumber == fresh {
		bn := fresh
		baseline.PartNumber = &bn
		pending.PartNumber = nil
		return
	}
	pn := fresh
	pending.PartNumber = &pn
}

// adoptScalarField is syncScalarField's counterpart for first-time adoption
// of a manually-created part (no SyncBaseline yet): compares the operator's
// current live value against T's zero value instead of a stored baseline —
// a never-synced part implicitly starts at the zero value for every field it
// was never given. Zero live value means "operator never set this" (take
// bb-lineup's fresh value); non-zero means they filled it in deliberately
// (preserve it, offer fresh as pending instead). For strings, ints, and
// other non-slice types only — Sources/CustomLinks use adoptSliceField
// instead, since a slice's zero value (nil) isn't a reliable "never set"
// signal: Sources in particular is never actually nil on a live document.
func adoptScalarField[T any](live *T, fresh T, pending **T) {
	var zero T
	syncScalarField(live, &zero, fresh, pending)
}

// adoptPartNumberField mirrors adoptScalarField for PartNumber, whose
// "never set" state is nil (legacy-part marker), not the zero value 0.
func adoptPartNumberField(existing *storage.LessonPart, fresh int, pending *storage.LessonPartSyncPending) {
	if existing.PartNumber == nil {
		pn := fresh
		existing.PartNumber = &pn
		return
	}
	if *existing.PartNumber == fresh {
		return
	}
	pn := fresh
	pending.PartNumber = &pn
}

// bbLineupFreshFields is every value one sync run computed for a single part.
// PartType/EventID are never admin-editable (HandleUpdatePart never writes
// them) so they stay unconditionally overwritten, same as today.
type bbLineupFreshFields struct {
	PartType               string
	EventID                string
	Title                  string
	Description            string
	Date                   time.Time
	PartNumber             int
	Order                  int
	LessonLink             string
	TranscriptLink         string
	LineupForHostsLink     string
	ProgramLink            string
	RecordedLessonDate     string
	ReadingBeforeSleepLink string
	LessonPreparationLink  string
	Sources                []storage.Source
	CustomLinks            []storage.CustomLink
}

// newSyncBaseline snapshots a part's CURRENT live values for every tracked
// field. Used both for first-ever sync-owned writes (baseline = the fresh
// values just written) and to lazily initialize a pre-existing synced part's
// baseline the first time it's seen after this feature ships.
func newSyncBaseline(existing *storage.LessonPart) *storage.LessonPartSyncBaseline {
	b := &storage.LessonPartSyncBaseline{
		Title:                  existing.Title,
		Description:            existing.Description,
		Date:                   existing.Date,
		Order:                  existing.Order,
		LessonLink:             existing.LessonLink,
		TranscriptLink:         existing.TranscriptLink,
		LineupForHostsLink:     existing.LineupForHostsLink,
		ProgramLink:            existing.ProgramLink,
		RecordedLessonDate:     existing.RecordedLessonDate,
		ReadingBeforeSleepLink: existing.ReadingBeforeSleepLink,
		LessonPreparationLink:  existing.LessonPreparationLink,
		Sources:                append([]storage.Source{}, existing.Sources...),
		CustomLinks:            append([]storage.CustomLink{}, existing.CustomLinks...),
	}
	if existing.PartNumber != nil {
		pn := *existing.PartNumber
		b.PartNumber = &pn
	}
	return b
}

// applyBBLineupSync applies this run's fresh values onto an already
// sync-owned part, honoring any per-field edit made since the last run wrote
// it. existing.SyncBaseline == nil means this part predates per-field
// tracking (every part already synced before this feature shipped) — the
// FIRST time such a part is seen, this run ONLY initializes the baseline from
// current live values and returns, deliberately NOT also applying fresh this
// same run. That keeps ship day a pure bookkeeping pass: nothing a human
// already changed gets silently clobbered just because tracking switched on.
// Normal field-level sync resumes exactly one run later (10 minutes).
func applyBBLineupSync(existing *storage.LessonPart, fresh bbLineupFreshFields) {
	existing.PartType = fresh.PartType
	existing.EventID = fresh.EventID

	if existing.SyncBaseline == nil {
		existing.SyncBaseline = newSyncBaseline(existing)
		existing.PendingSync = nil
		return
	}

	b := existing.SyncBaseline
	p := existing.PendingSync
	if p == nil {
		p = &storage.LessonPartSyncPending{}
	}

	if fresh.Title != "" {
		// Same rule the old unconditional-overwrite code used: an empty
		// incoming title means "bb-lineup has nothing better to offer right
		// now", not "the title to sync to" — never treated as fresh.
		syncScalarField(&existing.Title, &b.Title, fresh.Title, &p.Title)
	}
	syncScalarField(&existing.Description, &b.Description, fresh.Description, &p.Description)
	syncScalarField(&existing.Date, &b.Date, fresh.Date, &p.Date)
	syncScalarField(&existing.Order, &b.Order, fresh.Order, &p.Order)
	syncScalarField(&existing.LessonLink, &b.LessonLink, fresh.LessonLink, &p.LessonLink)
	syncScalarField(&existing.TranscriptLink, &b.TranscriptLink, fresh.TranscriptLink, &p.TranscriptLink)
	syncScalarField(&existing.LineupForHostsLink, &b.LineupForHostsLink, fresh.LineupForHostsLink, &p.LineupForHostsLink)
	syncScalarField(&existing.ProgramLink, &b.ProgramLink, fresh.ProgramLink, &p.ProgramLink)
	syncScalarField(&existing.RecordedLessonDate, &b.RecordedLessonDate, fresh.RecordedLessonDate, &p.RecordedLessonDate)
	syncScalarField(&existing.ReadingBeforeSleepLink, &b.ReadingBeforeSleepLink, fresh.ReadingBeforeSleepLink, &p.ReadingBeforeSleepLink)
	syncScalarField(&existing.LessonPreparationLink, &b.LessonPreparationLink, fresh.LessonPreparationLink, &p.LessonPreparationLink)
	syncSliceField(&existing.Sources, &b.Sources, fresh.Sources, &p.Sources)
	syncSliceField(&existing.CustomLinks, &b.CustomLinks, fresh.CustomLinks, &p.CustomLinks)
	syncPartNumberField(existing, b, fresh.PartNumber, p)

	if p.IsEmpty() {
		existing.PendingSync = nil
	} else {
		existing.PendingSync = p
	}
}
