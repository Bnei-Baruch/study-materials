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
	// Initialize JSON storage for POC
	dataDir := viper.GetString("storage.data_dir")
	if dataDir == "" {
		dataDir = "./data" // Default
	}
	store, err := storage.NewStore(dataDir)
	if err != nil {
		log.Fatalf("Failed to initialize storage: %v", err)
	}
	log.Printf("Initialized JSON storage at: %s", dataDir)

	// Initialize kabbalahmedia client for POC
	kabbalahmediaURL := viper.GetString("kabbalahmedia.sqdata_url")
	if kabbalahmediaURL == "" {
		kabbalahmediaURL = "https://kabbalahmedia.info/backend/sqdata" // Default
	}
	timeout := viper.GetDuration("kabbalahmedia.timeout")
	if timeout == 0 {
		timeout = 120 * time.Second // Increased timeout for large sqdata file
	}
	kabbalahmediaClient := kabbalahmedia.NewClient(kabbalahmediaURL, timeout)
	log.Printf("Initialized kabbalahmedia client: %s (timeout: %v)", kabbalahmediaURL, timeout)

	// Load templates configuration
	templatesPath := viper.GetString("templates.path")
	if templatesPath == "" {
		templatesPath = "./templates.json" // Default
	}
	templateConfig, err := storage.LoadTemplates(templatesPath)
	if err != nil {
		log.Fatalf("Failed to load templates: %v", err)
	}
	log.Printf("Loaded %d templates in %d languages", len(templateConfig.Templates), len(templateConfig.Languages))

	// Pre-fetch sources in background to warm up cache
	go func() {
		log.Println("Pre-fetching sources from kabbalahmedia...")
		if _, err := kabbalahmediaClient.SearchSources("test"); err != nil {
			log.Printf("Warning: Failed to pre-fetch sources: %v", err)
		} else {
			log.Println("✓ Sources cache warmed up successfully")
		}
	}()

	// Start API server with dependencies
	app := api.NewApp(store, kabbalahmediaClient, templateConfig)
	app.Init()
}
