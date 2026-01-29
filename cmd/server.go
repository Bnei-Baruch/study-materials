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

	// Start API server with dependencies
	app := api.NewApp(partStore, eventStore, mongoTemplateStore, kabbalahmediaClient, templateConfig)
	app.Init()
}
