package kabbalahmedia

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
)

// SourceResult represents a search result from sqdata API
type SourceResult struct {
	ID    string `json:"id"`
	Title string `json:"title"`
	URL   string `json:"url"`
}

// SourceNode represents a node in the source hierarchy
type SourceNode struct {
	ID       string       `json:"id"`
	ParentID string       `json:"parent_id,omitempty"`
	Type     string       `json:"type,omitempty"`
	Name     string       `json:"name"`
	FullName string       `json:"full_name,omitempty"`
	Children []SourceNode `json:"children,omitempty"`
}

// SQDataResponse represents the API response
type SQDataResponse struct {
	Sources    []SourceNode  `json:"sources"`
	Tags       []interface{} `json:"tags"`
	Publishers []interface{} `json:"publishers"`
	Persons    []interface{} `json:"persons"`
}

var (
	cachedSources map[string]*SQDataResponse // language -> sources cache
	cacheMutex    sync.RWMutex
)

func init() {
	cachedSources = make(map[string]*SQDataResponse)
}

// SearchSources searches for sources in kabbalahmedia sqdata across multiple languages
func (c *Client) SearchSources(query string) ([]SourceResult, error) {
	// Support languages: Hebrew, Russian, English, Spanish
	languages := []string{"he", "ru", "en", "es"}

	// Fetch and cache sources for all languages if not already cached
	for _, lang := range languages {
		if err := c.ensureSourcesCacheForLanguage(lang); err != nil {
			return nil, fmt.Errorf("failed to fetch sources for %s: %w", lang, err)
		}
	}

	// If no query, return empty
	if strings.TrimSpace(query) == "" {
		return []SourceResult{}, nil
	}

	// Search through cached sources in all languages
	seenIDs := make(map[string]bool) // To avoid duplicates
	results := []SourceResult{}
	query = strings.ToLower(query)

	// Search in each language
	for _, lang := range languages {
		cacheMutex.RLock()
		langSources := cachedSources[lang]
		cacheMutex.RUnlock()

		if langSources == nil {
			continue
		}

		// Search recursively through the hierarchy
		for _, author := range langSources.Sources {
			c.searchNodeMultiLang(author, "", query, lang, &results, seenIDs)
		}
	}

	// Limit results
	if len(results) > 20 {
		results = results[:20]
	}

	return results, nil
}

// ensureSourcesCacheForLanguage fetches and caches sources for a specific language
func (c *Client) ensureSourcesCacheForLanguage(lang string) error {
	cacheMutex.RLock()
	if cachedSources[lang] != nil {
		cacheMutex.RUnlock()
		return nil
	}
	cacheMutex.RUnlock()

	cacheMutex.Lock()
	defer cacheMutex.Unlock()

	// Double-check after acquiring write lock
	if cachedSources[lang] != nil {
		return nil
	}

	// Construct language-specific URL using query parameter
	url := fmt.Sprintf("%s?language=%s", c.baseURL, lang)

	// Fetch from API
	resp, err := c.httpClient.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("API returned status %d for language %s", resp.StatusCode, lang)
	}

	var data SQDataResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return err
	}

	cachedSources[lang] = &data
	return nil
}

// searchNodeMultiLang recursively searches through the source hierarchy with language support
func (c *Client) searchNodeMultiLang(node SourceNode, path string, query string, lang string, results *[]SourceResult, seenIDs map[string]bool) {
	// Skip if we've already seen this source ID
	if seenIDs[node.ID] {
		return
	}

	// Build full path
	currentPath := path
	if currentPath != "" {
		currentPath += " | "
	}
	if node.FullName != "" {
		currentPath += node.FullName
	} else {
		currentPath += node.Name
	}

	// Check if current node matches
	if strings.Contains(strings.ToLower(node.Name), query) ||
		strings.Contains(strings.ToLower(node.FullName), query) {
		*results = append(*results, SourceResult{
			ID:    node.ID,
			Title: currentPath,
			URL:   fmt.Sprintf("https://kabbalahmedia.info/sources/%s", node.ID), // No language in URL
		})
		seenIDs[node.ID] = true
	}

	// Search children
	for _, child := range node.Children {
		c.searchNodeMultiLang(child, currentPath, query, lang, results, seenIDs)
	}
}

// GetSourceTitle retrieves the title of a source in a specific language
func (c *Client) GetSourceTitle(sourceID string, language string) (string, error) {
	// Ensure cache is loaded for the requested language
	if err := c.ensureSourcesCacheForLanguage(language); err != nil {
		return "", fmt.Errorf("failed to load sources for language %s: %w", language, err)
	}

	cacheMutex.RLock()
	langSources := cachedSources[language]
	cacheMutex.RUnlock()

	if langSources == nil {
		return "", fmt.Errorf("no sources cached for language %s", language)
	}

	// Search for the source in the hierarchy
	for _, author := range langSources.Sources {
		if title := findSourceTitle(author, "", sourceID); title != "" {
			return title, nil
		}
	}

	return "", fmt.Errorf("source not found: %s", sourceID)
}

// findSourceTitle recursively searches for a source and returns its full path title
func findSourceTitle(node SourceNode, path string, sourceID string) string {
	// Build full path
	currentPath := path
	if currentPath != "" {
		currentPath += " | "
	}
	if node.FullName != "" {
		currentPath += node.FullName
	} else {
		currentPath += node.Name
	}

	// Check if this is the source we're looking for
	if node.ID == sourceID {
		return currentPath
	}

	// Search children
	for _, child := range node.Children {
		if title := findSourceTitle(child, currentPath, sourceID); title != "" {
			return title
		}
	}

	return ""
}
