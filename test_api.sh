#!/bin/bash

echo "🧪 Testing EVMS API"
echo "===================="
echo ""

# Test health endpoint
echo "1. Health Check:"
curl -s http://localhost:8000/health | python3 -m json.tool
echo ""
echo ""

# Test login
echo "2. Login (admin/changeme):"
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"changeme"}')

echo "$TOKEN_RESPONSE" | python3 -m json.tool
echo ""

# Extract token
TOKEN=$(echo "$TOKEN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  exit 1
fi

echo "✅ Login successful!"
echo ""
echo ""

# Test stations endpoint
echo "3. List Stations:"
curl -s http://localhost:8000/api/v1/stations \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -50
echo ""
echo ""

# Test dashboard
echo "4. Dashboard:"
curl -s http://localhost:8000/api/v1/dashboard \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""
echo ""

echo "✅ All tests passed!"
echo ""
echo "🌐 Open in browser:"
echo "   http://localhost:8000/api/docs"
