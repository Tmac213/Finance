#!/bin/bash

# Test script to verify API endpoints are working
# Usage: ./test-api-endpoints.sh YOUR_AUTH_TOKEN

TOKEN=$1
API_BASE=${API_BASE_URL:-http://localhost:3001}

if [ -z "$TOKEN" ]; then
  echo "Usage: ./test-api-endpoints.sh YOUR_AUTH_TOKEN"
  echo ""
  echo "To get your token:"
  echo "1. Open browser DevTools (F12)"
  echo "2. Go to Application/Storage > Local Storage"
  echo "3. Find 'authToken' or 'token'"
  exit 1
fi

echo "=========================================="
echo "Testing Fixed Dues API Endpoints"
echo "=========================================="
echo ""

# Test GET endpoint
echo "1. Testing GET /api/fixed-dues"
echo "----------------------------------------"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X GET "${API_BASE}/api/fixed-dues" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✓ GET request successful (HTTP $HTTP_CODE)"
  COUNT=$(echo "$BODY" | jq '. | length' 2>/dev/null || echo "0")
  echo "  Found $COUNT fixed dues"
  if [ "$COUNT" -gt 0 ]; then
    echo "  Sample fixed due:"
    echo "$BODY" | jq '.[0]' 2>/dev/null | head -10
  fi
else
  echo "✗ GET request failed (HTTP $HTTP_CODE)"
  echo "  Response: $BODY"
fi

echo ""
echo "2. Testing POST /api/fixed-dues (creating test fixed due)"
echo "----------------------------------------"
TEST_ID="test-$(date +%s)"
TEST_PAYLOAD=$(cat <<EOF
{
  "id": "${TEST_ID}",
  "name": "Test Fixed Due",
  "amount": 100.00,
  "recurrence": "monthly",
  "start_date": "2024-01-01",
  "end_date": "2024-12-31",
  "due_date": "2024-01-01",
  "is_paid": false
}
EOF
)

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST "${API_BASE}/api/fixed-dues" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$TEST_PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "201" ]; then
  echo "✓ POST request successful (HTTP $HTTP_CODE)"
  echo "  Created fixed due: $TEST_ID"
  
  # Verify it was created
  echo ""
  echo "3. Verifying fixed due was created"
  echo "----------------------------------------"
  VERIFY_RESPONSE=$(curl -s -X GET "${API_BASE}/api/fixed-dues" \
    -H "Authorization: Bearer ${TOKEN}")
  
  VERIFY_COUNT=$(echo "$VERIFY_RESPONSE" | jq "[.[] | select(.id == \"${TEST_ID}\")] | length" 2>/dev/null || echo "0")
  
  if [ "$VERIFY_COUNT" = "1" ]; then
    echo "✓ Fixed due verified on server"
  else
    echo "✗ Fixed due not found on server"
  fi
  
  # Clean up - delete test fixed due
  echo ""
  echo "4. Cleaning up test data"
  echo "----------------------------------------"
  DELETE_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
    -X DELETE "${API_BASE}/api/fixed-dues/${TEST_ID}" \
    -H "Authorization: Bearer ${TOKEN}")
  
  DELETE_CODE=$(echo "$DELETE_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
  if [ "$DELETE_CODE" = "200" ] || [ "$DELETE_CODE" = "204" ]; then
    echo "✓ Test fixed due deleted"
  else
    echo "⚠ Test fixed due may still exist (HTTP $DELETE_CODE)"
  fi
  
else
  echo "✗ POST request failed (HTTP $HTTP_CODE)"
  echo "  Response: $BODY"
  echo ""
  echo "Common issues:"
  echo "  - Database migration not run (check for 'Unknown column' error)"
  echo "  - Backend server not running"
  echo "  - Invalid auth token"
fi

echo ""
echo "=========================================="

