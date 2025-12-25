package storage

import (
	"encoding/json"
	"os"
)

// TemplateConfig holds all template configurations
type TemplateConfig struct {
	Languages   []string             `json:"languages"`
	Preparation map[string]string    `json:"preparation"`
	Templates   []TemplateDefinition `json:"templates"`
}

// TemplateDefinition defines a title template with translations
type TemplateDefinition struct {
	ID           string            `json:"id"`
	Translations map[string]string `json:"translations"`
}

// LoadTemplates loads template configuration from file
func LoadTemplates(filepath string) (*TemplateConfig, error) {
	data, err := os.ReadFile(filepath)
	if err != nil {
		return nil, err
	}

	var config TemplateConfig
	if err := json.Unmarshal(data, &config); err != nil {
		return nil, err
	}

	return &config, nil
}


