# Study Material Service — API Reference

Base URL: `http://<host>:<port>`
Content-Type: `application/json` for all write requests.

---

## Language / Translation Management

These are the endpoints used to add or update language translations for **templates** and **event types**.

### 1. Get current template config

```
GET /api/templates
```

Returns the full config: language list, preparation text, and all templates with their translations.

**Response**
```json
{
  "languages": ["he", "en", "ru", "es", "de", "it", "fr", "uk", "tr", "pt-BR", "bg"],
  "preparation": {
    "he": "הכנה לשיעור",
    "en": "Preparation to lesson",
    "bg": "Подготовка за урока"
  },
  "templates": [
    {
      "id": "recorded",
      "visible": true,
      "translations": {
        "he": "שיעור מוקלט",
        "en": "Recorded Lesson",
        "bg": "Записан урок"
      }
    }
  ]
}
```

---


### 3. Update translations for an existing template

```
PUT /api/templates/{id}
```

`{id}` is the template identifier e.g. `recorded`, `live`, `tes-rabash`.

**Request body** — must include all languages currently in the language list:
```json
{
  "visible": true,
  "translations": {
    "he": "שיעור מוקלט",
    "en": "Recorded Lesson",
    "ru": "Урок в записи",
    "es": "Lección grabada",
    "de": "Aufgezeichnete Lektion",
    "it": "Lezione registrata",
    "fr": "Leçon enregistrée",
    "uk": "Записаний урок",
    "tr": "Kaydedilmiş Ders",
    "pt-BR": "Aula Gravada",
    "bg": "Записан урок"
  }
}
```

**Response** — the updated template object.

---

### 4. Create a new template

```
POST /api/templates
```

**Request body** — all languages in the language list are required:
```json
{
  "id": "workshop",
  "visible": true,
  "translations": {
    "he": "סדנה",
    "en": "Workshop",
    "ru": "Воркшоп",
    "es": "Taller",
    "de": "Workshop",
    "it": "Workshop",
    "fr": "Atelier",
    "uk": "Воркшоп",
    "tr": "Atölye",
    "pt-BR": "Workshop",
    "bg": "Работилница"
  }
}
```

---

### 5. Delete a template

```
DELETE /api/templates/{id}
```

---

### 6. Event types — list (includes translations)

```
GET /api/event-types
```

Returns all event types with their per-language name translations.

---

### 7. Update an event type's translations

```
PUT /api/event-types/{id}
```

**Request body:**
```json
{
  "name": "Morning Lesson",
  "color": "blue",
  "translations": {
    "he": "שיעור בוקר",
    "en": "Morning Lesson",
    "bg": "Сутрешен урок"
  }
}
```

---

## Parts (Lesson Parts)

Each lesson part belongs to an event, has a language, and holds the description, sources, and all links.

### Get a single part

```
GET /api/parts/{id}
```

### Get all parts for an event

```
GET /api/events/{event_id}/parts
```

Optional query param: `?language=en` to filter by language.

### Update a part — description, links, sources

```
PUT /api/parts/{id}
```

You must send the full part body (all fields). Fields not included will be cleared.

**Request body:**
```json
{
  "title": "Recorded Lesson",
  "description": "Text description shown under the part title",
  "date": "2026-03-19",
  "part_type": "live_lesson",
  "language": "en",
  "order": 1,
  "lesson_link": "https://kabbalahmedia.info/lessons/...",
  "excerpts_link": "https://...",
  "transcript_link": "https://...",
  "program_link": "https://...",
  "reading_before_sleep_link": "https://...",
  "lesson_preparation_link": "https://...",
  "lineup_for_hosts_link": "https://...",
  "recorded_lesson_date": "2026-01-15",
  "sources": [
    {
      "source_id": "abc123",
      "source_title": "The Book of Zohar",
      "source_url": "https://kabbalahmedia.info/sources/abc123",
      "page_number": "42",
      "start_point": "There is a rule...",
      "end_point": "...end of section."
    }
  ],
  "custom_links": [
    {
      "title": "Additional resource",
      "url": "https://..."
    }
  ]
}
```

**Fields reference:**

| Field | Description |
|---|---|
| `title` | Part title (required) |
| `description` | Free-text description shown under the title |
| `lesson_link` | kabbalahmedia lesson video URL |
| `excerpts_link` | Selected excerpts document |
| `transcript_link` | Lesson transcript document |
| `program_link` | Program / schedule document |
| `reading_before_sleep_link` | Reading before sleep (used on preparation parts, order=0) |
| `lesson_preparation_link` | Lesson preparation material (order=0) |
| `lineup_for_hosts_link` | Lineup document for hosts |
| `recorded_lesson_date` | Original date of a recorded lesson (YYYY-MM-DD) |
| `sources` | Array of kabbalahmedia sources with optional page/paragraph range |
| `custom_links` | Array of `{title, url}` — language-specific custom links |
| `show_updated_badge` | `true` to display an "Updated" badge next to the part title on the public site. Must be set explicitly by admin — never set automatically. |

> **Note:** `id`, `language`, `event_id`, and `created_at` are immutable — they are ignored even if included in the request body.

### Delete a part

```
DELETE /api/parts/{id}
```

---

