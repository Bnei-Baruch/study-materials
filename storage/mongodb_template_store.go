package storage

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// MongoDBTemplateStore manages MongoDB-based storage for template configuration
type MongoDBTemplateStore struct {
	collection *mongo.Collection
}

// NewMongoDBTemplateStore creates a new MongoDB template store
func NewMongoDBTemplateStore(database *mongo.Database) (*MongoDBTemplateStore, error) {
	collection := database.Collection("templates")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Create indexes for templates collection
	if err := createTemplateIndexes(ctx, collection); err != nil {
		return nil, fmt.Errorf("failed to create template indexes: %w", err)
	}

	return &MongoDBTemplateStore{
		collection: collection,
	}, nil
}

// createTemplateIndexes creates indexes for the templates collection
func createTemplateIndexes(ctx context.Context, collection *mongo.Collection) error {
	indexes := []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "_id", Value: 1}},
		},
	}

	_, err := collection.Indexes().CreateMany(ctx, indexes)
	return err
}

// SaveConfig saves the entire template configuration to MongoDB
func (s *MongoDBTemplateStore) SaveConfig(config *TemplateConfig) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Use fixed ID "config" to store the entire configuration as a single document
	filter := bson.M{"_id": "config"}
	update := bson.M{"$set": config}
	opts := options.Update().SetUpsert(true)

	_, err := s.collection.UpdateOne(ctx, filter, update, opts)
	if err != nil {
		return fmt.Errorf("failed to save template config: %w", err)
	}

	return nil
}

// GetConfig retrieves the entire template configuration from MongoDB
func (s *MongoDBTemplateStore) GetConfig() (*TemplateConfig, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var config TemplateConfig
	filter := bson.M{"_id": "config"}

	err := s.collection.FindOne(ctx, filter).Decode(&config)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("template config not found")
		}
		return nil, fmt.Errorf("failed to get template config: %w", err)
	}

	return &config, nil
}

// InitializeFromJSON initializes MongoDB with data from TemplateConfig (for first run)
// This is used to seed MongoDB from the templates.json file on first startup
func (s *MongoDBTemplateStore) InitializeFromJSON(config *TemplateConfig) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Check if config already exists
	count, err := s.collection.CountDocuments(ctx, bson.M{"_id": "config"})
	if err != nil {
		return fmt.Errorf("failed to check existing config: %w", err)
	}

	// If config already exists, don't overwrite it
	if count > 0 {
		return nil
	}

	// Save the new config
	return s.SaveConfig(config)
}
