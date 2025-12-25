# Lesson Parts POC - Frontend

Next.js frontend for creating lesson parts with source selection.

## Getting Started

1. Make sure the backend is running on `http://localhost:8080`

2. Start the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Features

- ✅ Title input field
- ✅ Source search with autocomplete
- ✅ Add/remove selected sources
- ✅ Create lesson part
- ✅ Display created lesson part

## API Integration

The frontend connects to the backend API at:
- `POST /api/parts` - Create lesson part
- `GET /api/sources/search?q=...` - Search sources
