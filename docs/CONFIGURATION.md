# Configuration Reference

Complete reference for all configuration options in Study Material Service.

## Configuration Sources

Configuration is read in the following priority order (highest to lowest):

1. **Environment Variables** (.env file or system env)
2. **config.toml** file
3. **Built-in defaults**

---

## Environment Variables

### Infrastructure

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `HOST_IP` | Server hostname or IP address | `localhost` | `10.66.1.76` |
| `BACKEND_PORT` | Backend API external port | `8080` | `8081` |
| `FRONTEND_PORT` | Frontend external port | `3000` | `3000` |

### MongoDB Database

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `MONGO_HOST` | MongoDB hostname | `mongo` | `10.66.2.50` |
| `MONGO_PORT` | MongoDB port | `27017` | `27017` |
| `MONGO_DATABASE` | Database name | `study_materials_db` | `study_materials_db` |
| `MONGO_URI` | Full MongoDB connection string | Computed | `mongodb://user:pass@host:27017/db` |

**MongoDB URI Format:**
```
mongodb://[username:password@]host[:port]/database[?options]
```

**Examples:**
```bash
# Local Docker
MONGO_URI=mongodb://mongo:27017/study_materials_db

# External server without auth
MONGO_URI=mongodb://10.66.2.50:27017/study_materials_db

# With authentication
MONGO_URI=mongodb://admin:password@10.66.2.50:27017/study_materials_db?authSource=admin

# MongoDB Atlas (cloud)
MONGO_URI=mongodb+srv://user:pass@cluster0.mongodb.net/study_materials_db?retryWrites=true&w=majority
```

### API Endpoints

| Variable | Description | Default | When to Set |
|----------|-------------|---------|-------------|
| `API_URL` | Backend URL (internal) | `http://localhost:8080` | Docker network |
| `NEXT_PUBLIC_API_URL` | Backend URL (browser) | `http://localhost:8080` | **Always** - Must match public URL |
| `WIDGET_URL` | Widget script URL | `http://localhost:3000/widget/widget.js` | External integrations |

**Important:** `NEXT_PUBLIC_*` variables are **baked into the frontend JavaScript** at build time. You must rebuild the frontend if you change these.

### External Services

| Variable | Description | Default |
|----------|-------------|---------|
| `KABBALAHMEDIA_URL` | Kabbalahmedia API endpoint | `https://kabbalahmedia.info/backend/sqdata` |
| `KABBALAHMEDIA_TIMEOUT` | API timeout duration | `120s` |

**Timeout format:** `30s`, `2m`, `1h30m`

### Application Settings

| Variable | Description | Default | Options |
|----------|-------------|---------|---------|
| `STORAGE_TYPE` | Storage backend type | `mongodb` | `json`, `mongodb` |
| `DATA_DIR` | JSON storage directory | `./data` | Any path (if `STORAGE_TYPE=json`) |
| `APP_SCRIPT_PASSWORD` | Google Apps Script auth | `test-password-123` | Any string |
| `MAX_LESSONS_PER_LANGUAGE` | Lessons to keep per language | `5` | Any integer |
| `TEMPLATES_PATH` | Templates config file | `./templates.json` | Any path |

---

## config.toml File

Alternative to environment variables. Useful for defaults that rarely change.

**Location:** `/app/config.toml` (in Docker) or `./config.toml` (local)

### Format

```toml
[server]
bind-address = ":8080"

[app]
app-script-pass = "test-password-123"
max-lessons-per-language = 5

[storage]
type = "mongodb"  # or "json"
data_dir = "./data"

[mongodb]
uri = "mongodb://mongo:27017/study_materials_db"
database = "study_materials_db"

[kabbalahmedia]
sqdata_url = "https://kabbalahmedia.info/backend/sqdata"
timeout = "120s"

[templates]
path = "./templates.json"
```

### Environment Variable Overrides

These env vars override config.toml:

```bash
# Overrides [mongodb]
MONGO_URI=... 
STORAGE_TYPE=...

# Overrides [kabbalahmedia]
KABBALAHMEDIA_URL=...
KABBALAHMEDIA_TIMEOUT=...

# Overrides [app]
APP_SCRIPT_PASSWORD=...
MAX_LESSONS_PER_LANGUAGE=...
```

---

## Templates Configuration

**File:** `templates.json`

Defines study material templates for different event types and languages.

### Structure

```json
{
  "languages": ["he", "en", "ru", "es", "de", "it", "fr", "uk"],
  "templates": [
    {
      "type": "lesson",
      "language": "he",
      "sections": [
        {
          "id": "preparation",
          "title": "הכנה לשיעור",
          "description": "קריאה לפני השיעור",
          "order": 1,
          "links": [...]
        }
      ]
    }
  ]
}
```

### Template Fields

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Event type: `lesson`, `congress`, `meal` |
| `language` | string | ISO 639-1 code: `he`, `en`, `ru`, etc. |
| `sections[]` | array | Template sections |
| `sections[].id` | string | Unique section identifier |
| `sections[].title` | string | Display name (localized) |
| `sections[].description` | string | Section description |
| `sections[].order` | number | Display order (1-based) |
| `sections[].links[]` | array | Default links for section |

---

## Configuration Examples

### Local Development (Mac)

**.env:**
```bash
HOST_IP=localhost
BACKEND_PORT=8080
FRONTEND_PORT=3000
MONGO_HOST=mongo
MONGO_URI=mongodb://mongo:27017/study_materials_db
NEXT_PUBLIC_API_URL=http://localhost:8080
STORAGE_TYPE=mongodb
```

**Access:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- Widget: http://localhost:3000/widget/widget.js

### Production (Single Server)

**.env:**
```bash
HOST_IP=10.66.1.76
BACKEND_PORT=8081
FRONTEND_PORT=3000
MONGO_HOST=mongo
MONGO_URI=mongodb://mongo:27017/study_materials_db
NEXT_PUBLIC_API_URL=http://10.66.1.76:8081
STORAGE_TYPE=mongodb
APP_SCRIPT_PASSWORD=super-secret-password
```

**Access:**
- Frontend: http://10.66.1.76:3000
- Backend: http://10.66.1.76:8081

### Production (External MongoDB)

**.env:**
```bash
HOST_IP=10.66.1.76
BACKEND_PORT=8081
FRONTEND_PORT=3000

# MongoDB on different machine
MONGO_HOST=10.66.2.50
MONGO_PORT=27017
MONGO_URI=mongodb://10.66.2.50:27017/study_materials_db

NEXT_PUBLIC_API_URL=http://10.66.1.76:8081
STORAGE_TYPE=mongodb
```

### Production (MongoDB Atlas Cloud)

**.env:**
```bash
HOST_IP=10.66.1.76
BACKEND_PORT=8081
FRONTEND_PORT=3000

# MongoDB Atlas connection
MONGO_URI=mongodb+srv://admin:PASSWORD@cluster0.xxxxx.mongodb.net/study_materials_db?retryWrites=true&w=majority

NEXT_PUBLIC_API_URL=http://10.66.1.76:8081
STORAGE_TYPE=mongodb
```

---

## Validation

### Check Current Configuration

**From host:**
```bash
# View environment variables
docker compose config

# Check backend startup
docker compose logs backend | grep "Initialized"
```

**From container:**
```bash
docker exec -it study-backend-local /bin/sh
env | grep MONGO
```

### Test Configuration

**Backend API:**
```bash
curl http://localhost:8080/health
# Expected: OK
```

**MongoDB connection:**
```bash
docker compose logs backend | grep MongoDB
# Should show: Initialized MongoDB storage: mongodb://...
```

**Frontend API URL:**
```bash
# Open browser console on http://localhost:3000
# Check network tab - API calls should go to correct URL
```

---

## Configuration Checklist

Before deploying to production, verify:

- [ ] `.env` file created with production values
- [ ] `NEXT_PUBLIC_API_URL` matches public backend URL
- [ ] `APP_SCRIPT_PASSWORD` changed from default
- [ ] MongoDB connection string is correct
- [ ] Ports don't conflict with other services
- [ ] `HOST_IP` set to server's public IP
- [ ] MongoDB accessible from backend container
- [ ] CORS allows frontend domain (default: all origins)

---

## Troubleshooting Configuration

### Backend Can't Connect to MongoDB

1. **Check MONGO_URI:**
   ```bash
   docker compose logs backend | grep MONGO_URI
   ```

2. **Test from backend container:**
   ```bash
   docker exec -it study-backend-local /bin/sh
   nc -zv mongo 27017
   # Or: nc -zv 10.66.2.50 27017
   ```

3. **Verify MongoDB is running:**
   ```bash
   docker compose ps mongo
   docker compose logs mongo
   ```

### Frontend Shows Wrong API URL

1. **Check build args:**
   ```bash
   docker compose config | grep NEXT_PUBLIC_API_URL
   ```

2. **Rebuild frontend:**
   ```bash
   docker compose up --build -d frontend
   ```

3. **Verify in browser console:**
   - Open DevTools → Network tab
   - Check API request URLs

### Environment Variables Not Applied

1. **Stop containers:**
   ```bash
   docker compose down
   ```

2. **Rebuild with no cache:**
   ```bash
   docker compose build --no-cache
   ```

3. **Start fresh:**
   ```bash
   docker compose up -d
   ```

---

## Security Best Practices

1. **Never commit .env to git**
   - Already in `.gitignore`
   - Use `.env.example` for templates

2. **Change default passwords:**
   ```bash
   APP_SCRIPT_PASSWORD=generate-a-strong-password
   ```

3. **Enable MongoDB authentication:**
   ```bash
   MONGO_URI=mongodb://admin:password@mongo:27017/study_materials_db?authSource=admin
   ```

4. **Use HTTPS in production:**
   - Put nginx/caddy reverse proxy in front
   - Terminate SSL at proxy
   - Internal Docker network stays HTTP

5. **Restrict MongoDB port:**
   - Don't expose 27017 to public
   - Only allow backend container access

---

## Advanced Configuration

### Custom Docker Networks

```yaml
networks:
  frontend-net:
  backend-net:

services:
  frontend:
    networks:
      - frontend-net
  backend:
    networks:
      - frontend-net
      - backend-net
  mongo:
    networks:
      - backend-net
```

### Health Checks

Add to `docker-compose.yml`:

```yaml
services:
  backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### Resource Limits

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          memory: 256M
```

---

## See Also

- [Docker Guide](./DOCKER.md) - Deployment instructions
- [API Documentation](./API.md) - Backend API reference
- [Widget Integration](./WIDGET.md) - Embedding the widget






