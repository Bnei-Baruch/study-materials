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
				"bg":    "Сутрешен урок",
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
				"bg":    "Обеден урок",
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
				"bg":    "Вечерен урок",
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
				"bg":    "Трапеза",
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
				"bg":    "Конгрес",
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
				"bg":    "Лекция",
			},
		},
		{
			name:  "other",
			color: "gray",
			order: 6,
			titles: map[string]string{
				"he":    "אחר",
				"en":    "Other",
				"ru":    "Другое",
				"es":    "Otro",
				"de":    "Andere",
				"it":    "Altro",
				"fr":    "Autre",
				"uk":    "Інше",
				"tr":    "Diğer",
				"pt-BR": "Outro",
				"bg":    "Друго",
			},
		},
		{
			name:  "holiday",
			color: "orange",
			order: 7,
			titles: map[string]string{
				"he":    "חג",
				"en":    "Holiday",
				"ru":    "Праздник",
				"es":    "Festividad",
				"de":    "Feiertag",
				"it":    "Festività",
				"fr":    "Fête",
				"uk":    "Свято",
				"tr":    "Bayram",
				"pt-BR": "Feriado",
				"bg":    "Празник",
			},
		},
		{
			name:  "special_event",
			color: "teal",
			order: 8,
			titles: map[string]string{
				"he":    "אירוע מיוחד",
				"en":    "Special Event",
				"ru":    "Специальное мероприятие",
				"es":    "Evento especial",
				"de":    "Besondere Veranstaltung",
				"it":    "Evento speciale",
				"fr":    "Événement spécial",
				"uk":    "Особлива подія",
				"tr":    "Özel Etkinlik",
				"pt-BR": "Evento Especial",
				"bg":    "Специално събитие",
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

// EnsureEventTypeColors updates the color of specific event types to their
// canonical values. Run on every startup to fix legacy DB records.
func EnsureEventTypeColors(store EventTypeStore) {
	updates := map[string]string{
		"holiday":       "orange",
		"special_event": "teal",
		"convention":    "purple",
	}
	for name, color := range updates {
		et, err := store.GetEventTypeByName(name)
		if err != nil || et == nil {
			continue
		}
		if et.Color != color {
			et.Color = color
			if err := store.UpdateEventType(et); err != nil {
				log.Printf("Failed to update color for %s: %v", name, err)
			}
		}
	}
}
