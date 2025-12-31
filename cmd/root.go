package cmd

import (
	"fmt"
	"log"
	"os"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var rootCmd = &cobra.Command{
	Use:   "study-material-service",
	Short: "Study materials API service",
	Long:  "REST API service for serving study materials from Google Drive",
}

func init() {
	cobra.OnInitialize(initConfig)
}

// initConfig reads in config file and ENV variables if set.
func initConfig() {
	// Set config file name and paths
	viper.SetConfigName("config")
	viper.SetConfigType("toml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("/app") // Docker container path

	// Enable environment variable overrides
	viper.AutomaticEnv()
	
	// Set explicit mappings for environment variables
	viper.BindEnv("mongodb.uri", "MONGO_URI")
	viper.BindEnv("storage.type", "STORAGE_TYPE")
	viper.BindEnv("storage.data_dir", "DATA_DIR")
	viper.BindEnv("kabbalahmedia.sqdata_url", "KABBALAHMEDIA_URL")
	viper.BindEnv("kabbalahmedia.timeout", "KABBALAHMEDIA_TIMEOUT")
	viper.BindEnv("app.app-script-pass", "APP_SCRIPT_PASSWORD")
	viper.BindEnv("app.max-lessons-per-language", "MAX_LESSONS_PER_LANGUAGE")
	viper.BindEnv("templates.path", "TEMPLATES_PATH")

	// Read config file (if exists)
	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			log.Println("No config file found, using environment variables")
		} else {
			log.Printf("Error reading config file: %v", err)
		}
	} else {
		log.Printf("Using config file: %s", viper.ConfigFileUsed())
	}
}

// Execute runs the root command
func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}



