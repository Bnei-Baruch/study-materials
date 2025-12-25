# POC Changelog

## Version 1.1 - Real API Integration (Dec 22, 2025)

### ✨ New Features
- **Real kabbalahmedia Source Search**: Now searches actual sources from kabbalahmedia API instead of mock data
- **Source Hierarchy Caching**: Fetches and caches complete source tree on startup
- **Smart Search**: Recursively searches through authors, collections, and articles
- **Full Path Display**: Shows complete path like "Author > Collection > Article"

### 🔧 Technical Changes
- Updated `integrations/kabbalahmedia/sqdata.go`:
  - Added `SQDataResponse` and `SourceNode` structs for API response
  - Implemented `ensureSourcesCache()` for one-time fetch and caching
  - Implemented `searchNode()` for recursive hierarchy search
  - Limits results to 20 items
- Updated `cmd/server.go`:
  - Increased timeout to 120s for large sqdata file
  - Added background pre-fetch to warm up cache on startup
  - Better logging for cache status
- Updated `config.toml`:
  - Changed `timeout_seconds` to `timeout` with duration format

### 📊 Performance
- **Cache fetch**: ~1 second on startup
- **Search response**: < 10ms (cached)
- **Cache size**: ~500KB source hierarchy

### 🧪 Testing
```bash
# Test search
curl "http://localhost:8080/api/sources/search?q=zohar"
curl "http://localhost:8080/api/sources/search?q=shamati"
curl "http://localhost:8080/api/sources/search?q=preface"
```

---

## Version 1.0 - Initial POC (Dec 22, 2025)

### ✨ Initial Features
- JSON file storage for lesson parts
- Mock source search (5 sources)
- REST API endpoints (create, get, list parts)
- Next.js frontend with Tailwind CSS
- Source autocomplete component
- Beautiful gradient UI

### 📁 Files Created
- Backend: `storage/`, `integrations/`, `api/handle_parts_poc.go`, etc.
- Frontend: `frontend/app/page.tsx`, `frontend/components/SourceSearch.tsx`
- Docs: `POC-README.md`, `START-POC.sh`, `STOP-SERVERS.sh`

