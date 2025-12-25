package kabbalahmedia

import (
	"net/http"
	"time"
)

// Client handles HTTP requests to kabbalahmedia APIs
type Client struct {
	baseURL    string
	httpClient *http.Client
}

// NewClient creates a new kabbalahmedia API client
func NewClient(baseURL string, timeout time.Duration) *Client {
	return &Client{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: timeout,
		},
	}
}
