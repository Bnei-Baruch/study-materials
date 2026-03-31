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

> **Note:** `id`, `language`, `event_id`, and `created_at` are immutable — they are ignored even if included in the request body.

### Delete a part

```
DELETE /api/parts/{id}
```

---

## Workflow: Adding a New Language

1. Add the language code to the `languages` array in `templates.json`.
2. Add translations for every template and the `preparation` key in `templates.json`.
3. Update `storage/seed_event_types.go` with translations for all event types.
4. Update the relevant frontend files (language selector dropdowns, `LANGUAGES` maps, `TRANSLATIONS` maps).
5. Build and deploy the Docker container.
6. Call the sync endpoint to push the new language into MongoDB:
   ```bash
   curl -X POST http://<host>:<port>/api/templates/sync
   ```
7. Update event types via the admin UI or with `PUT /api/event-types/{id}` if their translations are not yet updated in MongoDB.

---


**Currently the API has no authentication.** All endpoints — including destructive ones (DELETE, PUT) — are publicly accessible to anyone who can reach the host/port.

### Recommended approaches (pick one based on your setup)

#### Option A — API Key (simplest)
Add a shared secret header checked by a middleware in `api.go`. Write requests require the header; GET requests can remain open for public widgets.

```
X-API-Key: <your-secret>
```

Only the admin UI and trusted callers know the key. Rotate it by changing the environment variable and redeploying.

#### Option B — Reverse proxy with IP allowlist (no code change)
Put the service behind nginx or Caddy and restrict write routes (`POST /api/*`, `PUT /api/*`, `DELETE /api/*`) to trusted IP ranges (your office/VPN). The public widget endpoints (`GET /api/events`, `GET /api/templates`) stay open.

```nginx
location ~ ^/api/(events|templates|event-types|parts) {
    limit_except GET OPTIONS {
        allow 10.66.0.0/16;   # internal network
        deny  all;
    }
    proxy_pass http://backend:8080;
}
```

#### Option C — JWT / OAuth2 (most robust)
Integrate with your existing identity provider (if you have one). The admin frontend obtains a token on login and sends it as `Authorization: Bearer <token>`. The backend validates it in middleware.

This is the right choice if the service will be exposed to the internet and multiple users with different permission levels need access.

---

### Current risk

If the service is only reachable on an internal network (e.g. `10.66.x.x`), the risk is low. If it is or will be publicly exposed, **Option A or B should be added before that happens**.
