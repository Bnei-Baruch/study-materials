package common

import (
	"sync"
	"time"
)

// Lesson represents a single study material lesson
type Lesson struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Date        time.Time `json:"date"`
	Content     string    `json:"content"`
	Language    string    `json:"language"`
	OriginalURL string    `json:"original_url"`
}

// LessonCache stores lessons in memory
type LessonCache struct {
	sync.RWMutex
	LessonsByLanguage map[string][]Lesson
	LessonsById       map[string]Lesson
	LastUpdated       time.Time
}

// Cache is the global lesson cache
var Cache = &LessonCache{
	LessonsByLanguage: make(map[string][]Lesson),
	LessonsById:       make(map[string]Lesson),
}

// InitCache initializes the lesson cache
func InitCache() {
	Cache.Lock()
	defer Cache.Unlock()
	Cache.LastUpdated = time.Now()
}

// UpdateLessons updates the cache with new lessons
func (c *LessonCache) UpdateLessons(lessons []Lesson, maxPerLanguage int) {
	c.Lock()
	defer c.Unlock()

	// Clear existing data
	c.LessonsByLanguage = make(map[string][]Lesson)
	c.LessonsById = make(map[string]Lesson)

	// Group by language and keep only last N
	languageMap := make(map[string][]Lesson)
	for _, lesson := range lessons {
		languageMap[lesson.Language] = append(languageMap[lesson.Language], lesson)
	}

	// Sort by date (newest first) and keep only maxPerLanguage
	for lang, langLessons := range languageMap {
		// Simple bubble sort by date (descending)
		for i := 0; i < len(langLessons); i++ {
			for j := i + 1; j < len(langLessons); j++ {
				if langLessons[j].Date.After(langLessons[i].Date) {
					langLessons[i], langLessons[j] = langLessons[j], langLessons[i]
				}
			}
		}

		// Keep only maxPerLanguage
		if len(langLessons) > maxPerLanguage {
			langLessons = langLessons[:maxPerLanguage]
		}

		c.LessonsByLanguage[lang] = langLessons

		// Also add to ID map
		for _, lesson := range langLessons {
			c.LessonsById[lesson.ID] = lesson
		}
	}

	c.LastUpdated = time.Now()
}

// GetLessonsByLanguage returns lessons for a specific language
func (c *LessonCache) GetLessonsByLanguage(lang string) []Lesson {
	c.RLock()
	defer c.RUnlock()
	return c.LessonsByLanguage[lang]
}

// GetLessonByID returns a specific lesson by ID
func (c *LessonCache) GetLessonByID(id string) (Lesson, bool) {
	c.RLock()
	defer c.RUnlock()
	lesson, ok := c.LessonsById[id]
	return lesson, ok
}

// GetLanguages returns all available languages
func (c *LessonCache) GetLanguages() []string {
	c.RLock()
	defer c.RUnlock()
	
	languages := make([]string, 0, len(c.LessonsByLanguage))
	for lang := range c.LessonsByLanguage {
		languages = append(languages, lang)
	}
	return languages
}

// GetFirstLanguage returns the first available language (for default)
func (c *LessonCache) GetFirstLanguage() string {
	c.RLock()
	defer c.RUnlock()
	
	for lang := range c.LessonsByLanguage {
		return lang
	}
	return ""
}


