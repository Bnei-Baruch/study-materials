package storage

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// MongoDBEventStore manages MongoDB-based storage for events
type MongoDBEventStore struct {
	collection *mongo.Collection
}

// NewMongoDBEventStore creates a new MongoDB event store
func NewMongoDBEventStore(database *mongo.Database) (*MongoDBEventStore, error) {
	collection := database.Collection("events")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Create indexes for events collection
	if err := createEventIndexes(ctx, collection); err != nil {
		return nil, fmt.Errorf("failed to create event indexes: %w", err)
	}

	return &MongoDBEventStore{
		collection: collection,
	}, nil
}

// createEventIndexes creates indexes for the events collection
func createEventIndexes(ctx context.Context, collection *mongo.Collection) error {
	indexes := []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "public", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "date", Value: -1}},
		},
		{
			Keys: bson.D{{Key: "order", Value: 1}},
		},
		{
			Keys: bson.D{
				{Key: "public", Value: 1},
				{Key: "order", Value: 1},
				{Key: "date", Value: -1},
			},
		},
	}

	_, err := collection.Indexes().CreateMany(ctx, indexes)
	return err
}

// SaveEvent saves an event to MongoDB
func (s *MongoDBEventStore) SaveEvent(event *Event) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if event.ID == "" {
		event.ID = uuid.New().String()
	}
	if event.CreatedAt.IsZero() {
		event.CreatedAt = time.Now()
	}

	// Use upsert to insert or update
	filter := bson.M{"_id": event.ID}
	update := bson.M{"$set": event}
	opts := options.Update().SetUpsert(true)

	_, err := s.collection.UpdateOne(ctx, filter, update, opts)
	if err != nil {
		return fmt.Errorf("failed to save event: %w", err)
	}

	return nil
}

// GetEvent retrieves an event by ID
func (s *MongoDBEventStore) GetEvent(id string) (*Event, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var event Event
	filter := bson.M{"_id": id}

	err := s.collection.FindOne(ctx, filter).Decode(&event)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("event not found: %s", id)
		}
		return nil, fmt.Errorf("failed to get event: %w", err)
	}

	return &event, nil
}

// ListEvents lists all events
func (s *MongoDBEventStore) ListEvents() ([]*Event, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := s.collection.Find(ctx, bson.M{})
	if err != nil {
		return nil, fmt.Errorf("failed to list events: %w", err)
	}
	defer cursor.Close(ctx)

	var events []*Event
	if err = cursor.All(ctx, &events); err != nil {
		return nil, fmt.Errorf("failed to decode events: %w", err)
	}

	return events, nil
}

// ListEventsFiltered lists events with filters
func (s *MongoDBEventStore) ListEventsFiltered(filter bson.M, limit, offset int) ([]Event, int, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Count total matching documents
	total, err := s.collection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count events: %w", err)
	}

	// Build find options
	findOpts := options.Find().
		SetSort(bson.D{{Key: "order", Value: 1}, {Key: "date", Value: -1}})

	if limit > 0 {
		findOpts.SetLimit(int64(limit))
	}
	if offset > 0 {
		findOpts.SetSkip(int64(offset))
	}

	// Execute query
	cursor, err := s.collection.Find(ctx, filter, findOpts)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to find events: %w", err)
	}
	defer cursor.Close(ctx)

	var events []Event
	if err = cursor.All(ctx, &events); err != nil {
		return nil, 0, fmt.Errorf("failed to decode events: %w", err)
	}

	return events, int(total), nil
}

// DeleteEvent deletes an event by ID
func (s *MongoDBEventStore) DeleteEvent(id string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"_id": id}
	result, err := s.collection.DeleteOne(ctx, filter)
	if err != nil {
		return fmt.Errorf("failed to delete event: %w", err)
	}

	if result.DeletedCount == 0 {
		return fmt.Errorf("event not found: %s", id)
	}

	return nil
}


