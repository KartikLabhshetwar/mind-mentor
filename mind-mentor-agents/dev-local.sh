#!/bin/bash
# Local development script for Mind Mentor Agents
# Starts all 3 services: Express backend, Cloudflare Workers (agents), Next.js frontend

set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
AGENTS_DIR="$(cd "$(dirname "$0")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Mind Mentor - Local Dev Environment    ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""

# ── Check prerequisites ──────────────────────────────────────────────────────

check_prereq() {
  if ! command -v "$1" &> /dev/null; then
    echo -e "${RED}✗ $1 not found. $2${NC}"
    exit 1
  fi
}

check_prereq "node" "Install Node.js 18+"
check_prereq "npx" "Install Node.js 18+"
check_prereq "mongosh" "Install MongoDB (brew install mongodb-community)"

# Check MongoDB is running
if ! mongosh --eval "db.runCommand({ ping: 1 })" --quiet &> /dev/null; then
  echo -e "${YELLOW}⚠ MongoDB not running. Attempting to start...${NC}"
  if command -v brew &> /dev/null; then
    brew services start mongodb-community 2>/dev/null || true
    echo -e "${YELLOW}  Waiting for MongoDB to start...${NC}"
    sleep 5
  fi
  if ! mongosh --eval "db.runCommand({ ping: 1 })" --quiet &> /dev/null; then
    echo -e "${RED}✗ Cannot connect to MongoDB. Start it manually.${NC}"
    exit 1
  fi
fi
echo -e "${GREEN}✓ MongoDB running${NC}"

# ── Check env files ──────────────────────────────────────────────────────────

if [ ! -f "$ROOT_DIR/.env" ]; then
  echo -e "${RED}✗ Missing $ROOT_DIR/.env${NC}"
  echo "  Need: NEXTAUTH_SECRET, MONGODB_URI, GROQ_API_KEY"
  exit 1
fi
echo -e "${GREEN}✓ Root .env found${NC}"

# Create .dev.vars for wrangler if missing
if [ ! -f "$AGENTS_DIR/.dev.vars" ]; then
  echo -e "${YELLOW}⚠ Creating $AGENTS_DIR/.dev.vars from root .env...${NC}"

  # Extract needed vars from root .env
  NEXTAUTH_SECRET=$(grep "^NEXTAUTH_SECRET=" "$ROOT_DIR/.env" | cut -d= -f2-)
  GROQ_API_KEY=$(grep "^GROQ_API_KEY=" "$ROOT_DIR/.env" | cut -d= -f2-)
  MONGODB_URI=$(grep "^MONGODB_URI=" "$ROOT_DIR/.env" | cut -d= -f2-)

  cat > "$AGENTS_DIR/.dev.vars" << EOF
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
GROQ_API_KEY=${GROQ_API_KEY}
MONGODB_URI=${MONGODB_URI}
AGENT_SERVICE_SECRET=dev-agent-secret-local
MEM0_API_KEY=your-mem0-api-key-here
RESEND_API_KEY=your-resend-api-key-here
EOF

  echo -e "${GREEN}✓ Created .dev.vars${NC}"
  echo -e "${YELLOW}  → Edit $AGENTS_DIR/.dev.vars to add MEM0_API_KEY and RESEND_API_KEY${NC}"
fi

# Also ensure Express knows the agent secret
if ! grep -q "AGENT_SERVICE_SECRET" "$ROOT_DIR/.env"; then
  echo "" >> "$ROOT_DIR/.env"
  echo "AGENT_SERVICE_SECRET=dev-agent-secret-local" >> "$ROOT_DIR/.env"
  echo -e "${GREEN}✓ Added AGENT_SERVICE_SECRET to root .env${NC}"
fi

# ── Install dependencies if needed ───────────────────────────────────────────

if [ ! -d "$ROOT_DIR/node_modules" ]; then
  echo -e "${YELLOW}Installing root dependencies...${NC}"
  (cd "$ROOT_DIR" && npm install)
fi

if [ ! -d "$ROOT_DIR/server/node_modules" ]; then
  echo -e "${YELLOW}Installing server dependencies...${NC}"
  (cd "$ROOT_DIR/server" && npm install)
fi

if [ ! -d "$AGENTS_DIR/node_modules" ]; then
  echo -e "${YELLOW}Installing agents dependencies...${NC}"
  (cd "$AGENTS_DIR" && npm install)
fi

echo -e "${GREEN}✓ Dependencies installed${NC}"

# ── Seed demo data ──────────────────────────────────────────────────────────

echo ""
read -p "Seed demo data? (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${BLUE}Seeding demo data...${NC}"
  (cd "$ROOT_DIR" && node server/scripts/seed-demo-data.js)
  echo -e "${GREEN}✓ Demo data seeded (login: demo@mindmentor.local / demo123)${NC}"
fi

# ── Start services ───────────────────────────────────────────────────────────

echo ""
echo -e "${BLUE}Starting services...${NC}"
echo -e "  ${GREEN}[1]${NC} Express backend  → http://localhost:8000"
echo -e "  ${GREEN}[2]${NC} Agents (wrangler) → http://localhost:8787"
echo -e "  ${GREEN}[3]${NC} Next.js frontend → http://localhost:3000"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Trap to kill all background processes on exit
cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down...${NC}"
  kill $PID_EXPRESS $PID_WRANGLER $PID_NEXT 2>/dev/null
  wait 2>/dev/null
  echo -e "${GREEN}All services stopped.${NC}"
}
trap cleanup EXIT INT TERM

# Start Express backend (has its own package.json, loads root .env)
echo -e "${GREEN}[1] Starting Express...${NC}"
(cd "$ROOT_DIR/server" && node --env-file="$ROOT_DIR/.env" index.js) &
PID_EXPRESS=$!

# Start Wrangler dev (agents)
echo -e "${GREEN}[2] Starting Wrangler...${NC}"
(cd "$AGENTS_DIR" && npx wrangler dev --port 8787) &
PID_WRANGLER=$!

# Give Express and Wrangler a moment
sleep 2

# Start Next.js dev
echo -e "${GREEN}[3] Starting Next.js...${NC}"
(cd "$ROOT_DIR" && npx next dev --port 3000) &
PID_NEXT=$!

# Wait for any process to exit
wait
