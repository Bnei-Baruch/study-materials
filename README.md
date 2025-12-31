# Study Material Service

Modern lesson authoring and management system with multi-language support, embeddable widget, and event-based workflow.

[![Docker](https://img.shields.io/badge/docker-ready-blue)](docs/DOCKER.md)
[![Documentation](https://img.shields.io/badge/docs-complete-green)](docs/)

---

## Quick Start

### Local Development (Mac/Windows)

```bash
# 1. Configure environment
cp .env.example .env

# 2. Start services
docker compose -f docker-compose.local.yml up --build

# 3. Access services
# Frontend: http://localhost:3000
# Backend:  http://localhost:8080
# Widget:   http://localhost:3000/widget/widget.js
```

### Production Deployment

```bash
# 1. Copy files to server
rsync -avz --exclude 'node_modules' --exclude '.next' \
  ./ root@10.66.1.76:/root/study-material-service/

# 2. SSH and configure
ssh root@10.66.1.76
cd /root/study-material-service
cp .env.production .env
nano .env  # Edit with your settings

# 3. Build and start
docker compose build
docker compose up -d
docker compose logs -f
```

**📖 Complete instructions:** [docs/DOCKER.md](docs/DOCKER.md)

---

## Documentation

### Getting Started

- **[Docker Deployment Guide](docs/DOCKER.md)** - Complete setup for local & production
- **[Configuration Reference](docs/CONFIGURATION.md)** - All environment variables and settings

### Features

- **[Widget Integration](docs/WIDGET.md)** - Embed study materials on external sites
- **[Event Management](docs/EVENT-UI-SUMMARY.md)** - Create and manage study events
- **[Templates System](docs/TEMPLATES-README.md)** - Template configuration

### Development

- **[Architecture Notes](docs/ARCHITECTURE-NOTES.md)** - System design and structure
- **[POC Documentation](docs/POC-README.md)** - Proof of concept details

**📚 Full documentation index:** [docs/README.md](docs/README.md)

---

## Features

### Event Management
- ✅ Create events (lessons, congresses, meals, lectures)
- ✅ Multi-language support (8 languages)
- ✅ Drag-and-drop reordering
- ✅ Duplicate and delete events
- ✅ Public/Private toggle

### Study Materials
- ✅ Multiple content types (video, excerpts, transcripts, documents)
- ✅ Source integration with Kabbalahmedia API
- ✅ Template-based organization
- ✅ Custom links per section

### Embeddable Widget
- ✅ Standalone JavaScript widget
- ✅ Events list or single event view
- ✅ Inline or fixed positioning
- ✅ Multi-language support

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Go 1.25, Gorilla Mux, MongoDB |
| **Frontend** | Next.js 16, React 18, TypeScript, Tailwind CSS |
| **Widget** | Standalone JavaScript (esbuild) |
| **Infrastructure** | Docker, Docker Compose |

---

## Project Structure

```
study-material-service/
├── api/                    # Backend API handlers
├── cmd/                    # CLI commands
├── storage/                # Data persistence
├── integrations/           # External APIs
├── frontend/               # Next.js application
│   ├── app/               # Pages
│   ├── components/        # React components
│   ├── widget/            # Embeddable widget
│   └── public/            # Static assets
├── docs/                   # 📚 Documentation
├── docker-compose.yml      # Production config
├── docker-compose.local.yml # Local dev config
├── .env                    # Configuration (gitignored)
├── .env.example            # Configuration template
└── config.toml             # Defaults
```

---

## Common Tasks

### View Logs
```bash
docker compose logs -f backend
docker compose logs -f frontend
```

### Update Configuration
```bash
# 1. Edit .env file
nano .env

# 2. Restart services
docker compose restart
```

### Rebuild After Code Changes
```bash
# Local
docker compose -f docker-compose.local.yml up --build -d backend

# Production
docker compose up --build -d
```

### Move Database to External Server
```bash
# 1. Edit .env
MONGO_HOST=10.66.2.50
MONGO_URI=mongodb://10.66.2.50:27017/study_materials_db

# 2. Restart backend
docker compose restart backend
```

**📖 More tasks:** [docs/DOCKER.md](docs/DOCKER.md)

---

## Widget Integration

### Quick Example

```html
<!-- Events list widget -->
<div
  data-studymaterials-widget
  data-language="he"
  data-limit="10"
  data-api-url="http://your-server:8080"
></div>
<script src="http://your-server:3000/widget/widget.js"></script>
```

### Manual Control

```javascript
StudyMaterialsWidget.load(eventId, 'he', {
  position: 'inline',
  apiUrl: 'http://your-server:8080',
  target: document.getElementById('container')
});
```

**📖 Complete guide:** [docs/WIDGET.md](docs/WIDGET.md)

---

## API Endpoints

### Public Endpoints
- `GET /api/events` - List public events
- `GET /api/events/{id}` - Get event details
- `GET /api/events/{id}/parts` - Get event materials
- `GET /api/sources/search?q=query` - Search sources
- `GET /health` - Health check

**📖 Full API reference:** [docs/WIDGET.md](docs/WIDGET.md#api-reference)

---

## Environment Configuration

All configuration is managed via `.env` files:

```bash
# Infrastructure
HOST_IP=localhost              # Or production IP
BACKEND_PORT=8080
FRONTEND_PORT=3000

# Database
MONGO_HOST=mongo
MONGO_PORT=27017
MONGO_URI=mongodb://mongo:27017/study_materials_db

# API URLs
NEXT_PUBLIC_API_URL=http://localhost:8080

# External Services
KABBALAHMEDIA_URL=https://kabbalahmedia.info/backend/sqdata
KABBALAHMEDIA_TIMEOUT=120s

# Application
STORAGE_TYPE=mongodb
APP_SCRIPT_PASSWORD=change-me
```

**📖 Full reference:** [docs/CONFIGURATION.md](docs/CONFIGURATION.md)

---

## Troubleshooting

### Backend Won't Start
```bash
# Check logs
docker compose logs backend

# Verify MongoDB
docker compose ps mongo

# Test connection
curl http://localhost:8080/health
```

### Frontend Shows Connection Errors
```bash
# Check API URL in .env
cat .env | grep NEXT_PUBLIC_API_URL

# Rebuild frontend (bakes in the URL)
docker compose up --build -d frontend
```

### Widget Not Loading
```bash
# Test widget URL
curl http://localhost:3000/widget/widget.js

# Check browser console for errors
# Verify CORS settings (allows all origins by default)
```

**📖 Complete troubleshooting:** [docs/DOCKER.md#troubleshooting](docs/DOCKER.md#troubleshooting)

---

## Development Workflow

1. **Make code changes**
2. **Rebuild affected service:**
   ```bash
   docker compose -f docker-compose.local.yml up --build -d backend
   ```
3. **View logs:**
   ```bash
   docker compose -f docker-compose.local.yml logs -f backend
   ```
4. **Test in browser:**
   - Frontend: http://localhost:3000
   - API: http://localhost:8080/health

---

## Production Deployment Checklist

- [ ] Copy `.env.production` to `.env`
- [ ] Update `HOST_IP` with server IP
- [ ] Update `NEXT_PUBLIC_API_URL` with public backend URL
- [ ] Change `APP_SCRIPT_PASSWORD` from default
- [ ] Verify MongoDB connection
- [ ] Build with `docker compose build`
- [ ] Start with `docker compose up -d`
- [ ] Check logs: `docker compose logs -f`
- [ ] Test health: `curl http://HOST_IP:BACKEND_PORT/health`
- [ ] Test frontend: Open `http://HOST_IP:FRONTEND_PORT`

**📖 Complete deployment guide:** [docs/DOCKER.md#production-deployment](docs/DOCKER.md#production-deployment)

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│              Docker Network                      │
│                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────┐ │
│  │  Frontend   │  │   Backend    │  │ MongoDB│ │
│  │  Next.js    │─▶│   Go API     │─▶│        │ │
│  │  (Port 3000)│  │  (Port 8080) │  │ (27017)│ │
│  └─────────────┘  └──────────────┘  └────────┘ │
│         │                  │                    │
└─────────┼──────────────────┼────────────────────┘
          │                  │
    Widget.js           REST API
          │                  │
          ▼                  ▼
   External Sites      galaxy3, Apps
```

**📖 Detailed architecture:** [docs/ARCHITECTURE-NOTES.md](docs/ARCHITECTURE-NOTES.md)

---

## Support

- **Documentation:** [docs/](docs/)
- **Configuration Help:** [docs/CONFIGURATION.md](docs/CONFIGURATION.md)
- **Deployment Help:** [docs/DOCKER.md](docs/DOCKER.md)
- **Widget Integration:** [docs/WIDGET.md](docs/WIDGET.md)
- **Issues:** Create GitHub issue

---

## License

[Add license information]
