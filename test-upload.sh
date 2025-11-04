#!/bin/bash

# Upload Feature Test Script
# Tests all critical endpoints for the upload feature

BASE_URL="${1:-https://beyondchats-mvp.vercel.app}"
echo "Testing Upload Feature at: $BASE_URL"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: OPTIONS request to /api/upload
echo "Test 1: OPTIONS /api/upload (CORS Preflight)"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$BASE_URL/api/upload")
if [ "$RESPONSE" -eq 200 ] || [ "$RESPONSE" -eq 204 ]; then
  echo -e "${GREEN}✓ PASS${NC} - Status: $RESPONSE"
else
  echo -e "${RED}✗ FAIL${NC} - Status: $RESPONSE (Expected 200 or 204)"
fi
echo ""

# Test 2: OPTIONS request to /api/chunk
echo "Test 2: OPTIONS /api/chunk (CORS Preflight)"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$BASE_URL/api/chunk")
if [ "$RESPONSE" -eq 200 ] || [ "$RESPONSE" -eq 204 ]; then
  echo -e "${GREEN}✓ PASS${NC} - Status: $RESPONSE"
else
  echo -e "${RED}✗ FAIL${NC} - Status: $RESPONSE (Expected 200 or 204)"
fi
echo ""

# Test 3: OPTIONS request to /api/pdfs
echo "Test 3: OPTIONS /api/pdfs (CORS Preflight)"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$BASE_URL/api/pdfs")
if [ "$RESPONSE" -eq 200 ] || [ "$RESPONSE" -eq 204 ]; then
  echo -e "${GREEN}✓ PASS${NC} - Status: $RESPONSE"
else
  echo -e "${RED}✗ FAIL${NC} - Status: $RESPONSE (Expected 200 or 204)"
fi
echo ""

# Test 4: GET /api/pdfs (List PDFs)
echo "Test 4: GET /api/pdfs (List PDFs)"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/pdfs")
STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
if [ "$STATUS" -eq 200 ]; then
  echo -e "${GREEN}✓ PASS${NC} - Status: $STATUS"
  echo "Response preview: $(echo "$BODY" | jq -r '.success' 2>/dev/null || echo "$BODY" | head -c 100)"
else
  echo -e "${RED}✗ FAIL${NC} - Status: $STATUS"
  echo "Response: $BODY"
fi
echo ""

# Test 5: Check CORS headers on /api/upload
echo "Test 5: Check CORS Headers on /api/upload"
CORS_HEADER=$(curl -s -I -X OPTIONS "$BASE_URL/api/upload" | grep -i "access-control-allow-origin")
if [ -n "$CORS_HEADER" ]; then
  echo -e "${GREEN}✓ PASS${NC} - CORS header found: $CORS_HEADER"
else
  echo -e "${RED}✗ FAIL${NC} - CORS header not found"
fi
echo ""

# Test 6: POST to /api/chunk without body (should fail gracefully)
echo "Test 6: POST /api/chunk without body (Error Handling)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/chunk" \
  -H "Content-Type: application/json" \
  -d '{}')
STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
if [ "$STATUS" -eq 400 ]; then
  echo -e "${GREEN}✓ PASS${NC} - Status: $STATUS (Correctly rejected invalid request)"
  echo "Error message: $(echo "$BODY" | jq -r '.error' 2>/dev/null || echo "$BODY")"
else
  echo -e "${YELLOW}⚠ WARN${NC} - Status: $STATUS (Expected 400)"
  echo "Response: $BODY"
fi
echo ""

# Test 7: Check if GET on /api/upload returns proper error
echo "Test 7: GET /api/upload (Should return 405 or error)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/upload")
STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
if [ "$STATUS" -eq 405 ]; then
  echo -e "${GREEN}✓ PASS${NC} - Status: $STATUS (Correctly only allows POST)"
else
  echo -e "${YELLOW}⚠ INFO${NC} - Status: $STATUS"
fi
echo ""

# Summary
echo "=========================================="
echo "Test Suite Complete!"
echo ""
echo "Manual Tests Required:"
echo "1. Upload a small PDF (<4.5MB) via the UI"
echo "2. Verify chunking completes successfully"
echo "3. Check browser console for CORS errors"
echo "4. Verify PDF appears in the list"
echo ""
echo "To run this script:"
echo "  chmod +x test-upload.sh"
echo "  ./test-upload.sh"
echo "  ./test-upload.sh http://localhost:3000  # for local testing"
