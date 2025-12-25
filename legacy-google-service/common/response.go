package common

// UnitForClient represents the legacy API response format
type UnitForClient struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

// LanguageResponse represents available languages
type LanguageResponse struct {
	Languages []string `json:"languages"`
}

// SyncResponse represents the response from sync endpoint
type SyncResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Count   int    `json:"count"`
}


