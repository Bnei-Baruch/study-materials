# Architecture Notes

## Date Field Behavior

### Current (Phase 1.3)
- Lesson parts have a `date` field
- Frontend defaults to **today's date**
- User can change the date manually

### Future (Phase 2+)
- **Events** will have dates (e.g., Daily Lesson event on 2025-12-23)
- **Lesson parts belong to events**
- When creating a part **within an event**, the date defaults to the **event's date**
- Parts inherit their date from the parent event

### Migration Path
```
Phase 1.3 (NOW):
  LessonPart { date }  ← defaults to today

Phase 2:
  Event { date, type: "daily_lesson" }
    → Parts { date }  ← defaults to event.date

Phase 3:
  Event { date, number: 1 }  ← multiple events per day
    → Parts { date, order: 1 }
```

## Event Types

Based on requirements, events will have types:
- `daily_lesson` - Daily morning/evening lessons
- `meal` - Special meals (e.g., Tu B'Shvat meal)
- `convention` - Multi-day conventions
- `lecture` - Single lectures/talks

Each event type may have different requirements for parts.

## Part Types

Parts can be:
- `live_lesson` - Created manually with title/description/sources
- `recorded_lesson` - Auto-filled from kabbalahmedia URL

## Current State vs Final Architecture

### Current Structure (Phase 1.3)
```json
{
  "id": "uuid",
  "title": "Morning Lesson",
  "description": "Study of Shamati...",
  "date": "2025-12-23T00:00:00Z",
  "sources": [...]
}
```

### Target Structure (Phase 4)
```json
{
  "event": {
    "id": "event-uuid",
    "date": "2025-12-23",
    "type": "daily_lesson",
    "number": 1,
    "parts": [
      {
        "id": "part-uuid",
        "type": "live_lesson",
        "order": 1,
        "language": "he",
        "title": "Morning Lesson Part 1",
        "description": "Study of Shamati...",
        "sources": [...],
        "translations": {
          "en": { "title": "...", "description": "..." },
          "ru": { "title": "...", "description": "..." }
        }
      }
    ]
  }
}
```

## Incremental Steps

✅ **Phase 1.1**: Basic parts (title, sources)
✅ **Phase 1.2**: Add description
✅ **Phase 1.3**: Add date (defaults to today)

🔜 **Next steps toward events:**

1. **Add part_type field** (`live_lesson` | `recorded_lesson`)
   - Simple enum/string field
   - Prepares for different part creation flows
   - No throwaway work

2. **Add language field** (default "he")
   - Simple string field
   - Prepares for multi-language
   - No throwaway work

3. **Create Event model** (date, type, number)
   - New model, doesn't change parts
   - Parts can reference events
   - Clean separation

4. **Link parts to events** (add event_id to parts)
   - Parts get optional event_id field
   - When creating part within event, date defaults to event.date
   - Parts can still exist independently (backward compatible)

5. **Add translations** to parts
   - Add translations map to parts
   - Current title/description become source language
   - No structural changes

## Key Principles

1. **No throwaway work** - Every field we add stays
2. **Backward compatible** - Old parts still work
3. **Incremental** - Small, testable steps
4. **Future-proof** - Fields align with final architecture

---

Last updated: December 23, 2025

