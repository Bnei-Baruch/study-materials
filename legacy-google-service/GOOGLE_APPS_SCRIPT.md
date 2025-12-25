# Google Apps Script Setup

This guide explains how to set up Google Apps Script to automatically push study material updates to the service when files change in Google Drive.

## Overview

The script monitors a Google Drive folder for changes and automatically:
1. Detects when new documents are added or existing ones are modified
2. Extracts the last 5 documents per language
3. Converts document content to HTML
4. Pushes updates to the service via POST /api/sync

## Setup Steps

### 1. Create the Apps Script Project

1. Go to https://script.google.com
2. Click "New Project"
3. Name it "Study Materials Sync"

### 2. Add the Script Code




### 3. Configure the Script

Update the `CONFIG` object:
- `serviceUrl`: Your service URL
- `password`: The password from your config.toml
- `rootFolderId`: Your Google Drive root folder ID
- `languageFolders`: Map of folder IDs to language codes

### 4. Set Up the Trigger

1. Click the clock icon (Triggers) in the left sidebar
2. Click "+ Add Trigger"
3. Configure:
   - Function: `onDriveChange`
   - Event source: "From Drive"
   - Event type: "On change"
4. Click "Save"

### 5. Grant Permissions

1. Run `manualSync()` once to test
2. Authorize the script when prompted
3. Grant the necessary permissions

## Testing

### Manual Test

1. Run `manualSync()` from the script editor
2. Check the execution log for results
3. Verify data appears in your service

### Automatic Test

1. Add or modify a document in your Drive folder
2. Wait a few minutes for the trigger to fire
3. Check if the service receives the update

## Sample Test Data

Create a JSON file for testing the service directly:

```json
[
  {
    "id": "hebrew-2025-07-03",
    "title": "חומר לימוד: חמישי, 3.7.2025",
    "date": "2025-07-03T00:00:00Z",
    "content": "<p>This is test content</p>",
    "language": "hebrew",
    "original_url": "https://docs.google.com/document/d/test"
  }
]
```

Test with curl:
```bash
curl -X POST http://localhost:8080/api/sync \
  -H "Authorization: Pass your-password" \
  -H "Content-Type: application/json" \
  -d @test_data.json
```

## Troubleshooting

- **Script not triggering**: Check trigger configuration and permissions
- **401 Unauthorized**: Verify password in both script and service config
- **Empty response**: Check folder IDs and file permissions
- **Date parsing fails**: Ensure file names follow the expected format

## Advanced: Better HTML Conversion

For better HTML conversion, consider using the Google Docs API or a more sophisticated parsing approach to preserve formatting, links, and styles.


