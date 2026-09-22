#!/usr/bin/env bash
# ==============================================================================
# DevAdmin Production Docker Deployment & Zero-Downtime Update Script
#
# Usage:
#   bash scripts/deploy.sh
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}   🚀 Starting DevAdmin Docker Production Deployment Pipeline    ${NC}"
echo -e "${BLUE}================================================================${NC}"

# 1. Resolve project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_ROOT}"

echo -e "\n${BLUE}[1/8] 📁 Verifying Project Directory and Git Status...${NC}"
echo "Current directory: ${PROJECT_ROOT}"

if [ -d ".git" ]; then
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    echo "Active branch: ${CURRENT_BRANCH}"
    echo "Pulling latest changes from remote..."
    git pull origin "${CURRENT_BRANCH}" || echo -e "${YELLOW}⚠️ Git pull failed or working tree has uncommitted local changes. Continuing with local files...${NC}"
else
    echo -e "${YELLOW}⚠️ Not a git repository. Proceeding with existing files.${NC}"
fi

# 2. Check Environment Configuration
echo -e "\n${BLUE}[2/8] 🔐 Validating Environment Configuration...${NC}"
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ ERROR: backend/.env not found!${NC}"
    echo -e "Please create backend/.env from backend/.env.example before deploying:"
    echo -e "  cp backend/.env.example backend/.env"
    echo -e "  nano backend/.env"
    exit 1
fi
echo -e "${GREEN}✓ backend/.env found.${NC}"

# 3. Check Docker & Docker Compose
echo -e "\n${BLUE}[3/8] 🐳 Checking Docker Engine & Compose Availability...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ ERROR: docker command not found! Please install Docker.${NC}"
    exit 1
fi

if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}❌ ERROR: docker compose plugin or docker-compose not found!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Using compose command: ${COMPOSE_CMD}${NC}"

# 4. Validate External Docker Network (platform-mysql)
echo -e "\n${BLUE}[4/8] 🌐 Checking External platform-mysql Network...${NC}"
if ! docker network inspect platform-mysql &> /dev/null; then
    echo -e "${YELLOW}⚠️ Warning: Docker network 'platform-mysql' does not exist yet.${NC}"
    echo "Creating network 'platform-mysql'..."
    docker network create platform-mysql
    echo -e "${GREEN}✓ Created network 'platform-mysql'.${NC}"
else
    echo -e "${GREEN}✓ Network 'platform-mysql' exists.${NC}"
fi

# 5. Build Docker Containers
echo -e "\n${BLUE}[5/8] 🔨 Building DevAdmin Containers (Backend & Frontend)...${NC}"
${COMPOSE_CMD} build --pull

# 6. Run Database Migrations & Static File Collection
echo -e "\n${BLUE}[6/8] 🗄️ Running Django Migrations & Collecting Static Assets...${NC}"
echo "Applying database migrations..."
${COMPOSE_CMD} run --rm backend python manage.py migrate --noinput

echo "Collecting backend static files..."
${COMPOSE_CMD} run --rm backend python manage.py collectstatic --noinput

# 7. Start Services
echo -e "\n${BLUE}[7/8] 🔄 Starting Production Services...${NC}"
${COMPOSE_CMD} up -d --remove-orphans

# 8. Run Health Checks
echo -e "\n${BLUE}[8/8] 🩺 Verifying Service Health...${NC}"
echo "Waiting 5 seconds for services to initialize..."
sleep 5

BACKEND_PORT="${BACKEND_PORT:-8108}"
FRONTEND_PORT="${FRONTEND_PORT:-8107}"

BACKEND_HEALTH_URL="http://127.0.0.1:${BACKEND_PORT}/health/"
FRONTEND_HEALTH_URL="http://127.0.0.1:${FRONTEND_PORT}/healthz"

echo "Probing backend health (${BACKEND_HEALTH_URL})..."
if curl -s -f -o /dev/null "${BACKEND_HEALTH_URL}"; then
    echo -e "${GREEN}✓ Backend service is HEALTHY.${NC}"
else
    echo -e "${YELLOW}⚠️ Warning: Backend health probe did not return 200 immediately. Check logs with: ${COMPOSE_CMD} logs backend${NC}"
fi

echo "Probing frontend health (${FRONTEND_HEALTH_URL})..."
if curl -s -f -o /dev/null "${FRONTEND_HEALTH_URL}"; then
    echo -e "${GREEN}✓ Frontend service is HEALTHY.${NC}"
else
    echo -e "${YELLOW}⚠️ Warning: Frontend health probe did not return 200 immediately. Check logs with: ${COMPOSE_CMD} logs frontend${NC}"
fi

echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}   ✨ DevAdmin Deployment Completed Successfully!               ${NC}"
echo -e "${GREEN}================================================================${NC}"
echo -e "Frontend: https://devadmin.logicbyroshan.in  (127.0.0.1:${FRONTEND_PORT})"
echo -e "Backend:  https://devadmin-api.logicbyroshan.in  (127.0.0.1:${BACKEND_PORT})"
echo -e "\nUseful commands:"
echo -e "  View container status: ${COMPOSE_CMD} ps"
echo -e "  View live logs:        ${COMPOSE_CMD} logs -f"
echo -e "  Restart services:      ${COMPOSE_CMD} restart"
