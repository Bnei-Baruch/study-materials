package main

import (
	"fmt"
	"log"

	"github.com/Bnei-Baruch/study-material-service/cmd"
	"github.com/spf13/viper"
)

func main() {
	// Load configuration
	viper.SetConfigName("config")
	viper.SetConfigType("toml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("$HOME/.study-material-service")
	viper.AddConfigPath("/etc/study-material-service")

	// Set defaults
	viper.SetDefault("server.bind-address", ":8080")
	viper.SetDefault("app.max-lessons-per-language", 5)

	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			log.Println("No config file found, using defaults")
		} else {
			panic(fmt.Errorf("error reading config file: %s", err))
		}
	} else {
		log.Printf("Using config file: %s", viper.ConfigFileUsed())
	}

	// Execute command
	cmd.Execute()
}


