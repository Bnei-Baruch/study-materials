package api

import (
	"log"
	"net/http"
	"strings"

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
	eventTypeStore      storage.EventTypeStore
	templateStore       storage.TemplateStore
	kabbalahmediaClient *kabbalahmedia.Client
	templateConfig      *storage.TemplateConfig
	emailService        *EmailService
	apiSecretKey        string
}

// NewApp creates a new App instance with dependencies
func NewApp(partStore storage.PartStore, eventStore storage.EventStore, eventTypeStore storage.EventTypeStore, templateStore storage.TemplateStore, kabbalahmediaClient *kabbalahmedia.Client, templateConfig *storage.TemplateConfig, apiSecretKey string) *App {
	return &App{
		store:               partStore,
		eventStore:          eventStore,
		eventTypeStore:      eventTypeStore,
		templateStore:       templateStore,
		kabbalahmediaClient: kabbalahmediaClient,
		templateConfig:      templateConfig,
		emailService:        NewEmailService(),
		apiSecretKey:        apiSecretKey,
	}
}

// apiKeyMiddleware rejects write requests that don't carry the correct X-API-Key header.
// GET and OPTIONS are always allowed so public widgets and browsers can read freely.
// Requests from localhost/internal network IPs are allowed for admin UI on same server.
// If no secret key is configured the middleware is a no-op (useful for local dev).
func (a *App) apiKeyMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Allow GET and OPTIONS (read-only)
		if r.Method == http.MethodGet || r.Method == http.MethodOptions {
			next.ServeHTTP(w, r)
			return
		}

		// If no API key configured, allow all (backward compatible for dev)
		if a.apiSecretKey == "" {
			next.ServeHTTP(w, r)
			return
		}

		// Extract IP from request (check X-Forwarded-For first for proxies)
		ip := r.RemoteAddr
		if idx := strings.LastIndex(ip, ":"); idx != -1 {
			// Remove port from direct connection
			ip = ip[:idx]
		}

		log.Printf("[API] %s %s - RemoteAddr=%s, X-Forwarded-For=%s, ResolvedIP=%s", r.Method, r.RequestURI, r.RemoteAddr, r.Header.Get("X-Forwarded-For"), ip)

		// Check if direct connection is from trusted internal network first
		if strings.HasPrefix(ip, "10.66.") || strings.HasPrefix(ip, "10.77.") || strings.HasPrefix(ip, "172.") || strings.HasPrefix(ip, "127.") {
			// Direct connection from trusted network - allow immediately
			next.ServeHTTP(w, r)
			return
		}

		// For external direct connections, check X-Forwarded-For (from proxy)
		if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
			// X-Forwarded-For can contain multiple IPs, take the first one (original client)
			if idx := strings.Index(forwarded, ","); idx != -1 {
				ip = strings.TrimSpace(forwarded[:idx])
			} else {
				ip = strings.TrimSpace(forwarded)
			}
			log.Printf("[API] Using X-Forwarded-For IP: %s", ip)
		}

		// Allow localhost/127.0.0.1/[::1] (container internal)
		if ip == "127.0.0.1" || ip == "localhost" || ip == "::1" || ip == "[::1]" {
			next.ServeHTTP(w, r)
			return
		}

		// Allow internal network (10.66.0.0/16 and 10.77.0.0/16)
		if strings.HasPrefix(ip, "10.66.") || strings.HasPrefix(ip, "10.77.") {
			next.ServeHTTP(w, r)
			return
		}

		// Allow Docker internal network (172.x.x.x)
		if strings.HasPrefix(ip, "172.") {
			next.ServeHTTP(w, r)
			return
		}

		// For external requests, require API key
		if r.Header.Get("X-API-Key") != a.apiSecretKey {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// Init initializes and starts the API server
func (a *App) Init() {
	a.initCors()
	a.initRouters()

	handler := a.cors.Handler(a.apiKeyMiddleware(a.router))

	addr := viper.GetString("server.bind-address")
	log.Printf("Starting server on %s", addr)

	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatal(err)
	}
}

// initCors initializes CORS settings
func (a *App) initCors() {
	a.cors = cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions},
		AllowedHeaders:   []string{"*"},
		ExposedHeaders:   []string{"Content-Length", "Content-Type"},
		AllowCredentials: false,
		MaxAge:           300, // Cache preflight for 5 minutes
	})
}

// initRouters initializes API routes
func (a *App) initRouters() {
	a.router = mux.NewRouter()

	// Part endpoints
	a.router.HandleFunc("/api/parts", a.HandleCreatePart).Methods(http.MethodPost, http.MethodOptions)
	a.router.HandleFunc("/api/parts", a.HandleListParts).Methods(http.MethodGet, http.MethodOptions)
	a.router.HandleFunc("/api/parts/{id}", a.HandleGetPart).Methods(http.MethodGet, http.MethodOptions)
	a.router.HandleFunc("/api/parts/{id}", a.HandleUpdatePart).Methods(http.MethodPut, http.MethodOptions)
	a.router.HandleFunc("/api/parts/{id}", a.HandleDeletePart).Methods(http.MethodDelete, http.MethodOptions)
	a.router.HandleFunc("/api/sources/search", a.HandleSearchSources).Methods(http.MethodGet, http.MethodOptions)
	a.router.HandleFunc("/api/sources/title", a.HandleGetSourceTitle).Methods(http.MethodGet, http.MethodOptions)

	// Event endpoints
	a.router.HandleFunc("/api/events", a.HandleCreateEvent).Methods(http.MethodPost, http.MethodOptions)
	a.router.HandleFunc("/api/events", a.HandleListEvents).Methods(http.MethodGet, http.MethodOptions)
	a.router.HandleFunc("/api/events/{id}", a.HandleGetEvent).Methods(http.MethodGet, http.MethodOptions)
	a.router.HandleFunc("/api/events/{id}", a.HandleUpdateEvent).Methods(http.MethodPut, http.MethodOptions)
	a.router.HandleFunc("/api/events/{id}", a.HandleDeleteEvent).Methods(http.MethodDelete, http.MethodOptions)
	a.router.HandleFunc("/api/events/{id}/duplicate", a.HandleDuplicateEvent).Methods(http.MethodPost, http.MethodOptions)
	a.router.HandleFunc("/api/events/{id}/toggle-public", a.HandleToggleEventPublic).Methods(http.MethodPut, http.MethodOptions)
	a.router.HandleFunc("/api/events/{id}/send-email", a.HandleSendEventEmail).Methods(http.MethodPost, http.MethodOptions)
	a.router.HandleFunc("/api/events/{event_id}/parts", a.HandleGetEventParts).Methods(http.MethodGet, http.MethodOptions)

	// Event type endpoints
	a.router.HandleFunc("/api/event-types", a.HandleListEventTypes).Methods(http.MethodGet, http.MethodOptions)
	a.router.HandleFunc("/api/event-types", a.HandleCreateEventType).Methods(http.MethodPost, http.MethodOptions)
	a.router.HandleFunc("/api/event-types/{id}", a.HandleGetEventType).Methods(http.MethodGet, http.MethodOptions)
	a.router.HandleFunc("/api/event-types/{id}", a.HandleUpdateEventType).Methods(http.MethodPut, http.MethodOptions)
	a.router.HandleFunc("/api/event-types/{id}", a.HandleDeleteEventType).Methods(http.MethodDelete, http.MethodOptions)

	// Template endpoints
	a.router.HandleFunc("/api/templates", a.HandleGetTemplates).Methods(http.MethodGet, http.MethodOptions)
	a.router.HandleFunc("/api/templates", a.HandleCreateTemplate).Methods(http.MethodPost, http.MethodOptions)
	a.router.HandleFunc("/api/templates/{id}", a.HandleUpdateTemplate).Methods(http.MethodPut, http.MethodOptions)
	a.router.HandleFunc("/api/templates/{id}", a.HandleDeleteTemplate).Methods(http.MethodDelete, http.MethodOptions)
	a.router.HandleFunc("/api/templates/sync", a.HandleSyncTemplates).Methods(http.MethodPost, http.MethodOptions)

	// Health check
	a.router.HandleFunc("/health", handleHealth).Methods(http.MethodGet, http.MethodOptions)
}

// handleHealth returns simple health check
func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}
