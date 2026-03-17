package storage

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// MongoDBEventTypeStore manages MongoDB-based storage for event types
type MongoDBEventTypeStore struct {
	collection *mongo.Collection
}

// NewMongoDBEventTypeStore creates a new MongoDB event type store
func NewMongoDBEventTypeStore(database *mongo.Database) (*MongoDBEventTypeStore, error) {
	collection := database.Collection("event_types")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	indexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "name", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: bson.D{{Key: "order", Value: 1}},
		},
	}
	if _, err := collection.Indexes().CreateMany(ctx, indexes); err != nil {
		return nil, fmt.Errorf("failed to create event_types indexes: %w", err)
	}

	return &MongoDBEventTypeStore{collection: collection}, nil
}

// CreateEventType inserts a new event type
func (s *MongoDBEventTypeStore) CreateEventType(et *EventType) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if et.ID == "" {
		et.ID = generateShortID()
	}
	now := time.Now()
	et.CreatedAt = now
	et.UpdatedAt = now

	if _, err := s.collection.InsertOne(ctx, et); err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return fmt.Errorf("event type with name %q already exists", et.Name)
		}
		return fmt.Errorf("failed to create event type: %w", err)
	}
	return nil
}

// GetEventType retrieves an event type by ID
func (s *MongoDBEventTypeStore) GetEventType(id string) (*EventType, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var et EventType
	if err := s.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&et); err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("event type not found: %s", id)
		}
		return nil, fmt.Errorf("failed to get event type: %w", err)
	}
	return &et, nil
}

// GetEventTypeByName retrieves an event type by name slug
func (s *MongoDBEventTypeStore) GetEventTypeByName(name string) (*EventType, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var et EventType
	if err := s.collection.FindOne(ctx, bson.M{"name": name}).Decode(&et); err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("event type not found: %s", name)
		}
		return nil, fmt.Errorf("failed to get event type by name: %w", err)
	}
	return &et, nil
}

// ListEventTypes returns all event types sorted by order
func (s *MongoDBEventTypeStore) ListEventTypes() ([]*EventType, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	opts := options.Find().SetSort(bson.D{{Key: "order", Value: 1}})
	cursor, err := s.collection.Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, fmt.Errorf("failed to list event types: %w", err)
	}
	defer cursor.Close(ctx)

	var types []*EventType
	if err = cursor.All(ctx, &types); err != nil {
		return nil, fmt.Errorf("failed to decode event types: %w", err)
	}
	return types, nil
}

// UpdateEventType saves changes to an existing event type
func (s *MongoDBEventTypeStore) UpdateEventType(et *EventType) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	et.UpdatedAt = time.Now()
	filter := bson.M{"_id": et.ID}
	update := bson.M{"$set": et}
	opts := options.Update().SetUpsert(false)

	result, err := s.collection.UpdateOne(ctx, filter, update, opts)
	if err != nil {
		return fmt.Errorf("failed to update event type: %w", err)
	}
	if result.MatchedCount == 0 {
		return fmt.Errorf("event type not found: %s", et.ID)
	}
	return nil
}

// DeleteEventType deletes an event type by ID
func (s *MongoDBEventTypeStore) DeleteEventType(id string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := s.collection.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil {
		return fmt.Errorf("failed to delete event type: %w", err)
	}
	if result.DeletedCount == 0 {
		return fmt.Errorf("event type not found: %s", id)
	}
	return nil
}

// CountEventTypes returns the number of event types in the collection
func (s *MongoDBEventTypeStore) CountEventTypes() (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	count, err := s.collection.CountDocuments(ctx, bson.M{})
	if err != nil {
		return 0, fmt.Errorf("failed to count event types: %w", err)
	}
	return count, nil
}
