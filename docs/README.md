# Study Material Service Documentation

Complete documentation for the Study Material Service project.

## Quick Links

- **Getting Started:** [DOCKER.md](./DOCKER.md) - Deploy with Docker
- **Configuration:** [CONFIGURATION.md](./CONFIGURATION.md) - Environment variables and settings
- **Widget Integration:** [WIDGET.md](./WIDGET.md) - Embed the widget on external sites
- **Architecture:** [ARCHITECTURE-NOTES.md](./ARCHITECTURE-NOTES.md) - System design

---

## Documentation Index

### Setup & Deployment

| Document | Description |
|----------|-------------|
| **[QUICK-REFERENCE.md](./QUICK-REFERENCE.md)** | **⭐ Essential commands and configs** |
| [DOCKER.md](./DOCKER.md) | Complete Docker deployment guide (local & production) |
| [CONFIGURATION.md](./CONFIGURATION.md) | Configuration reference for all settings |

### Features

| Document | Description |
|----------|-------------|
| [WIDGET.md](./WIDGET.md) | Widget integration guide for external sites |
| [EVENT-UI-SUMMARY.md](./EVENT-UI-SUMMARY.md) | Event management UI documentation |
| [TEMPLATES-README.md](./TEMPLATES-README.md) | Template system documentation |

### Development

| Document | Description |
|----------|-------------|
| [ARCHITECTURE-NOTES.md](./ARCHITECTURE-NOTES.md) | System architecture and design decisions |
| [POC-README.md](./POC-README.md) | Proof of concept documentation |
| [POC-SUMMARY.md](./POC-SUMMARY.md) | POC implementation summary |
| [POC-CHANGELOG.md](./POC-CHANGELOG.md) | POC development changelog |

---

## Quick Start

### 1. Local Development (Mac/Windows)

```bash
# Clone repository
git clone <repo-url>
cd study-material-service

# Configure environment
cp .env.example .env

# Start with Docker
docker compose -f docker-compose.local.yml up --build

# Access services
open http://localhost:3000  # Frontend
open http://localhost:8080/health  # Backend API
```

See [DOCKER.md](./DOCKER.md) for complete instructions.

### 2. Production Deployment

```bash
# On production server
cp .env.production .env
nano .env  # Edit with your settings

# Build and start
docker compose build
docker compose up -d

# Monitor
docker compose logs -f
```

See [DOCKER.md](./DOCKER.md) for complete deployment guide.

### 3. Integrate Widget on External Site

```html
<div
  data-studymaterials-widget
  data-language="he"
  data-limit="10"
  data-api-url="http://your-server:8080"
></div>
<script src="http://your-server:3000/widget/widget.js"></script>
```

See [WIDGET.md](./WIDGET.md) for complete integration guide.

---

## Project Structure

```
study-material-service/
├── api/                    # Backend API handlers
├── cmd/                    # CLI commands (server, etc.)
├── storage/                # Data persistence layer
├── integrations/           # External API clients (kabbalahmedia)
├── frontend/               # Next.js frontend application
│   ├── app/               # Next.js app router pages
│   ├── components/        # React components
│   ├── widget/            # Embeddable widget
│   └── public/            # Static assets
├── docs/                   # Documentation (you are here)
├── docker-compose.yml      # Production Docker config
├── docker-compose.local.yml # Local development Docker config
├── .env                    # Environment configuration (gitignored)
├── .env.example            # Environment template
├── config.toml             # Default configuration
└── templates.json          # Study material templates
```

---

## Technology Stack

### Backend
- **Language:** Go 1.25
- **Framework:** Gorilla Mux (HTTP router)
- **Database:** MongoDB
- **External APIs:** Kabbalahmedia sqdata API

### Frontend
- **Framework:** Next.js 16 (React 18)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Widget:** esbuild (standalone JavaScript bundle)

### Infrastructure
- **Containerization:** Docker & Docker Compose
- **Deployment:** Docker Swarm or standalone containers

---

## Key Features

1. **Event Management**
   - Create/edit study events (lessons, congresses, meals)
   - Multi-language support (Hebrew, English, Russian, Spanish, German, Italian, French, Ukrainian)
   - Date filtering and search

2. **Study Materials**
   - Multiple content types (video lessons, excerpts, transcripts, documents)
   - Source integration with Kabbalahmedia
   - Template-based material organization

3. **Embeddable Widget**
   - Standalone JavaScript widget for external sites
   - Events list or single event view
   - Inline or fixed positioning
   - Multi-language support

4. **Flexible Configuration**
   - Environment variable based configuration
   - Easy deployment across environments
   - Support for external MongoDB

---

## Common Tasks

### Change Configuration

Edit `.env` file and restart:
```bash
nano .env
docker compose restart
```

See [CONFIGURATION.md](./CONFIGURATION.md) for all options.

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
```

### Update Code

```bash
# Local: rebuild affected service
docker compose -f docker-compose.local.yml up --build -d backend

# Production: sync and rebuild
rsync -avz ./ root@server:/path/
ssh root@server 'cd /path && docker compose up --build -d'
```

### Move MongoDB to External Server

1. Update `.env`:
   ```bash
   MONGO_HOST=10.66.2.50
   MONGO_URI=mongodb://10.66.2.50:27017/study_materials_db
   ```

2. Restart:
   ```bash
   docker compose restart backend
   ```

No code changes needed!

---

## API Endpoints

### Public Endpoints

- `GET /api/events` - List public events
- `GET /api/events/{id}` - Get event details
- `GET /api/events/{id}/parts` - Get event parts (materials)
- `GET /api/sources/search?q=query` - Search sources

### Health Check

- `GET /health` - Server health status

See [WIDGET.md](./WIDGET.md) for complete API reference.

---

## Widget Usage

### Auto-inject Mode

```html
<script 
  src="http://your-server:3000/widget/widget.js"
  data-auto-inject="true"
  data-language="he"
  data-limit="10"
  data-api-url="http://your-server:8080"
></script>
```

### Manual Mode

```html
<div id="widget-container"></div>
<script src="http://your-server:3000/widget/widget.js"></script>
<script>
  StudyMaterialsWidget.load(null, 'he', {
    position: 'inline',
    apiUrl: 'http://your-server:8080',
    target: document.getElementById('widget-container')
  });
</script>
```

See [WIDGET.md](./WIDGET.md) for complete widget documentation.

---

## Troubleshooting

### Backend Won't Start

1. Check logs: `docker compose logs backend`
2. Verify MongoDB is running: `docker compose ps mongo`
3. Check `.env` configuration: `docker compose config`

### Frontend Shows Connection Errors

1. Verify `NEXT_PUBLIC_API_URL` in `.env`
2. Rebuild frontend: `docker compose up --build -d frontend`
3. Test backend: `curl http://localhost:8080/health`

### Widget Not Loading

1. Check widget URL: `curl http://localhost:3000/widget/widget.js`
2. Check browser console for errors
3. Verify CORS settings (backend allows all origins by default)

See [DOCKER.md#troubleshooting](./DOCKER.md#troubleshooting) for complete troubleshooting guide.

---

## Environment Files

| File | Purpose | Commit to Git? |
|------|---------|----------------|
| `.env` | Active configuration | ❌ NO (gitignored) |
| `.env.example` | Template with defaults | ✅ YES |
| `.env.production` | Production example | ✅ YES |
| `config.toml` | Backend defaults | ⚠️ Optional (fallback) |

---

## Contributing

1. Make code changes
2. Test locally:
   ```bash
   docker compose -f docker-compose.local.yml up --build
   ```
3. Update documentation if needed
4. Commit and push

---

## Support

- **Documentation Issues:** Create GitHub issue
- **Configuration Help:** See [CONFIGURATION.md](./CONFIGURATION.md)
- **Deployment Help:** See [DOCKER.md](./DOCKER.md)
- **Widget Help:** See [WIDGET.md](./WIDGET.md)

---

## License

[Add license information]

---

## Changelog

See [POC-CHANGELOG.md](./POC-CHANGELOG.md) for development history.
