#!/bin/bash

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Verifying Picture Curation API Setup..."
echo ""

# Check Node.js
echo -n "✓ Checking Node.js... "
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  echo -e "${GREEN}$NODE_VERSION${NC}"
else
  echo -e "${RED}Not installed${NC}"
  exit 1
fi

# Check npm
echo -n "✓ Checking npm... "
if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm --version)
  echo -e "${GREEN}v$NPM_VERSION${NC}"
else
  echo -e "${RED}Not installed${NC}"
  exit 1
fi

# Check directory structure
echo -n "✓ Checking project directory... "
if [ -d "." ] && [ -f "package.json" ] && [ -f "server.js" ]; then
  echo -e "${GREEN}Found${NC}"
else
  echo -e "${RED}Invalid directory${NC}"
  exit 1
fi

# Check node_modules
echo -n "✓ Checking node_modules... "
if [ -d "node_modules" ]; then
  echo -e "${GREEN}Installed${NC}"
else
  echo -e "${YELLOW}Not installed - running npm install...${NC}"
  npm install
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}npm install successful${NC}"
  else
    echo -e "${RED}npm install failed${NC}"
    exit 1
  fi
fi

# Check .env file
echo -n "✓ Checking .env file... "
if [ -f ".env" ]; then
  echo -e "${GREEN}Found${NC}"
else
  echo -e "${YELLOW}Not found - creating from .env.example${NC}"
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo -e "${GREEN}Created .env${NC}"
  else
    echo -e "${RED}.env.example not found${NC}"
  fi
fi

# Check data directories
echo -n "✓ Checking data directories... "
if [ -d "data" ] && [ -d "data/uploads" ]; then
  echo -e "${GREEN}Created${NC}"
else
  echo -e "${YELLOW}Creating directories...${NC}"
  mkdir -p data/uploads
  echo -e "${GREEN}Created${NC}"
fi

# Check JSON files
echo -n "✓ Checking data files... "
if [ -f "data/photos.json" ] && [ -f "data/variations.json" ] && [ -f "data/approvals.json" ]; then
  echo -e "${GREEN}Found${NC}"
else
  echo -e "${YELLOW}Creating data files...${NC}"
  echo "[]" > data/photos.json
  echo "[]" > data/variations.json
  echo "[]" > data/approvals.json
  echo -e "${GREEN}Created${NC}"
fi

echo ""
echo "✅ Setup verification complete!"
echo ""
echo "To start the server, run:"
echo -e "${GREEN}npm start${NC}"
echo ""
echo "To test the API, run:"
echo -e "${GREEN}curl http://localhost:4000/api/health${NC}"
echo ""
echo "For more info, see:"
echo "  - QUICK_START.md (quick overview)"
echo "  - README.md (full documentation)"
echo "  - FRONTEND_INTEGRATION.md (how to connect frontend)"
echo "  - TEST_EXAMPLES.md (API testing examples)"
