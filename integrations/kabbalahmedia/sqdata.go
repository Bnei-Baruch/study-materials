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
	Number   string       `json:"number,omitempty"` // Article number within its collection (e.g. Rabash articles), when applicable
	Year     string       `json:"year,omitempty"`   // Publication year, when applicable
	Children []SourceNode `json:"children,omitempty"`
}

// articleCitationFormat renders "<author>. <article label + number, year>. <title>"
// for a standalone numbered/dated article (e.g. a Rabash article or letter) in a
// given language. Confirmed against real citations already published on
// study.kli.one; languages with no established convention there are omitted
// (callers fall back to a translated breadcrumb title instead).
var articleCitationFormat = map[string]string{
	"en": "%[1]s. Article No. %[2]s, %[3]s. %[4]s",
	"ru": "%[1]s. Статья %[2]s, %[3]s. %[4]s",
	"es": "%[1]s. Artículo Nº %[2]s, %[3]s. %[4]s",
	"de": "%[1]s. Artikel %[2]s, %[3]s. %[4]s",
	"uk": "%[1]s. Стаття %[2]s (%[3]s) «%[4]s»",
	"bg": "%[1]s. Статия %[2]s, %[3]s г. %[4]s",
}

// pageLabel is the standard abbreviation for "page" used when a citation
// includes a book/volume page number (from bb-lineup's own studyMaterialSource
// data, not the kabbalahmedia tree — it has no notion of page numbers).
var pageLabel = map[string]string{
	"he":    "עמ'",
	"en":    "p.",
	"ru":    "стр.",
	"es":    "pág.",
	"de":    "S.",
	"it":    "pag.",
	"fr":    "p.",
	"uk":    "стор.",
	"tr":    "s.",
	"pt-BR": "pág.",
	"bg":    "стр.",
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

// findSourcePath returns the chain of nodes from the author down to sourceID
// (inclusive), or nil if not found.
func findSourcePath(node SourceNode, sourceID string) []SourceNode {
	if node.ID == sourceID {
		return []SourceNode{node}
	}
	for _, child := range node.Children {
		if rest := findSourcePath(child, sourceID); rest != nil {
			return append([]SourceNode{node}, rest...)
		}
	}
	return nil
}

// GetSourceCitation renders a proper bibliographic citation for a source in a
// given language — e.g. "Рабаш. Статья 31, 1987. Что такое заключение союза в
// духовной работе" for a standalone numbered/dated article, or
// "Бааль Сулам. Учение десяти сфирот (ТЭС). Том 1. Часть 2. Внутреннее
// созерцание" for a chapter within a multi-volume book — instead of the raw
// " | "-joined breadcrumb GetSourceTitle returns. Falls back to that
// breadcrumb style (short author name, "." separators) when the source isn't
// a numbered/dated article or the language has no confirmed citation
// convention (see articleCitationFormat). pageNumber, when non-empty, is
// inserted as a "<page label> <N>" segment right before the final title —
// it comes from bb-lineup's own data (studyMaterialSource.bookPage), since
// the kabbalahmedia tree itself has no concept of page numbers.
func (c *Client) GetSourceCitation(sourceID string, language string, pageNumber string) (string, error) {
	if err := c.ensureSourcesCacheForLanguage(language); err != nil {
		return "", fmt.Errorf("failed to load sources for language %s: %w", language, err)
	}

	cacheMutex.RLock()
	langSources := cachedSources[language]
	cacheMutex.RUnlock()

	if langSources == nil {
		return "", fmt.Errorf("no sources cached for language %s", language)
	}

	var path []SourceNode
	for _, author := range langSources.Sources {
		if p := findSourcePath(author, sourceID); p != nil {
			path = p
			break
		}
	}
	if path == nil {
		return "", fmt.Errorf("source not found: %s", sourceID)
	}

	authorName := path[0].Name
	leaf := path[len(path)-1]

	if leaf.Type == "ARTICLE" && leaf.Number != "" && leaf.Year != "" {
		if format, ok := articleCitationFormat[language]; ok {
			return fmt.Sprintf(format, authorName, leaf.Number, leaf.Year, leaf.Name), nil
		}
	}

	segments := make([]string, 0, len(path)+1)
	for _, n := range path[1:] {
		segments = append(segments, n.Name)
	}
	if pageNumber != "" {
		if label, ok := pageLabel[language]; ok {
			leafTitle := segments[len(segments)-1]
			segments[len(segments)-1] = label + " " + pageNumber
			segments = append(segments, leafTitle)
		}
	}
	return authorName + ". " + strings.Join(segments, ". "), nil
}
