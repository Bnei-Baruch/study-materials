# Docker Deployment Guide

Complete guide for running Study Material Service with Docker.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)
- [Architecture](#architecture)

---

## Prerequisites

- Docker Desktop (Mac/Windows) or Docker Engine (Linux)
- Docker Compose v2.0+
- Minimum 2GB RAM allocated to Docker

# Install Docker Compose v2
mkdir -p /usr/local/lib/docker/cli-plugins
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

**Version Check:**
```bash
docker --version          # Should be 20.10+
docker compose version    # Should be 2.0+
```
# Install buildx
mkdir -p ~/.docker/cli-plugins
wget https://github.com/docker/buildx/releases/download/v0.17.0/buildx-v0.17.0.linux-amd64 -O ~/.docker/cli-plugins/docker-buildx
chmod +x ~/.docker/cli-plugins/docker-buildx

---

## Environment Configuration

### Step 1: Copy Environment File

Choose the appropriate environment file:

**For Local Development (Mac/Windows):**
```bash
cp .env.example .env
```

**For Production Server:**
```bash
cp .env.production .env
# Then edit .env with your production values
```

### Step 2: Configure Variables

Edit `.env` file with your settings:

```bash
# =================================================================
# CRITICAL SETTINGS TO CHANGE
# =================================================================

# Local dev: localhost
# Production: your server IP (e.g., 10.66.1.76)
HOST_IP=localhost

# Backend API port
BACKEND_PORT=8080         # Local: 8080, Production: 8081

# If MongoDB is on a different machine:
MONGO_HOST=mongo          # Docker internal, or external IP: 10.66.2.50
MONGO_PORT=27017

# Frontend will call this URL
NEXT_PUBLIC_API_URL=http://localhost:8080
```

**Important Variables:**

| Variable | Description | Default | When to Change |
|----------|-------------|---------|----------------|
| `HOST_IP` | Server hostname/IP | localhost | Always (production) |
| `BACKEND_PORT` | Backend external port | 8080 | If port conflict |
| `MONGO_HOST` | MongoDB hostname | mongo | If external DB |
| `MONGO_URI` | Full connection string | Computed | Advanced use |
| `NEXT_PUBLIC_API_URL` | Frontend→Backend URL | localhost:8080 | Match HOST_IP |

---

## Local Development

### Quick Start (Mac/Windows)

1. **Configure Environment:**
   ```bash
   cp .env.example .env
   # Uses localhost by default
   ```

2. **Build and Start:**
   ```bash
   docker compose -f docker-compose.local.yml up --build
   ```

3. **Access Services:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - MongoDB: localhost:27017

4. **View Logs:**
   ```bash
   # All services
   docker compose -f docker-compose.local.yml logs -f
   
   # Backend only
   docker compose -f docker-compose.local.yml logs -f backend
   
   # Frontend only
   docker compose -f docker-compose.local.yml logs -f frontend
   ```

### Useful Commands

```bash
# Stop all services
docker compose -f docker-compose.local.yml down

# Start all services
docker compose up -d

# Stop and remove volumes (fresh start)
docker compose -f docker-compose.local.yml down -v

# Restart a service
docker compose -f docker-compose.local.yml restart backend

# Rebuild after code changes
docker compose -f docker-compose.local.yml up --build backend

# Execute command in running container
docker exec -it study-backend-local /bin/sh



# Start Docker
systemctl start docker

# Stop Docker
systemctl stop docker

# Restart Docker
systemctl restart docker

# Check status
systemctl status docker

# View logs
journalctl -u docker -n 50 -f


# Remove ALL unused images, containers, volumes, and networks (aggressive)
docker system prune -f

```

### Development Workflow

1. **Make code changes**
2. **Rebuild affected service:**
   ```bash
   # Backend changes
   docker compose -f docker-compose.local.yml up --build -d backend
   
   # Frontend changes
   docker compose -f docker-compose.local.yml up --build -d frontend
   ```
3. **View logs to verify:**
   ```bash
   docker compose -f docker-compose.local.yml logs -f backend
   ```

---

## Production Deployment

### Initial Setup on Production Server

1. **Copy files to server:**
   ```bash
   # From your Mac
   rsync -avz \
     --exclude 'node_modules' \
     --exclude '.next' \
     --exclude 'data' \
     /Users/alexm/Projects/study-material-service/ \
     root@10.66.1.76:/root/study-material-service/
   ```

2. **SSH to server:**
   ```bash
   ssh root@10.66.1.76
   cd /root/study-material-service
   ```

3. **Configure environment:**
   ```bash
   cp .env.production .env
   
   # Edit with your production values
   nano .env
   ```

4. **Build and start:**
   ```bash
   docker compose build --no-cache
   docker compose up -d
   ```

5. **Verify running:**
   ```bash
   docker compose ps
   docker compose logs -f backend
   ```

### Updating Production

**Quick update (no dependency changes):**
```bash
# On your Mac - sync files
rsync -avz \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.env' \
  /Users/alexm/Projects/study-material-service/ \
  root@10.77.1.73:/root/study-material-service/

# On server
cd /root/study-material-service
docker compose up --build -d
docker compose logs -f
```

**Full rebuild (dependency/config changes):**
```bash
docker compose down
docker compose build --no-cache
docker compose up -d
docker compose logs -f
```

### Moving MongoDB to External Server

If you need to move MongoDB to another machine:

1. **On MongoDB server (e.g., 10.66.2.50):**
   ```bash
   # Install and start MongoDB
   docker run -d \
     --name mongodb \
     -p 27017:27017 \
     -v /data/mongo:/data/db \
     mongo:latest
   ```

2. **On application server, update .env:**
   ```bash
   MONGO_HOST=10.66.2.50
   MONGO_PORT=27017
   MONGO_URI=mongodb://10.66.2.50:27017/study_materials_db
   ```

3. **Restart services:**
   ```bash
   docker compose restart backend
   ```

**That's it!** No code changes needed.

---

## Troubleshooting

### Backend Container Exits Immediately

**Check logs:**
```bash
docker compose logs backend
```

**Common issues:**

1. **MongoDB not ready:**
   ```
   Error: connect ECONNREFUSED
   ```
   **Fix:** Wait 10 seconds and restart backend

2. **Wrong architecture:**
   ```
   exec format error
   ```
   **Fix:** Rebuild with `--no-cache`
   ```bash
   docker compose build --no-cache backend
   ```

3. **Config file missing:**
   ```
   Error loading config
   ```
   **Fix:** Ensure `config.toml` exists or set environment variables

### Frontend Shows Connection Errors

1. **Check API URL in browser console:**
   - Should match `NEXT_PUBLIC_API_URL` from .env

2. **Verify backend is accessible:**
   ```bash
   curl http://localhost:8080/health
   # Should return: OK
   ```

3. **Rebuild frontend with correct API URL:**
   ```bash
   docker compose up --build -d frontend
   ```

### Port Already in Use

```
Error: bind: address already in use
```

**Fix:** Change port in `.env`:
```bash
BACKEND_PORT=8081  # Instead of 8080
FRONTEND_PORT=3001 # Instead of 3000
```

### MongoDB Connection Refused

1. **Check MongoDB is running:**
   ```bash
   docker compose ps mongo
   ```

2. **Check MongoDB logs:**
   ```bash
   docker compose logs mongo
   ```

3. **Test connection:**
   ```bash
   docker exec -it study-backend-local /bin/sh
   nc -zv mongo 27017
   ```

### Widget Not Loading

1. **Check widget URL in browser console**

2. **Verify frontend is running:**
   ```bash
   curl http://localhost:3000/widget/widget.js
   ```

3. **Check CORS settings** - backend allows all origins by default

---

## Architecture

### Container Structure

```
┌─────────────────────────────────────────────────┐
│                   Docker Host                    │
│                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌────────┐│
│  │   Frontend   │  │   Backend    │  │ MongoDB││
│  │   Next.js    │  │   Go API     │  │        ││
│  │              │  │              │  │        ││
│  │ Port 3000 ───┼──▶ Port 8080 ───┼──▶ 27017  ││
│  └──────────────┘  └──────────────┘  └────────┘│
│         │                  │                    │
└─────────┼──────────────────┼────────────────────┘
          │                  │
          ▼                  ▼
    http://localhost:3000  http://localhost:8080
```

### Build Process

**Backend:**
1. Builder stage: Go 1.25 Alpine
2. Compile Go binary for target architecture
3. Production stage: Alpine Linux
4. Copy binary + config files
5. Expose port 8080

**Frontend:**
1. Builder stage: Node 20 Alpine
2. Install dependencies
3. Build Next.js app (with `NEXT_PUBLIC_API_URL` baked in)
4. Production stage: Node 20 Alpine
5. Copy built files
6. Expose port 3000

### Environment Variable Flow

```
.env file
    │
    ├─▶ docker-compose.yml reads variables
    │       │
    │       ├─▶ Backend container
    │       │   └─▶ Overrides config.toml
    │       │
    │       └─▶ Frontend build args
    │           └─▶ Baked into JavaScript bundle
    │
    └─▶ Widget inherits NEXT_PUBLIC_API_URL
```

### Network

- **Docker Network:** `study-net` (bridge driver)
- **Service Discovery:** Services can reach each other by name
  - Backend → MongoDB: `mongodb://mongo:27017`
  - Widget → Backend: Uses `NEXT_PUBLIC_API_URL` (external URL)

### Data Persistence

- **MongoDB Data:** `/data/db` → `mongo_data` volume
- **Survives:** Container restarts and rebuilds
- **Lost on:** `docker compose down -v`

---

## Docker Compose Files

| File | Purpose | Usage |
|------|---------|-------|
| `docker-compose.yml` | Production deployment | Server |
| `docker-compose.local.yml` | Local development | Mac/Windows |

Both use the same `.env` file but you can create environment-specific versions:
- `.env` - Current active config
- `.env.example` - Template with defaults
- `.env.production` - Production values example

---

## Health Checks

**Backend:**
```bash
curl http://localhost:8080/health
# Expected: OK
```

**Frontend:**
```bash
curl -I http://localhost:3000
# Expected: 200 OK
```

**MongoDB:**
```bash
docker exec -it study-mongo-local mongosh --eval "db.adminCommand('ping')"
# Expected: { ok: 1 }
```

**Full System Check:**
```bash
./scripts/health-check.sh  # TODO: Create this script
```

---

## Security Notes

1. **Never commit `.env` file** - Contains passwords
2. **Change default passwords** in production
3. **Use firewall** to restrict MongoDB port (27017)
4. **HTTPS in production** - Use reverse proxy (nginx/caddy)
5. **MongoDB authentication** - Enable in production:
   ```bash
   MONGO_URI=mongodb://user:pass@mongo:27017/study_materials_db?authSource=admin
   ```

---

## Performance Tips

1. **Multi-stage builds** already optimized
2. **Use BuildKit:** `DOCKER_BUILDKIT=1 docker compose build`
3. **Layer caching:** Don't change `go.mod` / `package.json` frequently
4. **Volume mounts for dev:** Mount source code for hot reload (TODO)

---

## Next Steps

- [Configuration Reference](./CONFIGURATION.md)
- [API Documentation](./API.md)
- [Widget Integration](./WIDGET.md)
- [Deployment Checklist](./DEPLOYMENT.md)

---

## Getting Help

**Logs:** First place to check for errors
```bash
docker compose logs -f
```

**Exec into container:** For debugging
```bash
docker exec -it study-backend-local /bin/sh
```

**Reset everything:** Nuclear option
```bash
docker compose down -v
docker system prune -a
# Then rebuild from scratch
```






