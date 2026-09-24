#!/usr/bin/env bash
# ==============================================================================
# DevAdmin Production Rollback Script
#
# Usage:
#   bash scripts/rollback.sh
#
# Purpose:
#   Restores previous stable container images and verifies health without
#   destructive database operations.
# ==============================================================================

set -euo pipefail

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${YELLOW}${BOLD}================================================================${NC}"
echo -e "${YELLOW}${BOLD}   ⏪ Starting DevAdmin Automated Rollback Procedure           ${NC}"
echo -e "${YELLOW}${BOLD}================================================================${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_ROOT}"

if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}❌ Docker Compose not found.${NC}"
    exit 1
fi

echo -e "\n${BLUE}[1/4] 🔍 Inspecting Rollback Backup Images...${NC}"

BACKUP_FOUND=false

if docker image inspect devadmin-backend:rollback-backup >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Found devadmin-backend:rollback-backup. Restoring...${NC}"
    docker tag devadmin-backend:rollback-backup devadmin-backend:latest
    BACKUP_FOUND=true
elif docker image inspect devadmin-backend:stable >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Found devadmin-backend:stable. Restoring...${NC}"
    docker tag devadmin-backend:stable devadmin-backend:latest
    BACKUP_FOUND=true
fi

if docker image inspect devadmin-frontend:rollback-backup >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Found devadmin-frontend:rollback-backup. Restoring...${NC}"
    docker tag devadmin-frontend:rollback-backup devadmin-frontend:latest
    BACKUP_FOUND=true
elif docker image inspect devadmin-frontend:stable >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Found devadmin-frontend:stable. Restoring...${NC}"
    docker tag devadmin-frontend:stable devadmin-frontend:latest
    BACKUP_FOUND=true
fi

if [ "$BACKUP_FOUND" = false ]; then
    echo -e "${YELLOW}⚠️ No tagged backup image found. Restarting current services...${NC}"
fi

echo -e "\n${BLUE}[2/4] 🔄 Restarting Application Containers...${NC}"
${COMPOSE_CMD} up -d --remove-orphans

echo -e "\n${BLUE}[3/4] 🩺 Verifying Health Following Rollback...${NC}"
sleep 5

BACKEND_PORT="${BACKEND_PORT:-8108}"
FRONTEND_PORT="${FRONTEND_PORT:-8107}"
BACKEND_HEALTH_URL="http://127.0.0.1:${BACKEND_PORT}/health/"
FRONTEND_HEALTH_URL="http://127.0.0.1:${FRONTEND_PORT}/healthz"

backend_ok=false
frontend_ok=false

if curl -s -f -o /dev/null "${BACKEND_HEALTH_URL}"; then
    backend_ok=true
    echo -e "${GREEN}✓ Backend service restored and healthy.${NC}"
else
    echo -e "${RED}❌ Backend service is still unhealthy.${NC}"
fi

if curl -s -f -o /dev/null "${FRONTEND_HEALTH_URL}"; then
    frontend_ok=true
    echo -e "${GREEN}✓ Frontend service restored and healthy.${NC}"
else
    echo -e "${RED}❌ Frontend service is still unhealthy.${NC}"
fi

echo -e "\n${BLUE}[4/4] 📋 Rollback Status Summary...${NC}"
if [ "$backend_ok" = true ] && [ "$frontend_ok" = true ]; then
    echo -e "${GREEN}${BOLD}================================================================${NC}"
    echo -e "${GREEN}${BOLD}   ✅ Rollback Completed Successfully! Services Operational.   ${NC}"
    echo -e "${GREEN}${BOLD}================================================================${NC}"
    ${COMPOSE_CMD} ps
    exit 0
else
    echo -e "${RED}${BOLD}================================================================${NC}"
    echo -e "${RED}${BOLD}   ⚠️ Warning: Manual inspection needed. Check container logs.  ${NC}"
    echo -e "${RED}${BOLD}================================================================${NC}"
    ${COMPOSE_CMD} logs --tail=50
    exit 1
fi
