# Study Material Service - POC

Modern lesson authoring system with multi-language support and kabbalahmedia integration.

## 🎯 Current Status: POC Complete

This is the **new POC** for the lesson authoring system. The old Google Docs-based service has been moved to `legacy-google-service/`.

## ✨ What This POC Does

- ✅ Create lesson parts with title, description, date, type, language, and sources
- ✅ Search real sources from kabbalahmedia API
- ✅ Store data in JSON files (no database needed)
- ✅ Beautiful Next.js frontend with Tailwind CSS
- ✅ Source autocomplete with real-time search
- ✅ Optional description field for rich content
- ✅ Date picker (defaults to today)
- ✅ Part type tracking (live_lesson/recorded_lesson)
- ✅ Language identification (defaults to Hebrew)

## 🚀 Quick Start

```bash
# Start both servers
./START-POC.sh

# Or manually:
# Terminal 1: Backend
./study-material-service-poc server

# Terminal 2: Frontend
cd frontend && npm run dev
```

Then open: **http://localhost:3000**

## 📖 Documentation

- **[POC-README.md](POC-README.md)** - Complete POC guide
- **[POC-SUMMARY.md](POC-SUMMARY.md)** - Overview and summary
- **[POC-CHANGELOG.md](POC-CHANGELOG.md)** - Version history

## 🏗️ Architecture

```
Backend (Go)
├── storage/          # JSON file storage
├── integrations/     # kabbalahmedia API client
└── api/              # REST endpoints

Frontend (Next.js)
├── app/page.tsx      # Main POC page
└── components/       # Reusable components
```

## 📁 Project Structure

```
study-material-service/
├── storage/                    # NEW: JSON storage layer
├── integrations/               # NEW: kabbalahmedia API
├── api/
│   ├── handle_parts_poc.go   # NEW: POC endpoints
│   ├── handle_sources.go     # NEW: Source search
│   └── api.go                # Updated router
├── frontend/                  # NEW: Next.js app
├── data/                      # NEW: JSON data files
├── legacy-google-service/     # OLD: Previous implementation
├── POC-README.md             # Documentation
├── START-POC.sh              # Helper script
└── study-material-service-poc # Compiled binary
```

## 🧪 API Endpoints

```bash
# Health check
GET /health

# Create lesson part
POST /api/parts
{
  "title": "Morning Lesson",
  "sources": [...]
}

# List all parts
GET /api/parts

# Get specific part
GET /api/parts/{id}

# Search sources
GET /api/sources/search?q=zohar
```

## 🎨 Frontend Features

- Beautiful gradient UI design
- Real-time source search autocomplete
- Add/remove multiple sources
- Create button with loading states
- Success feedback with part details
- Fully responsive

## 🔄 What's Next: Phase 2

After POC validation, expand to:
1. Events with dates and types (lesson/meal/convention)
2. Multiple parts per event
3. Multi-language translations
4. Recorded lessons with metadata fetching
5. Templates for common lesson types
6. Archive with search and filters
7. Beautiful public view
8. Authentication

## 📊 POC Stats

- **Backend:** Go 1.21+, ~350 lines
- **Frontend:** Next.js 15, TypeScript, ~300 lines
- **Storage:** JSON files (no database)
- **API Response:** < 10ms
- **Source Cache:** ~500KB, fetched on startup

## 🗂️ Legacy Service

The original Google Docs-based service has been moved to:
- **[legacy-google-service/](legacy-google-service/)** - Old implementation with Google Apps Script webhooks

## 🛠️ Technologies

- **Backend:** Go, Gorilla Mux, CORS
- **Frontend:** Next.js 15, React, TypeScript, Tailwind CSS
- **Storage:** JSON files
- **External API:** kabbalahmedia.info sqdata

## 📝 License

[Your License Here]

---

**Version:** 3.2 (Enhanced fields - links and page numbers)  
**Last Updated:** December 23, 2025  
**Status:** ✅ Backend Complete - Ready for UI
