package api

import (
	"log"
	"net/http"

	"github.com/Bnei-Baruch/study-material-service/integrations/kabbalahmedia"
	"github.com/Bnei-Baruch/study-material-service/storage"
	"github.com/gorilla/mux"
	"github.com/rs/cors"
	"github.com/spf13/viper"
)

// App represents the API application
type App struct {
	router              *mux.Router
	cors                *cors.Cors
	store               storage.PartStore
	eventStore          storage.EventStore
	kabbalahmediaClient *kabbalahmedia.Client
	templateConfig      *storage.TemplateConfig
}

// NewApp creates a new App instance with dependencies
func NewApp(partStore storage.PartStore, eventStore storage.EventStore, kabbalahmediaClient *kabbalahmedia.Client, templateConfig *storage.TemplateConfig) *App {
	return &App{
		store:               partStore,
		eventStore:          eventStore,
		kabbalahmediaClient: kabbalahmediaClient,
		templateConfig:      templateConfig,
	}
}

// Init initializes and starts the API server
func (a *App) Init() {
	a.initCors()
	a.initRouters()

	handler := a.cors.Handler(a.router)

	addr := viper.GetString("server.bind-address")
	log.Printf("Starting server on %s", addr)

	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatal(err)
	}
}

// initCors initializes CORS settings
func (a *App) initCors() {
	a.cors = cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions},
		AllowedHeaders: []string{"Accept", "Accept-Language", "Content-Type", "Authorization"},
		MaxAge:         0,
	})
}

// initRouters initializes API routes
func (a *App) initRouters() {
	a.router = mux.NewRouter()

	// Part endpoints
	a.router.HandleFunc("/api/parts", a.HandleCreatePart).Methods(http.MethodPost)
	a.router.HandleFunc("/api/parts", a.HandleListParts).Methods(http.MethodGet)
	a.router.HandleFunc("/api/parts/{id}", a.HandleGetPart).Methods(http.MethodGet)
	a.router.HandleFunc("/api/parts/{id}", a.HandleUpdatePart).Methods(http.MethodPut)
	a.router.HandleFunc("/api/parts/{id}", a.HandleDeletePart).Methods(http.MethodDelete)
	a.router.HandleFunc("/api/sources/search", a.HandleSearchSources).Methods(http.MethodGet)
	a.router.HandleFunc("/api/sources/title", a.HandleGetSourceTitle).Methods(http.MethodGet)

	// Event endpoints
	a.router.HandleFunc("/api/events", a.HandleCreateEvent).Methods(http.MethodPost)
	a.router.HandleFunc("/api/events", a.HandleListEvents).Methods(http.MethodGet)
	a.router.HandleFunc("/api/events/{id}", a.HandleGetEvent).Methods(http.MethodGet)
	a.router.HandleFunc("/api/events/{id}", a.HandleUpdateEvent).Methods(http.MethodPut)
	a.router.HandleFunc("/api/events/{id}", a.HandleDeleteEvent).Methods(http.MethodDelete)
	a.router.HandleFunc("/api/events/{id}/duplicate", a.HandleDuplicateEvent).Methods(http.MethodPost)
	a.router.HandleFunc("/api/events/{id}/toggle-public", a.HandleToggleEventPublic).Methods(http.MethodPut)
	a.router.HandleFunc("/api/events/{event_id}/parts", a.HandleGetEventParts).Methods(http.MethodGet)

	// Template endpoints
	a.router.HandleFunc("/api/templates", a.HandleGetTemplates).Methods(http.MethodGet)

	// Health check
	a.router.HandleFunc("/health", handleHealth).Methods(http.MethodGet)
}

// handleHealth returns simple health check
func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}
