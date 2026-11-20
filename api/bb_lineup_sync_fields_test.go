package api

import (
	"reflect"
	"testing"
	"time"

	"github.com/Bnei-Baruch/study-material-service/storage"
)

func TestSyncScalarField_NoDivergence_AppliesFresh(t *testing.T) {
	live, baseline := "old", "old"
	var pending *string
	syncScalarField(&live, &baseline, "fresh", &pending)

	if live != "fresh" || baseline != "fresh" || pending != nil {
		t.Fatalf("got live=%q baseline=%q pending=%v, want live=fresh baseline=fresh pending=nil", live, baseline, pending)
	}
}

func TestSyncScalarField_Diverged_LeavesLiveAlone(t *testing.T) {
	live, baseline := "operator edit", "old"
	var pending *string
	syncScalarField(&live, &baseline, "fresh", &pending)

	if live != "operator edit" || baseline != "old" {
		t.Fatalf("got live=%q baseline=%q, want unchanged", live, baseline)
	}
	if pending == nil || *pending != "fresh" {
		t.Fatalf("got pending=%v, want \"fresh\"", pending)
	}
}

func TestSyncScalarField_SelfResolved_ClearsPending(t *testing.T) {
	live, baseline := "fresh", "old"
	var pending *string
	syncScalarField(&live, &baseline, "fresh", &pending)

	if live != "fresh" || baseline != "fresh" || pending != nil {
		t.Fatalf("got live=%q baseline=%q pending=%v, want self-resolved with no pending", live, baseline, pending)
	}
}

func TestAdoptScalarField_ZeroValue_TakesFresh(t *testing.T) {
	live := ""
	var pending *string
	adoptScalarField(&live, "lineup value", &pending)

	if live != "lineup value" || pending != nil {
		t.Fatalf("got live=%q pending=%v, want live=lineup value, pending=nil", live, pending)
	}
}

func TestAdoptScalarField_AlreadySet_Preserved(t *testing.T) {
	live := "operator pre-filled this"
	var pending *string
	adoptScalarField(&live, "lineup value", &pending)

	if live != "operator pre-filled this" {
		t.Fatalf("got live=%q, want preserved operator value", live)
	}
	if pending == nil || *pending != "lineup value" {
		t.Fatalf("got pending=%v, want lineup value offered as pending", pending)
	}
}

func TestSliceEqual_NilVsNonNilEmpty_TreatedAsEqual(t *testing.T) {
	var nilSlice []storage.Source
	nonNilEmpty := []storage.Source{}

	if !sliceEqual(nilSlice, nonNilEmpty) {
		t.Fatal("expected a nil slice and a non-nil empty slice to be treated as equal")
	}
	// Sanity check this would NOT hold with raw reflect.DeepEqual, to pin
	// down exactly why sliceEqual exists.
	if reflect.DeepEqual(nilSlice, nonNilEmpty) {
		t.Fatal("test assumption broken: reflect.DeepEqual now treats nil/empty as equal")
	}
}

func TestAdoptSliceField_ZeroLength_TakesFresh(t *testing.T) {
	var live []storage.Source
	fresh := []storage.Source{{SourceID: "abc", SourceTitle: "Fresh"}}
	var pending *[]storage.Source
	adoptSliceField(&live, fresh, &pending)

	if len(live) != 1 || live[0].SourceID != "abc" {
		t.Fatalf("got live=%v, want fresh sources applied", live)
	}
	if pending != nil {
		t.Fatalf("got pending=%v, want nil", pending)
	}
}

func TestAdoptSliceField_NonNilEmpty_TakesFresh(t *testing.T) {
	// Sources has no bson "omitempty" on the live document, so a brand-new
	// part's live value is a non-nil empty slice, not nil — this must still
	// be treated as "operator never set this", not "operator already set an
	// empty value deliberately".
	live := []storage.Source{}
	fresh := []storage.Source{{SourceID: "abc", SourceTitle: "Fresh"}}
	var pending *[]storage.Source
	adoptSliceField(&live, fresh, &pending)

	if len(live) != 1 || live[0].SourceID != "abc" {
		t.Fatalf("got live=%v, want fresh sources applied despite live being non-nil empty", live)
	}
	if pending != nil {
		t.Fatalf("got pending=%v, want nil", pending)
	}
}

func TestAdoptSliceField_AlreadySet_Preserved(t *testing.T) {
	live := []storage.Source{{SourceID: "operator-added", SourceTitle: "Mine"}}
	fresh := []storage.Source{{SourceID: "lineup", SourceTitle: "Fresh"}}
	var pending *[]storage.Source
	adoptSliceField(&live, fresh, &pending)

	if len(live) != 1 || live[0].SourceID != "operator-added" {
		t.Fatalf("got live=%v, want operator's sources preserved", live)
	}
	if pending == nil || len(*pending) != 1 || (*pending)[0].SourceID != "lineup" {
		t.Fatalf("got pending=%v, want lineup's sources offered as pending", pending)
	}
}

func TestSyncSliceField_NilLiveNonNilEmptyBaseline_NoFalseDivergence(t *testing.T) {
	// Reproduces the exact real-world shape: live decoded from Mongo with no
	// custom links (nil, due to bson "omitempty"), baseline previously
	// initialized via newSyncBaseline's append-based construction (non-nil
	// empty), fresh has real new content from bb-lineup this run. Before the
	// sliceEqual fix, this was incorrectly treated as a human edit and
	// parked as pending instead of just being applied.
	var live []storage.CustomLink
	baseline := []storage.CustomLink{}
	fresh := []storage.CustomLink{{Title: "New Link", URL: "https://example.com"}}
	var pending *[]storage.CustomLink

	syncSliceField(&live, &baseline, fresh, &pending)

	if len(live) != 1 || live[0].Title != "New Link" {
		t.Fatalf("got live=%v, want fresh custom link applied, not treated as a conflict", live)
	}
	if pending != nil {
		t.Fatalf("got pending=%v, want nil — this was never a real divergence", pending)
	}
}

func TestSyncSliceField_RealDivergence_StillDetected(t *testing.T) {
	live := []storage.Source{{SourceID: "operator-added", SourceTitle: "Mine"}}
	baseline := []storage.Source{} // matches what sync last wrote: nothing
	fresh := []storage.Source{{SourceID: "lineup", SourceTitle: "Fresh"}}
	var pending *[]storage.Source

	syncSliceField(&live, &baseline, fresh, &pending)

	if len(live) != 1 || live[0].SourceID != "operator-added" {
		t.Fatalf("got live=%v, want operator's manually-added source preserved", live)
	}
	if pending == nil || len(*pending) != 1 || (*pending)[0].SourceID != "lineup" {
		t.Fatalf("got pending=%v, want lineup's source offered as pending", pending)
	}
}

func TestSyncPartNumberField_NoDivergence_AppliesFresh(t *testing.T) {
	n := 1
	existing := &storage.LessonPart{PartNumber: &n}
	bn := 1
	baseline := &storage.LessonPartSyncBaseline{PartNumber: &bn}
	pending := &storage.LessonPartSyncPending{}

	syncPartNumberField(existing, baseline, 2, pending)

	if existing.PartNumber == nil || *existing.PartNumber != 2 {
		t.Fatalf("got PartNumber=%v, want 2", existing.PartNumber)
	}
	if baseline.PartNumber == nil || *baseline.PartNumber != 2 {
		t.Fatalf("got baseline.PartNumber=%v, want 2", baseline.PartNumber)
	}
	if pending.PartNumber != nil {
		t.Fatalf("got pending.PartNumber=%v, want nil", pending.PartNumber)
	}
}

func TestSyncPartNumberField_Diverged_LeavesAlone(t *testing.T) {
	operatorSet := 5
	existing := &storage.LessonPart{PartNumber: &operatorSet}
	bn := 1
	baseline := &storage.LessonPartSyncBaseline{PartNumber: &bn}
	pending := &storage.LessonPartSyncPending{}

	syncPartNumberField(existing, baseline, 2, pending)

	if *existing.PartNumber != 5 {
		t.Fatalf("got PartNumber=%v, want preserved 5", *existing.PartNumber)
	}
	if pending.PartNumber == nil || *pending.PartNumber != 2 {
		t.Fatalf("got pending.PartNumber=%v, want 2", pending.PartNumber)
	}
}

func TestAdoptPartNumberField_Nil_TakesFresh(t *testing.T) {
	existing := &storage.LessonPart{PartNumber: nil}
	pending := &storage.LessonPartSyncPending{}

	adoptPartNumberField(existing, 3, pending)

	if existing.PartNumber == nil || *existing.PartNumber != 3 {
		t.Fatalf("got PartNumber=%v, want 3", existing.PartNumber)
	}
	if pending.PartNumber != nil {
		t.Fatalf("got pending.PartNumber=%v, want nil", pending.PartNumber)
	}
}

func TestAdoptPartNumberField_AlreadySet_Preserved(t *testing.T) {
	operatorSet := 7
	existing := &storage.LessonPart{PartNumber: &operatorSet}
	pending := &storage.LessonPartSyncPending{}

	adoptPartNumberField(existing, 3, pending)

	if *existing.PartNumber != 7 {
		t.Fatalf("got PartNumber=%v, want preserved 7", *existing.PartNumber)
	}
	if pending.PartNumber == nil || *pending.PartNumber != 3 {
		t.Fatalf("got pending.PartNumber=%v, want 3", pending.PartNumber)
	}
}

func TestApplyBBLineupSync_FirstEncounter_InitializesBaselineOnly(t *testing.T) {
	existing := &storage.LessonPart{
		Title:       "Original Title",
		Description: "Original Description",
		ExternalID:  "slot-1",
	}
	fresh := bbLineupFreshFields{
		PartType: "live_lesson", EventID: "evt-1",
		Title: "Fresh Title", Description: "Fresh Description",
		Date: time.Now(), PartNumber: 1, Order: 0,
	}

	applyBBLineupSync(existing, fresh)

	if existing.Title != "Original Title" || existing.Description != "Original Description" {
		t.Fatalf("ship-day backfill pass must not apply fresh content, got Title=%q Description=%q", existing.Title, existing.Description)
	}
	if existing.SyncBaseline == nil {
		t.Fatal("expected SyncBaseline to be initialized")
	}
	if existing.SyncBaseline.Title != "Original Title" {
		t.Fatalf("got baseline.Title=%q, want it to snapshot current live value", existing.SyncBaseline.Title)
	}
	if existing.PendingSync != nil {
		t.Fatalf("got PendingSync=%v, want nil on the backfill pass", existing.PendingSync)
	}
	// PartType/EventID are never admin-editable, so they're still applied unconditionally.
	if existing.PartType != "live_lesson" || existing.EventID != "evt-1" {
		t.Fatalf("expected PartType/EventID to be applied unconditionally even on backfill pass")
	}
}

func TestApplyBBLineupSync_SecondRun_RefreshesUntouchedFieldsOnly(t *testing.T) {
	existing := &storage.LessonPart{
		Title:       "Original Title",
		Description: "Original Description",
		ExternalID:  "slot-1",
	}
	// Simulate baseline already initialized from a prior run.
	existing.SyncBaseline = newSyncBaseline(existing)

	// Operator edits Description after the baseline was captured.
	existing.Description = "Operator's fixed description"

	fresh := bbLineupFreshFields{
		PartType: "live_lesson", EventID: "evt-1",
		Title: "Fresh Title", Description: "Fresh Description From Lineup",
		Date: time.Now(), PartNumber: 1, Order: 0,
	}
	applyBBLineupSync(existing, fresh)

	if existing.Title != "Fresh Title" {
		t.Fatalf("untouched Title should refresh, got %q", existing.Title)
	}
	if existing.Description != "Operator's fixed description" {
		t.Fatalf("operator-edited Description must be preserved, got %q", existing.Description)
	}
	if existing.PendingSync == nil || existing.PendingSync.Description == nil {
		t.Fatal("expected a pending Description value to be offered")
	}
	if *existing.PendingSync.Description != "Fresh Description From Lineup" {
		t.Fatalf("got pending Description=%q, want the fresh lineup value", *existing.PendingSync.Description)
	}
}

func TestAcceptPendingScalar_AppliesAndResetsBaseline(t *testing.T) {
	live, baseline := "operator value", "old baseline"
	pendingVal := "lineup value"
	pending := &pendingVal

	ok := acceptPendingScalar(&live, &baseline, &pending)

	if !ok {
		t.Fatal("expected acceptPendingScalar to report success")
	}
	if live != "lineup value" || baseline != "lineup value" || pending != nil {
		t.Fatalf("got live=%q baseline=%q pending=%v, want both set to lineup value and pending cleared", live, baseline, pending)
	}
}

func TestAcceptPendingScalar_NothingPending_ReturnsFalse(t *testing.T) {
	live, baseline := "x", "x"
	var pending *string

	ok := acceptPendingScalar(&live, &baseline, &pending)

	if ok {
		t.Fatal("expected false when nothing is pending")
	}
}
