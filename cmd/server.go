package cmd

import (
	"log"
	"time"

	"github.com/Bnei-Baruch/study-material-service/api"
	"github.com/Bnei-Baruch/study-material-service/integrations/kabbalahmedia"
	"github.com/Bnei-Baruch/study-material-service/storage"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var serverCmd = &cobra.Command{
	Use:   "server",
	Short: "Start the API server",
	Long:  "Start the REST API server to serve study materials",
	Run:   serverFn,
}

func init() {
	rootCmd.AddCommand(serverCmd)
}

func serverFn(cmd *cobra.Command, args []string) {
	// Initialize MongoDB storage
	mongoURI := viper.GetString("mongodb.uri")
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017"
	}
	mongoDatabase := viper.GetString("mongodb.database")
	if mongoDatabase == "" {
		mongoDatabase = "study_materials_db"
	}

	mongoPartStore, err := storage.NewMongoDBStore(mongoURI, mongoDatabase)
	if err != nil {
		log.Fatalf("Failed to initialize MongoDB storage: %v", err)
	}
	partStore := mongoPartStore

	// Create event store using the same MongoDB database
	mongoEventStore, err := storage.NewMongoDBEventStore(mongoPartStore.GetDatabase())
	if err != nil {
		log.Fatalf("Failed to initialize MongoDB event store: %v", err)
	}
	eventStore := mongoEventStore

	// Create event type store using the same MongoDB database
	mongoEventTypeStore, err := storage.NewMongoDBEventTypeStore(mongoPartStore.GetDatabase())
	if err != nil {
		log.Fatalf("Failed to initialize MongoDB event type store: %v", err)
	}

	// Seed default event types on first run
	if err := storage.SeedDefaultEventTypes(mongoEventTypeStore); err != nil {
		log.Fatalf("Failed to seed default event types: %v", err)
	}

	// Backfill part_number for parts created before the field existed
	if err := storage.MigrateLegacyParts(partStore); err != nil {
		log.Fatalf("Failed to migrate legacy parts: %v", err)
	}

	log.Printf("Initialized MongoDB storage: %s/%s", mongoURI, mongoDatabase)

	// Initialize kabbalahmedia client
	kabbalahmediaURL := viper.GetString("kabbalahmedia.sqdata_url")
	if kabbalahmediaURL == "" {
		kabbalahmediaURL = "https://kabbalahmedia.info/backend/sqdata"
	}
	timeout := viper.GetDuration("kabbalahmedia.timeout")
	if timeout == 0 {
		timeout = 120 * time.Second
	}
	kabbalahmediaClient := kabbalahmedia.NewClient(kabbalahmediaURL, timeout)
	log.Printf("Initialized kabbalahmedia client: %s (timeout: %v)", kabbalahmediaURL, timeout)

	// Load templates configuration
	templatesPath := viper.GetString("templates.path")
	if templatesPath == "" {
		templatesPath = "./templates.json"
	}
	jsonTemplateConfig, err := storage.LoadTemplates(templatesPath)
	if err != nil {
		log.Fatalf("Failed to load templates from JSON: %v", err)
	}
	log.Printf("Loaded %d templates in %d languages from JSON", len(jsonTemplateConfig.Templates), len(jsonTemplateConfig.Languages))

	// Initialize template store
	mongoTemplateStore, err := storage.NewMongoDBTemplateStore(mongoEventStore.GetDatabase())
	if err != nil {
		log.Fatalf("Failed to initialize MongoDB template store: %v", err)
	}

	// Initialize MongoDB with JSON data on first run (if not already initialized)
	if err := mongoTemplateStore.InitializeFromJSON(jsonTemplateConfig); err != nil {
		log.Fatalf("Failed to initialize templates in MongoDB: %v", err)
	}

	// Load templates from MongoDB
	templateConfig, err := mongoTemplateStore.GetConfig()
	if err != nil {
		log.Fatalf("Failed to load templates from MongoDB: %v", err)
	}
	log.Printf("Loaded %d templates from MongoDB", len(templateConfig.Templates))

	// Load API secret key
	apiSecretKey := viper.GetString("api.secret_key")
	if apiSecretKey == "" {
		log.Println("WARNING: API_SECRET_KEY is not set — write endpoints are unprotected")
	} else {
		log.Println("API secret key protection enabled")
	}

	// Ensure canonical event type colors (fixes legacy DB records)
	storage.EnsureEventTypeColors(mongoEventTypeStore)

	// Start API server with dependencies
	app := api.NewApp(partStore, eventStore, mongoEventTypeStore, mongoTemplateStore, kabbalahmediaClient, templateConfig, apiSecretKey)

	// Background sync from events.kli.one every 10 minutes
	go func() {
		app.SyncExternalEvents()
		ticker := time.NewTicker(10 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			app.SyncExternalEvents()
		}
	}()

	app.Init()
}
