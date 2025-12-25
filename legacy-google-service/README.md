# Legacy Google Docs-Based Service

This folder contains the **original Google Docs-based study material service** that was replaced by the new POC system.

## What Was This Service?

A simple, event-driven REST API for serving study materials from Google Drive:

### Architecture
```
Google Drive → Google Apps Script → HTTP POST → Go Service (in-memory cache) → API
```

### Key Features
- ✅ Event-driven updates (onChange triggers)
- ✅ No database (in-memory cache only)
- ✅ Backward compatible API
- ✅ Multi-language support
- ✅ HTML processing with target="_blank"
- ✅ Password-protected sync endpoint

### How It Worked
1. Someone adds/edits a Google Doc in the Drive folder
2. Google Apps Script `onChange` trigger fires
3. Script extracts last 5 docs per language, converts to HTML
4. Script POSTs to `/api/sync` with password
5. Go service updates in-memory cache
6. Websites fetch from `/api/units` or `/api/lessons`

## Files Archived

```
legacy-google-service/
├── common/                       # Shared code
│   ├── models.go                # Data structures & cache
│   ├── response.go              # API responses
│   ├── utils.go
│   └── html_editor.go           # HTML processing
├── handle_get_units.go          # Legacy endpoint
├── handle_get_languages.go      # Languages endpoint
├── handle_get_lessons.go        # Rich lessons endpoint
├── handle_sync.go               # Webhook endpoint
├── auth.go                      # Password middleware
├── test_data.json               # Sample test data
├── GOOGLE_APPS_SCRIPT.md        # Setup instructions
├── QUICKSTART.md                # Quick start guide
├── TEST_RESULTS.md              # Test verification
└── README.md                    # This file
```

## Why Was It Replaced?

The new POC system provides:
- ✅ Real content authoring (not just serving from Google Docs)
- ✅ Direct integration with kabbalahmedia API
- ✅ Rich UI for creating structured lesson parts
- ✅ Source selection with autocomplete
- ✅ JSON storage (human-readable, git-friendly)
- ✅ Better foundation for Phase 2 expansion

## Status

- **Created:** December 15, 2025
- **Archived:** December 22, 2025
- **Replaced by:** New POC system with JSON storage and kabbalahmedia integration
- **Reason:** New requirements for content authoring vs. simple serving

## If You Need to Reference It

This code is kept for reference and can be useful for:
- Understanding the original Google Docs integration
- Backward compatibility requirements
- HTML processing logic
- Event-driven webhook patterns

## Original Documentation

See the original files in this folder:
- `QUICKSTART.md` - How the service worked
- `GOOGLE_APPS_SCRIPT.md` - Google Apps Script setup
- `TEST_RESULTS.md` - Test results from the original service
