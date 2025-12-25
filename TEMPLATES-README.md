# Template Management Guide

## Overview
The system uses a `templates.json` configuration file to manage title templates and supported languages. This allows you to easily add, edit, or remove templates without changing code.

## Configuration File: `templates.json`

### Structure

```json
{
  "languages": ["he", "en", "ru", "uk", "es", "de", "it", "fr"],
  "preparation": {
    "he": "הכנה לשיעור",
    "en": "Preparation to lesson",
    ...
  },
  "templates": [
    {
      "id": "recorded",
      "translations": {
        "he": "שיעור מוקלט",
        "en": "Recorded lesson",
        ...
      }
    }
  ]
}
```

### Fields

- **languages**: Array of supported language codes (ISO 639-1)
- **preparation**: Translations for the preparation part (order 0)
- **templates**: Array of title templates

## How to Add a New Language

1. Open `templates.json`
2. Add the language code to the `languages` array
3. Add translations for all templates
4. Restart the backend server

Example - Adding Portuguese:

```json
{
  "languages": ["he", "en", "ru", "uk", "es", "de", "it", "fr", "pt"],
  "preparation": {
    "he": "הכנה לשיעור",
    "en": "Preparation to lesson",
    ...
    "pt": "Preparação para a lição"
  },
  "templates": [
    {
      "id": "recorded",
      "translations": {
        ...
        "pt": "Lição gravada"
      }
    }
  ]
}
```

**Note**: You must also update the frontend to display the new language:
- Add to `frontend/components/PartForm.tsx`: language select options
- Add to `frontend/app/events/[id]/page.tsx`: `languageNames` object

## How to Add a New Template

1. Open `templates.json`
2. Add a new object to the `templates` array with:
   - Unique `id` (use lowercase, no spaces)
   - `translations` for all supported languages
3. Restart the backend server

Example - Adding "Workshop" template:

```json
{
  "id": "workshop",
  "translations": {
    "he": "סדנה",
    "en": "Workshop",
    "ru": "Семинар",
    "uk": "Семінар",
    "es": "Taller",
    "de": "Workshop",
    "it": "Workshop",
    "fr": "Atelier"
  }
}
```

## How to Edit Existing Templates

1. Open `templates.json`
2. Find the template by its `id`
3. Update the translations you want to change
4. Restart the backend server

## How to Remove a Template

1. Open `templates.json`
2. Remove the entire template object from the `templates` array
3. Restart the backend server

## Restarting the Backend

After making changes to `templates.json`:

```bash
# Stop the current server
pkill -f "study-material-service-poc server"

# Start the server
./study-material-service-poc server
```

Or if using systemd/supervisor, restart the service.

## Current Templates

- **recorded**: Recorded lesson
- **live**: Live broadcast with Rav
- **tes**: TES Lesson With RABASH
- **zohar**: Zohar Reading
- **society**: Building a spiritual society

## Supported Languages (8)

- 🇮🇱 Hebrew (he)
- 🇬🇧 English (en)
- 🇷🇺 Russian (ru)
- 🇺🇦 Ukrainian (uk)
- 🇪🇸 Spanish (es)
- 🇩🇪 German (de)
- 🇮🇹 Italian (it)
- 🇫🇷 French (fr)

## How It Works

When you create a lesson part using a template:

1. You select a template in your chosen language
2. The title is auto-filled in that language
3. The backend automatically creates translation stubs in **all** other languages
4. Each stub gets the translated title from `templates.json`
5. Users can switch languages and see the pre-translated titles

## Validation

The system will fail to start if:
- `templates.json` is missing
- JSON syntax is invalid
- Required fields are missing

Check the server logs for error messages.
