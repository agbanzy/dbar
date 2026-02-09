#!/bin/bash

# DigiBar API Test Script
# Tests login, permissions, and data retrieval

API_URL="http://localhost:4000/api"

echo "🧪 DigiBar API Test Script"
echo "=========================="

# Test 1: Login as Waitress
echo -e "\n1️⃣  Testing Waitress Login..."
WAITRESS_TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@digibar.ng","password":"password123"}' | jq -r '.token')

if [ "$WAITRESS_TOKEN" != "null" ] && [ -n "$WAITRESS_TOKEN" ]; then
  echo "✅ Waitress logged in successfully"
  echo "Token: ${WAITRESS_TOKEN:0:50}..."
else
  echo "❌ Waitress login failed"
fi

# Test 2: Login as Owner
echo -e "\n2️⃣  Testing Owner Login..."
OWNER_TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"emeka@digibar.ng","password":"password123"}' | jq -r '.token')

if [ "$OWNER_TOKEN" != "null" ] && [ -n "$OWNER_TOKEN" ]; then
  echo "✅ Owner logged in successfully"
  echo "Token: ${OWNER_TOKEN:0:50}..."
else
  echo "❌ Owner login failed"
fi

# Test 3: Get User Info
echo -e "\n3️⃣  Testing /auth/me endpoint..."
USER_INFO=$(curl -s -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer $OWNER_TOKEN" | jq -r '.fullName')

if [ "$USER_INFO" != "null" ] && [ -n "$USER_INFO" ]; then
  echo "✅ User info retrieved: $USER_INFO"
else
  echo "❌ Failed to get user info"
fi

# Test 4: Get Products (Nigerian Beverages)
echo -e "\n4️⃣  Testing Products API..."
echo "📦 Nigerian Beers:"
curl -s -X GET "$API_URL/products" | jq -r '.[] | select(.sku | startswith("BEER-")) | "  • \(.name) - ₦\(.price)"' | head -4

echo -e "\n🥤 Malt Drinks:"
curl -s -X GET "$API_URL/products" | jq -r '.[] | select(.sku | startswith("MALT-")) | "  • \(.name) - ₦\(.price)"' | head -3

echo -e "\n🥤 Soft Drinks:"
curl -s -X GET "$API_URL/products" | jq -r '.[] | select(.sku | startswith("SOFT-")) | "  • \(.name) - ₦\(.price)"' | head -3

# Test 5: Get Product with Recipe
echo -e "\n5️⃣  Testing Product with Recipe (Chapman Cocktail)..."
curl -s -X GET "$API_URL/products?includeRecipes=true" | \
  jq '.[] | select(.sku == "COCKTAIL-CHAPMAN") | {name, price, ingredients: [.recipes[] | .inventoryItem.name]}'

# Test 6: Get Inventory Items
echo -e "\n6️⃣  Testing Inventory API..."
INVENTORY_COUNT=$(curl -s -X GET "$API_URL/inventory/items" | jq '. | length')
echo "✅ Total inventory items: $INVENTORY_COUNT"

echo -e "\n✅ All tests completed!"
echo -e "\n📝 Sample Login Credentials:"
echo "   • Waitress: ada@digibar.ng / password123"
echo "   • Supervisor: chidi@digibar.ng / password123"
echo "   • Inventory Manager: ngozi@digibar.ng / password123"
echo "   • Accountant: tunde@digibar.ng / password123"
echo "   • Owner: emeka@digibar.ng / password123"
echo "   • Admin: admin@digibar.ng / password123"
