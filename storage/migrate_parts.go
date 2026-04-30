package storage

// MigrateLegacyParts is intentionally a no-op.
// Existing parts retain their original order/part_number values as-is.
// The UI falls back to displaying order when part_number is unset.
func MigrateLegacyParts(store PartStore) error {
	return nil
}
