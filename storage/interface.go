package storage

import "go.mongodb.org/mongo-driver/bson"

// PartStore defines the interface for lesson part storage
type PartStore interface {
	SavePart(part *LessonPart) error
	GetPart(id string) (*LessonPart, error)
	ListParts() ([]*LessonPart, error)
	DeletePart(id string) error
}

// EventStore defines the interface for event storage
type EventStore interface {
	SaveEvent(event *Event) error
	GetEvent(id string) (*Event, error)
	ListEvents() ([]*Event, error)
	ListEventsFiltered(filter bson.M, limit, offset int) ([]Event, int, error)
	DeleteEvent(id string) error
}

// EventTypeStore defines the interface for event type storage
type EventTypeStore interface {
	CreateEventType(eventType *EventType) error
	GetEventType(id string) (*EventType, error)
	GetEventTypeByName(name string) (*EventType, error)
	ListEventTypes() ([]*EventType, error)
	UpdateEventType(eventType *EventType) error
	DeleteEventType(id string) error
	CountEventTypes() (int64, error)
}

// TemplateStore defines the interface for template storage
type TemplateStore interface {
	SaveConfig(config *TemplateConfig) error
	GetConfig() (*TemplateConfig, error)
	InitializeFromJSON(config *TemplateConfig) error
}

