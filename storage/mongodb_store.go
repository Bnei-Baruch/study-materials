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

// MongoDBStore manages MongoDB-based storage for lesson parts
type MongoDBStore struct {
	client     *mongo.Client
	database   *mongo.Database
	collection *mongo.Collection
}

// NewMongoDBStore creates a new MongoDB store instance
func NewMongoDBStore(uri, dbName string) (*MongoDBStore, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Connect to MongoDB
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MongoDB: %w", err)
	}

	// Ping to verify connection
	if err := client.Ping(ctx, nil); err != nil {
		return nil, fmt.Errorf("failed to ping MongoDB: %w", err)
	}

	database := client.Database(dbName)
	collection := database.Collection("lesson_parts")

	// Create indexes for performance
	if err := createIndexes(ctx, collection); err != nil {
		return nil, fmt.Errorf("failed to create indexes: %w", err)
	}

	return &MongoDBStore{
		client:     client,
		database:   database,
		collection: collection,
	}, nil
}

// createIndexes creates indexes for the lesson_parts collection
func createIndexes(ctx context.Context, collection *mongo.Collection) error {
	indexes := []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "event_id", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "language", Value: 1}},
		},
		{
			Keys: bson.D{
				{Key: "event_id", Value: 1},
				{Key: "order", Value: 1},
			},
		},
		{
			Keys: bson.D{
				{Key: "event_id", Value: 1},
				{Key: "language", Value: 1},
			},
		},
	}

	_, err := collection.Indexes().CreateMany(ctx, indexes)
	return err
}

// SavePart saves a lesson part to MongoDB
func (s *MongoDBStore) SavePart(part *LessonPart) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Generate ID if not set
	if part.ID == "" {
		part.ID = uuid.New().String()
	}

	// Set created time if not set
	if part.CreatedAt.IsZero() {
		part.CreatedAt = time.Now()
	}

	// Use upsert to insert or update
	filter := bson.M{"_id": part.ID}
	update := bson.M{"$set": part}
	opts := options.Update().SetUpsert(true)

	_, err := s.collection.UpdateOne(ctx, filter, update, opts)
	if err != nil {
		return fmt.Errorf("failed to save part: %w", err)
	}

	return nil
}

// GetPart retrieves a lesson part by ID
func (s *MongoDBStore) GetPart(id string) (*LessonPart, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var part LessonPart
	filter := bson.M{"_id": id}

	err := s.collection.FindOne(ctx, filter).Decode(&part)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("part not found: %s", id)
		}
		return nil, fmt.Errorf("failed to get part: %w", err)
	}

	return &part, nil
}

// ListParts returns all lesson parts
func (s *MongoDBStore) ListParts() ([]*LessonPart, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := s.collection.Find(ctx, bson.M{})
	if err != nil {
		return nil, fmt.Errorf("failed to list parts: %w", err)
	}
	defer cursor.Close(ctx)

	var parts []*LessonPart
	if err = cursor.All(ctx, &parts); err != nil {
		return nil, fmt.Errorf("failed to decode parts: %w", err)
	}

	return parts, nil
}

// DeletePart deletes a lesson part by ID
func (s *MongoDBStore) DeletePart(id string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"_id": id}
	result, err := s.collection.DeleteOne(ctx, filter)
	if err != nil {
		return fmt.Errorf("failed to delete part: %w", err)
	}

	if result.DeletedCount == 0 {
		return fmt.Errorf("part not found: %s", id)
	}

	return nil
}

// GetDatabase returns the MongoDB database instance
func (s *MongoDBStore) GetDatabase() *mongo.Database {
	return s.database
}

// Close closes the MongoDB connection
func (s *MongoDBStore) Close() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return s.client.Disconnect(ctx)
}


