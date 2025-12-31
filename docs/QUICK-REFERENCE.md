# Quick Reference Card

Essential commands and configurations for Study Material Service.

## Environment Files

```bash
.env.example      → Template for local development
.env.production   → Template for production server
.env              → Active configuration (gitignored)
```

---

## Common Scenarios

### 🏠 Running Locally on Mac

```bash
cp .env.example .env
docker compose -f docker-compose.local.yml up --build
```

**Access:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- Widget: http://localhost:3000/widget/widget.js

---

### 🚀 Deploy to Production Server

```bash
# On your Mac - copy to server
rsync -avz --exclude 'node_modules' --exclude '.next' \
  ./ root@10.66.1.76:/root/study-material-service/

# On server
cp .env.production .env
nano .env  # Edit: change HOST_IP, passwords, etc.
docker compose build
docker compose up -d
```

---

### 🔄 Move MongoDB to Different Machine

**Example:** Moving from Docker container to 10.66.2.50

1. **Edit .env:**
   ```bash
   MONGO_HOST=10.66.2.50
   MONGO_PORT=27017
   MONGO_URI=mongodb://10.66.2.50:27017/study_materials_db
   ```

2. **Restart:**
   ```bash
   docker compose restart backend
   ```

3. **Verify:**
   ```bash
   docker compose logs backend | grep MongoDB
   # Should show: Initialized MongoDB storage: mongodb://10.66.2.50:27017...
   ```

**Done!** No code rebuild needed.

---

### 📝 Change API URL (e.g., moving servers)

**Example:** Moving from 10.66.1.76 to 10.66.1.100

1. **Edit .env:**
   ```bash
   HOST_IP=10.66.1.100
   BACKEND_PORT=8081
   NEXT_PUBLIC_API_URL=http://10.66.1.100:8081
   WIDGET_URL=http://10.66.1.100:3000/widget/widget.js
   ```

2. **Rebuild frontend** (API URL is baked in):
   ```bash
   docker compose up --build -d frontend
   ```

3. **Restart backend:**
   ```bash
   docker compose restart backend
   ```

---

### 🔍 View Logs

```bash
# All services
docker compose logs -f

# Backend only
docker compose logs -f backend

# Frontend only
docker compose logs -f frontend

# Last 50 lines
docker compose logs --tail 50 backend
```

---

### 🔧 Troubleshooting

#### Backend container exits immediately
```bash
docker compose logs backend
# Check for: MongoDB connection errors, config errors
```

#### Frontend can't reach backend
```bash
# 1. Check backend is running
curl http://localhost:8080/health

# 2. Check .env setting
cat .env | grep NEXT_PUBLIC_API_URL

# 3. Rebuild frontend (API URL is baked into JavaScript)
docker compose up --build -d frontend
```

#### Widget doesn't load
```bash
# Test widget file exists
curl http://localhost:3000/widget/widget.js

# Check browser console for errors
# Verify API URL in widget config
```

#### Port conflict
```bash
# Error: bind: address already in use

# Fix: Change ports in .env
BACKEND_PORT=8081  # Instead of 8080
FRONTEND_PORT=3001 # Instead of 3000
```

---

## Essential Commands

### Docker Compose

```bash
# Start services
docker compose up -d

# Start with build
docker compose up --build -d

# Stop services
docker compose down

# Stop and remove volumes (fresh start)
docker compose down -v

# Rebuild without cache
docker compose build --no-cache

# Restart service
docker compose restart backend

# View config
docker compose config

# Check status
docker compose ps
```

### Container Access

```bash
# Execute shell in container
docker exec -it study-backend-local /bin/sh
docker exec -it study-frontend-local /bin/sh

# View container logs
docker logs study-backend-local
docker logs -f study-frontend-local  # Follow
```

---

## File Structure

```
.env                      → Active config (gitignored)
.env.example              → Local development template
.env.production           → Production template
config.toml               → Backend defaults (fallback)
docker-compose.yml        → Production compose file
docker-compose.local.yml  → Local development compose file
```

---

## Environment Variables Cheat Sheet

### Must Change for Production

```bash
HOST_IP=10.66.1.76                           # Your server IP
NEXT_PUBLIC_API_URL=http://10.66.1.76:8081  # Public backend URL
APP_SCRIPT_PASSWORD=super-secret-password    # Change from default
```

### Change If Needed

```bash
BACKEND_PORT=8081                            # If 8080 conflicts
MONGO_HOST=mongo                             # Or external IP
MONGO_URI=mongodb://mongo:27017/db           # Or external URI
```

### Usually Don't Change

```bash
FRONTEND_PORT=3000
MONGO_PORT=27017
MONGO_DATABASE=study_materials_db
STORAGE_TYPE=mongodb
KABBALAHMEDIA_URL=https://kabbalahmedia.info/backend/sqdata
KABBALAHMEDIA_TIMEOUT=120s
```

---

## Health Checks

```bash
# Backend
curl http://localhost:8080/health
# Expected: OK

# Frontend
curl -I http://localhost:3000
# Expected: HTTP/1.1 200 OK

# MongoDB
docker exec -it study-mongo-local mongosh --eval "db.adminCommand('ping')"
# Expected: { ok: 1 }

# Widget
curl http://localhost:3000/widget/widget.js | head -n 5
# Expected: JavaScript code
```

---

## Configuration Priority

When backend starts, it reads configuration in this order:

1. **Environment Variables** (.env file) ← **Highest priority**
2. config.toml file
3. Built-in defaults ← Lowest priority

**Example:**
- `config.toml` says: `uri = "mongodb://localhost:27017"`
- `.env` says: `MONGO_URI=mongodb://mongo:27017`
- **Backend uses:** `mongodb://mongo:27017` ← Environment variable wins!

---

## Widget Integration Snippets

### Events List
```html
<div data-studymaterials-widget 
     data-language="he" 
     data-limit="10"
     data-api-url="http://10.66.1.76:8080">
</div>
<script src="http://10.66.1.76:3000/widget/widget.js"></script>
```

### Single Event
```html
<div data-studymaterials-widget 
     data-event-id="abc-123" 
     data-language="en"
     data-api-url="http://10.66.1.76:8080">
</div>
<script src="http://10.66.1.76:3000/widget/widget.js"></script>
```

### JavaScript API
```javascript
const container = StudyMaterialsWidget.load(null, 'he', {
  position: 'inline',
  apiUrl: 'http://10.66.1.76:8080',
  limit: 10
});
```

---

## Backup & Restore

### Backup MongoDB Data

```bash
# From Docker container
docker exec study-mongo-local mongodump --out /tmp/backup
docker cp study-mongo-local:/tmp/backup ./backup-$(date +%Y%m%d)
```

### Restore MongoDB Data

```bash
# To Docker container
docker cp ./backup-20251231 study-mongo-local:/tmp/restore
docker exec study-mongo-local mongorestore /tmp/restore
```

---

## Production Deployment Checklist

```
□ Copy .env.production to .env
□ Edit .env - set HOST_IP to server IP
□ Edit .env - set NEXT_PUBLIC_API_URL to public backend URL
□ Edit .env - change APP_SCRIPT_PASSWORD
□ Edit .env - verify MONGO_URI if external database
□ Run: docker compose build
□ Run: docker compose up -d
□ Check: docker compose ps (all should be "Up")
□ Check: docker compose logs -f backend (no errors)
□ Test: curl http://HOST_IP:BACKEND_PORT/health
□ Test: Open http://HOST_IP:FRONTEND_PORT in browser
□ Test: Widget loads on external sites
□ Configure firewall (allow BACKEND_PORT, FRONTEND_PORT)
□ Setup reverse proxy with SSL (optional but recommended)
□ Setup MongoDB authentication (recommended for production)
□ Configure automated backups
```

---

## URLs by Environment

### Local Development
```
Frontend:  http://localhost:3000
Backend:   http://localhost:8080
MongoDB:   localhost:27017
Widget:    http://localhost:3000/widget/widget.js
```

### Production (10.66.1.76)
```
Frontend:  http://10.66.1.76:3000
Backend:   http://10.66.1.76:8081
MongoDB:   Internal (mongo:27017) or external IP
Widget:    http://10.66.1.76:3000/widget/widget.js
```

---

## When You Need to Rebuild

**Rebuild Backend:**
- Changed Go code
- Changed `go.mod` dependencies
- Changed `config.toml` defaults

**Rebuild Frontend:**
- Changed React/TypeScript code
- Changed `package.json` dependencies
- **Changed `NEXT_PUBLIC_API_URL` in .env** ← Important!
- Changed widget code

**Just Restart (no rebuild):**
- Changed most `.env` variables (except NEXT_PUBLIC_*)
- Changed `config.toml` (if no rebuild)
- Moved MongoDB to external server

---

## Getting Help

1. Check logs: `docker compose logs -f`
2. Check docs: `docs/`
3. Test health endpoints
4. Check `.env` configuration
5. Try rebuild: `docker compose up --build -d`
6. Try fresh start: `docker compose down -v && docker compose up --build -d`
