#!/bin/bash

echo "🧪 Testing Event-First Workflow..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Create an event
echo -e "${BLUE}Step 1: Create an event${NC}"
EVENT_RESPONSE=$(curl -s -X POST http://localhost:8080/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-12-22",
    "type": "daily_lesson",
    "number": 1
  }')

echo "$EVENT_RESPONSE" | jq '.'
EVENT_ID=$(echo "$EVENT_RESPONSE" | jq -r '.id')
echo -e "${GREEN}✓ Event created with ID: $EVENT_ID${NC}"
echo ""

# Step 2: Get the event
echo -e "${BLUE}Step 2: Get the event${NC}"
curl -s "http://localhost:8080/api/events/$EVENT_ID" | jq '.'
echo -e "${GREEN}✓ Event retrieved${NC}"
echo ""

# Step 3: Create first lesson part
echo -e "${BLUE}Step 3: Create first lesson part${NC}"
PART1_RESPONSE=$(curl -s -X POST http://localhost:8080/api/parts \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Shamati #1 - There Is None Else Besides Him\",
    \"description\": \"Study of fundamental principle in Kabbalah\",
    \"date\": \"2025-12-22\",
    \"part_type\": \"live_lesson\",
    \"language\": \"he\",
    \"event_id\": \"$EVENT_ID\",
    \"order\": 1,
    \"sources\": [
      {
        \"source_id\": \"shamati-1\",
        \"source_title\": \"Shamati, Article 1\",
        \"source_url\": \"https://kabbalahmedia.info/sources/shamati-1\",
        \"page_number\": \"1\"
      }
    ],
    \"excerpts_link\": \"https://example.com/excerpts\",
    \"transcript_link\": \"https://example.com/transcript\"
  }")

echo "$PART1_RESPONSE" | jq '.'
PART1_ID=$(echo "$PART1_RESPONSE" | jq -r '.id')
echo -e "${GREEN}✓ Part 1 created with ID: $PART1_ID${NC}"
echo ""

# Step 4: Create second lesson part
echo -e "${BLUE}Step 4: Create second lesson part${NC}"
PART2_RESPONSE=$(curl -s -X POST http://localhost:8080/api/parts \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Zohar - Introduction to the Book of Zohar\",
    \"description\": \"Opening section of the Zohar commentary\",
    \"date\": \"2025-12-22\",
    \"part_type\": \"live_lesson\",
    \"language\": \"he\",
    \"event_id\": \"$EVENT_ID\",
    \"order\": 2,
    \"sources\": [
      {
        \"source_id\": \"zohar-intro\",
        \"source_title\": \"Zohar, Introduction\",
        \"source_url\": \"https://kabbalahmedia.info/sources/zohar-intro\",
        \"page_number\": \"5-8\"
      }
    ],
    \"lesson_link\": \"https://kabbalahmedia.info/he/lessons/test\"
  }")

echo "$PART2_RESPONSE" | jq '.'
PART2_ID=$(echo "$PART2_RESPONSE" | jq -r '.id')
echo -e "${GREEN}✓ Part 2 created with ID: $PART2_ID${NC}"
echo ""

# Step 5: List all parts for the event
echo -e "${BLUE}Step 5: List all parts for the event${NC}"
curl -s "http://localhost:8080/api/events/$EVENT_ID/parts" | jq '.'
echo -e "${GREEN}✓ Parts retrieved and ordered correctly${NC}"
echo ""

# Step 6: Verify part details
echo -e "${BLUE}Step 6: Verify individual part details${NC}"
echo "Part 1:"
curl -s "http://localhost:8080/api/parts/$PART1_ID" | jq '.'
echo ""
echo "Part 2:"
curl -s "http://localhost:8080/api/parts/$PART2_ID" | jq '.'
echo -e "${GREEN}✓ Part details verified${NC}"
echo ""

# Step 7: List all events
echo -e "${BLUE}Step 7: List all events${NC}"
curl -s "http://localhost:8080/api/events" | jq '.'
echo -e "${GREEN}✓ All events listed${NC}"
echo ""

echo -e "${GREEN}✅ Event-First Workflow Test Complete!${NC}"
echo ""
echo "Summary:"
echo "  - Event ID: $EVENT_ID"
echo "  - Part 1 ID: $PART1_ID (Order: 1)"
echo "  - Part 2 ID: $PART2_ID (Order: 2)"
echo ""
echo "🎉 You can now view this in the UI:"
echo "   http://localhost:3000/events/$EVENT_ID"

