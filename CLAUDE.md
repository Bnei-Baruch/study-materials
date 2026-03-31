# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Study Material Service is a lesson authoring and management system for organizing educational events (lessons, conventions, meals, lectures) with multi-language support and an embeddable JavaScript widget for external sites.

## Commands

### Backend (Go)

```bash
# Run the server
go run main.go server

# Build binary
go build -o study-material-service .

# Test API health
curl http://localhost:8080/health
```

### Frontend (Next.js)

```bash
cd frontend

npm run dev           # Development server with hot reload
npm run build         # Production build (Next.js + widget)
npm run lint          # ESLint
npm run build:widget  # Build standalone embeddable widget only
```

### Docker (primary development method)

```bash
# Local development
cp .env.example .env
docker compose -f docker-compose.local.yml up --build

# Production
docker compose build && docker compose up -d
docker compose logs -f
```

Services: Frontend at `:3000`, Backend API at `:8080`, MongoDB at `:27017`

## Architecture

### Backend (Go)

The backend is a REST API using Gorilla Mux. Entry point: `main.go` → `cmd/root.go` (Cobra CLI) → `cmd/server.go` (starts server).

**`api/`** — HTTP handlers and routing. `api.go` defines the `App` struct (holds all stores/clients), sets up routes, and applies middleware (CORS + optional API key via `X-API-Key` header). Handler files are split by resource: `handle_events.go`, `handle_parts_*.go`, `handle_event_types.go`, `handle_templates.go`, `handle_sources.go`.

**`storage/`** — Data layer. `interface.go` defines `PartStore`, `EventStore`, `EventTypeStore`, `TemplateStore` interfaces. MongoDB implementations are in `mongodb_*.go` files. `models.go` defines all data structures.

**`integrations/kabbalahmedia/`** — External HTTP client that queries the Kabbalahmedia API for source material search.

### Frontend (Next.js App Router)

**`frontend/app/`** — Pages: `/` (public event list), `/admin` (dashboard), `/admin/create` (new event), `/admin/[id]` (edit event).

**`frontend/components/`** — React components for event forms, source search, template manager, etc.

**`frontend/lib/`** — Utilities: `api.ts` (backend API client), `keycloak.ts` (auth), `dateUtils.ts`, `eventGrouping.ts`.

**`frontend/widget/`** — Standalone embeddable widget built with esbuild. External sites embed via `<div data-studymaterials-widget ...>` + loading `widget.js`.

**`frontend/contexts/AuthContext.tsx`** — Keycloak authentication provider wrapping admin routes.

### Key Data Models (`storage/models.go`)

- **Event** — container for a study session. Has `Titles map[string]string` for multi-language display, `Type` (references EventType), `Date`, `Public` flag.
- **LessonPart** — individual part within an event. Links to an event via `EventID`, has `Sources` (Kabbalahmedia refs) and `CustomLinks`.
- **EventType** — configurable event categories (morning_lesson, meal, convention, etc.) stored in MongoDB and seeded on first run via `storage/seed_event_types.go`.

### Configuration

Config is loaded from `config.toml` with environment variable overrides (env takes precedence). Key env vars: `MONGO_URI`, `STORAGE_TYPE`, `NEXT_PUBLIC_API_URL`, `API_SECRET_KEY`, `NEXT_PUBLIC_KEYCLOAK_URL/REALM/CLIENT_ID`. See `docs/CONFIGURATION.md` for full reference.

### Multi-Language Support

Supported languages: `he`, `en`, `ru`, `es`, `de`, `it`, `fr`, `uk`, `tr`, `pt`, `bg`. Event titles are stored as `map[string]string`. The widget accepts a `data-language` attribute. Language definitions live in `templates.json` and are loaded into the frontend via the `/api/templates` endpoint.

### API Authentication

GET and OPTIONS requests bypass auth. Write endpoints require `X-API-Key` header matching the configured `API_SECRET_KEY` (if no key is configured, auth is skipped). Admin UI authenticates via Keycloak.
