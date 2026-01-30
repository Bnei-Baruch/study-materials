package storage

import (
	"encoding/json"
	"os"
)

// TemplateConfig holds all template configurations
type TemplateConfig struct {
	Languages   []string             `json:"languages" bson:"languages"`
	Preparation map[string]string    `json:"preparation" bson:"preparation"`
	Templates   []TemplateDefinition `json:"templates" bson:"templates"`
}

// TemplateDefinition defines a title template with translations
type TemplateDefinition struct {
	ID           string            `json:"id" bson:"id"`
	Translations map[string]string `json:"translations" bson:"translations"`
	Visible      bool              `json:"visible" bson:"visible"` // Controls if template appears in PartForm
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

	// Set default visibility for templates that don't have it
	for i := range config.Templates {
		// If Visible is false (zero value) and it's an existing template, default to true
		if !config.Templates[i].Visible && config.Templates[i].ID != "" {
			config.Templates[i].Visible = true
		}
	}

	return &config, nil
}

// SaveTemplates writes template configuration back to file
func SaveTemplates(filepath string, config *TemplateConfig) error {
	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filepath, data, 0644)
}


