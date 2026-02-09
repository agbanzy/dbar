#!/bin/bash
set -e

echo "=========================================="
echo "  DigiBar - Build & Deploy to Firebase"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check prerequisites
check_prereqs() {
  echo "Checking prerequisites..."

  if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js not found. Install Node.js 20+${NC}"
    exit 1
  fi

  if ! command -v firebase &> /dev/null; then
    echo -e "${RED}Error: Firebase CLI not found. Run: npm install -g firebase-tools${NC}"
    exit 1
  fi

  if ! firebase projects:list &> /dev/null; then
    echo -e "${RED}Error: Not logged in to Firebase. Run: firebase login${NC}"
    exit 1
  fi

  echo -e "${GREEN}All prerequisites met.${NC}"
  echo ""
}

# Build backend
build_backend() {
  echo -e "${YELLOW}[1/4] Building backend...${NC}"
  cd backend
  npm install
  npm run build
  cd ..
  echo -e "${GREEN}Backend built successfully.${NC}"
  echo ""
}

# Build frontend
build_frontend() {
  echo -e "${YELLOW}[2/4] Building frontend...${NC}"
  cd frontend

  # Clean previous build
  rm -rf .next out

  # Install dependencies
  npm install

  # Temporarily switch to standalone mode for build (handles dynamic routes)
  cat > next.config.mjs.build << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: { unoptimized: true },
};
export default nextConfig;
EOF

  # Back up original config
  cp next.config.mjs next.config.mjs.bak
  cp next.config.mjs.build next.config.mjs

  # Build
  NEXT_PUBLIC_API_URL="https://us-central1-digi-bar-1a9e1.cloudfunctions.net/api" \
  NEXT_TELEMETRY_DISABLED=1 \
  npx next build

  # Create static export from the standalone build
  echo "Extracting static files..."
  mkdir -p out

  # Copy static assets
  cp -r .next/static out/_next/static 2>/dev/null || true

  # Copy HTML pages from server output
  find .next/server/app -name '*.html' | while read file; do
    # Convert .next/server/app/path/to/page.html -> out/path/to/index.html
    relative="${file#.next/server/app/}"
    dir="out/$(dirname "$relative")"
    mkdir -p "$dir"
    cp "$file" "$dir/index.html" 2>/dev/null || cp "$file" "$dir/" 2>/dev/null || true
  done

  # Copy the root page
  if [ -f .next/server/app/index.html ]; then
    cp .next/server/app/index.html out/index.html
  fi

  # Copy public assets
  cp -r public/* out/ 2>/dev/null || true

  # Restore original config
  mv next.config.mjs.bak next.config.mjs
  rm -f next.config.mjs.build

  cd ..
  echo -e "${GREEN}Frontend built successfully.${NC}"
  echo ""
}

# Deploy to Firebase
deploy() {
  echo -e "${YELLOW}[3/4] Deploying to Firebase...${NC}"

  # Deploy Firestore rules, Storage rules, Functions, and Hosting
  firebase deploy --project digi-bar-1a9e1

  echo -e "${GREEN}Deployment complete!${NC}"
  echo ""
}

# Print summary
print_summary() {
  echo -e "${YELLOW}[4/4] Deployment Summary${NC}"
  echo "=========================================="
  echo -e "Frontend:  ${GREEN}https://digi-bar-1a9e1.web.app${NC}"
  echo -e "API:       ${GREEN}https://us-central1-digi-bar-1a9e1.cloudfunctions.net/api${NC}"
  echo -e "Console:   ${GREEN}https://console.firebase.google.com/project/digi-bar-1a9e1${NC}"
  echo "=========================================="
  echo ""
  echo "Post-deploy checklist:"
  echo "  1. Set backend/.env JWT_SECRET to a strong random string"
  echo "  2. Verify API health: curl https://us-central1-digi-bar-1a9e1.cloudfunctions.net/api/health"
  echo "  3. Test login flow at https://digi-bar-1a9e1.web.app/login"
  echo "  4. Run seed script if needed: cd backend && npm run seed"
}

# Main
check_prereqs
build_backend
build_frontend
deploy
print_summary
