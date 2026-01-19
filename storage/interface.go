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


