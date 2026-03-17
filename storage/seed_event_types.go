package storage

import (
	"log"
)

// SeedDefaultEventTypes populates the event_types collection with default types
// if the collection is empty (first run).
func SeedDefaultEventTypes(store EventTypeStore) error {
	count, err := store.CountEventTypes()
	if err != nil {
		return err
	}
	if count > 0 {
		return nil // Already seeded
	}

	log.Println("Seeding default event types...")

	defaults := []struct {
		name   string
		color  string
		order  int
		titles map[string]string
	}{
		{
			name:  "morning_lesson",
			color: "blue",
			order: 0,
			titles: map[string]string{
				"he": "שיעור בוקר",
				"en": "Morning Lesson",
				"ru": "Утренний урок",
				"es": "Lección matutina",
				"de": "Morgenlektion",
				"it": "Lezione mattutina",
				"fr": "Leçon du matin",
				"uk": "Ранковий урок",
				"tr": "Sabah Dersi",
				"pt-BR": "Aula da Manhã",
			},
		},
		{
			name:  "noon_lesson",
			color: "amber",
			order: 1,
			titles: map[string]string{
				"he": "שיעור צהריים",
				"en": "Noon Lesson",
				"ru": "Дневной урок",
				"es": "Lección del mediodía",
				"de": "Mittagslektion",
				"it": "Lezione di mezzogiorno",
				"fr": "Leçon de midi",
				"uk": "Денний урок",
				"tr": "Öğlen Dersi",
				"pt-BR": "Aula do Meio-dia",
			},
		},
		{
			name:  "evening_lesson",
			color: "indigo",
			order: 2,
			titles: map[string]string{
				"he": "שיעור ערב",
				"en": "Evening Lesson",
				"ru": "Вечерний урок",
				"es": "Lección nocturna",
				"de": "Abendlektion",
				"it": "Lezione serale",
				"fr": "Leçon du soir",
				"uk": "Вечірній урок",
				"tr": "Akşam Dersi",
				"pt-BR": "Aula da Noite",
			},
		},
		{
			name:  "meal",
			color: "green",
			order: 3,
			titles: map[string]string{
				"he": "סעודה",
				"en": "Meal",
				"ru": "Трапеза",
				"es": "Comida",
				"de": "Mahlzeit",
				"it": "Pasto",
				"fr": "Repas",
				"uk": "Трапеза",
				"tr": "Yemek",
				"pt-BR": "Refeição",
			},
		},
		{
			name:  "convention",
			color: "purple",
			order: 4,
			titles: map[string]string{
				"he": "כנס",
				"en": "Convention",
				"ru": "Конгресс",
				"es": "Congreso",
				"de": "Kongress",
				"it": "Congresso",
				"fr": "Congrès",
				"uk": "Конгрес",
				"tr": "Kongre",
				"pt-BR": "Congresso",
			},
		},
		{
			name:  "lecture",
			color: "yellow",
			order: 5,
			titles: map[string]string{
				"he": "הרצאה",
				"en": "Lecture",
				"ru": "Лекция",
				"es": "Conferencia",
				"de": "Vortrag",
				"it": "Conferenza",
				"fr": "Conférence",
				"uk": "Лекція",
				"tr": "Ders",
				"pt-BR": "Palestra",
			},
		},
		{
			name:  "other",
			color: "gray",
			order: 6,
			titles: map[string]string{
				"he": "אחר",
				"en": "Other",
				"ru": "Другое",
				"es": "Otro",
				"de": "Andere",
				"it": "Altro",
				"fr": "Autre",
				"uk": "Інше",
				"tr": "Diğer",
				"pt-BR": "Outro",
			},
		},
	}

	for _, d := range defaults {
		et := &EventType{
			Name:   d.name,
			Color:  d.color,
			Order:  d.order,
			Titles: d.titles,
		}
		if err := store.CreateEventType(et); err != nil {
			return err
		}
	}

	log.Printf("Seeded %d default event types", len(defaults))
	return nil
}
