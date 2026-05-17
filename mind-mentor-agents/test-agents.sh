#!/bin/bash
# Quick smoke test for running agents
# Run AFTER dev-local.sh is up

set -e

AGENTS_URL="http://localhost:8787"
EXPRESS_URL="http://localhost:8000"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Testing Mind Mentor services..."
echo ""

# ── Health checks ────────────────────────────────────────────────────────────

echo -n "Express backend (:8000)... "
if curl -s "$EXPRESS_URL/api/auth/providers" > /dev/null 2>&1; then
  echo -e "${GREEN}UP${NC}"
else
  echo -e "${RED}DOWN${NC}"
fi

echo -n "Agents health (:8787)... "
HEALTH=$(curl -s "$AGENTS_URL/health" 2>/dev/null)
if echo "$HEALTH" | grep -q "ok"; then
  echo -e "${GREEN}UP${NC}"
else
  echo -e "${RED}DOWN${NC} ($HEALTH)"
fi

echo -n "Next.js (:3000)... "
if curl -s "http://localhost:3000" > /dev/null 2>&1; then
  echo -e "${GREEN}UP${NC}"
else
  echo -e "${RED}DOWN${NC}"
fi

echo ""

# ── Test agent endpoints (no auth, expect 401) ──────────────────────────────

echo "Testing auth rejection (no token)..."

echo -n "  POST /tutor/chat... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$AGENTS_URL/tutor/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"hello"}')
if [ "$STATUS" = "401" ]; then
  echo -e "${GREEN}401 (correct)${NC}"
else
  echo -e "${YELLOW}$STATUS (expected 401)${NC}"
fi

echo -n "  GET /analyst/insights... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$AGENTS_URL/analyst/insights")
if [ "$STATUS" = "401" ]; then
  echo -e "${GREEN}401 (correct)${NC}"
else
  echo -e "${YELLOW}$STATUS (expected 401)${NC}"
fi

echo ""

# ── Test with a JWT (if NEXTAUTH_SECRET available) ───────────────────────────

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
if [ -f "$ROOT_DIR/.env" ]; then
  SECRET=$(grep "^NEXTAUTH_SECRET=" "$ROOT_DIR/.env" | cut -d= -f2-)
  if [ -n "$SECRET" ] && command -v node &> /dev/null; then
    echo "Generating test JWT..."

    TOKEN=$(node -e "
      const { SignJWT } = require('jose');
      const secret = new TextEncoder().encode('$SECRET');
      new SignJWT({ id: '000000000000000000000001' })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1h')
        .sign(secret)
        .then(t => process.stdout.write(t));
    " 2>/dev/null || echo "")

    if [ -n "$TOKEN" ]; then
      echo -e "${GREEN}✓ JWT generated${NC}"
      echo ""
      echo "Testing authenticated endpoints..."

      echo -n "  GET /analyst/insights (with JWT)... "
      STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$AGENTS_URL/analyst/insights" \
        -H "Authorization: Bearer $TOKEN")
      echo -e "${YELLOW}$STATUS${NC}"

      echo -n "  POST /tutor/chat (with JWT, streaming)... "
      BODY=$(curl -s -m 10 -X POST "$AGENTS_URL/tutor/chat" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"message":"What is a binary tree?"}' 2>/dev/null | head -c 200)
      if [ -n "$BODY" ]; then
        echo -e "${GREEN}Got response${NC}"
        echo "    First 100 chars: ${BODY:0:100}"
      else
        echo -e "${YELLOW}No response (may need GROQ_API_KEY + MEM0_API_KEY in .dev.vars)${NC}"
      fi
    else
      echo -e "${YELLOW}⚠ Could not generate JWT (jose not in root node_modules?)${NC}"
    fi
  fi
fi

echo ""
echo -e "${BLUE}Done. If agents return 500, check .dev.vars has valid API keys.${NC}"
