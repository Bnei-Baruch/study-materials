#!/bin/bash

echo "Testing POC API..."
echo ""

# Health check
echo "1. Health check:"
curl -s http://localhost:8080/health
echo -e "\n"

# Search sources
echo "2. Search sources:"
curl -s "http://localhost:8080/api/sources/search?q=zohar" | jq '.'
echo ""

# Create a lesson part
echo "3. Create a lesson part:"
RESPONSE=$(curl -s -X POST http://localhost:8080/api/parts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Morning Lesson - Dec 21, 2025",
    "sources": [
      {
        "source_id": "zohar-1",
        "source_title": "Zohar, Part 1",
        "source_url": "https://kabbalahmedia.info/sources/zohar-1"
      }
    ]
  }')

echo "$RESPONSE" | jq '.'
PART_ID=$(echo "$RESPONSE" | jq -r '.id')
echo ""

# List all parts
echo "4. List all parts:"
curl -s http://localhost:8080/api/parts | jq '.'
echo ""

# Get specific part
echo "5. Get specific part (ID: $PART_ID):"
curl -s "http://localhost:8080/api/parts/$PART_ID" | jq '.'
echo ""

echo "✅ POC API test complete!"


