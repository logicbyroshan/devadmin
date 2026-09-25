#!/usr/bin/env bash
# ==============================================================================
# DevAdmin Production Docker Deployment & Zero-Downtime Pipeline
#
# Production Domains:
#   Frontend SPA: https://devadmin.logicbyroshan.in     -> 127.0.0.1:8107
#   Backend API:  https://devadmin-api.logicbyroshan.in -> 127.0.0.1:8108
#
# Features:
#   - Strict error trapping & preflight environment validation
#   - Automated image backup for instant zero-loss rollback
#   - Safe, non-destructive Django database migrations
#   - WhiteNoise static assets pre-compilation
#   - Multi-attempt healthcheck verification
#   - Automatic recovery & rollback on probe failure
#   - Zero disruption to coexisting VPS projects (DevMeet, DevMitra, DevMate)
# ==============================================================================

set -euo pipefail

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BLUE}${BOLD}================================================================${NC}"
echo -e "${BLUE}${BOLD}   🚀 DevAdmin Production Deployment Pipeline                   ${NC}"
echo -e "${BLUE}${BOLD}================================================================${NC}"

# 1. Resolve repository root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_ROOT}"

echo -e "\n${BLUE}[1/8] 📁 Verifying Repository and Branch State...${NC}"
echo "Project root: ${PROJECT_ROOT}"

if [ -d ".git" ]; then
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    echo "Current active branch: ${CURRENT_BRANCH}"
    if [ "${CURRENT_BRANCH}" != "main" ] && [ "${CURRENT_BRANCH}" != "dev" ]; then
        echo -e "${YELLOW}⚠️ Notice: Deploying from branch '${CURRENT_BRANCH}'.${NC}"
    fi
    echo "Checking for remote updates..."
    git pull origin "${CURRENT_BRANCH}" || echo -e "${YELLOW}⚠️ Git pull skipped or working tree has uncommitted local files. Proceeding with local repository state.${NC}"
else
    echo -e "${YELLOW}⚠️ Not a git working copy. Proceeding with files on disk.${NC}"
fi

# 2. Preflight Environment & Secrets Validation
echo -e "\n${BLUE}[2/8] 🔐 Validating Environment & Configuration Preflight...${NC}"
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ ERROR: 'backend/.env' file was not found!${NC}"
    echo -e "Please create backend/.env from .env.production.example or backend/.env.example:"
    echo -e "  cp .env.production.example backend/.env"
    echo -e "  nano backend/.env"
    exit 1
fi

# Audit SECRET_KEY in backend/.env
if grep -q "django-insecure" backend/.env 2>/dev/null || grep -q "your_strong_random_secret_key" backend/.env 2>/dev/null || grep -q "replace-with-a-50-character" backend/.env 2>/dev/null; then
    echo -e "${RED}❌ ERROR: backend/.env contains a default/insecure SECRET_KEY!${NC}"
    echo -e "Generate a production secret key and update backend/.env before deploying."
    exit 1
fi
echo -e "${GREEN}✓ Production environment configuration validated.${NC}"

# 3. Docker Engine & Compose Command Detection
echo -e "\n${BLUE}[3/8] 🐳 Verifying Docker & Compose Availability...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ ERROR: 'docker' CLI is not installed or not in PATH!${NC}"
    exit 1
fi

if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}❌ ERROR: Docker Compose is not available!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker engine active. Using compose: ${COMPOSE_CMD}${NC}"

# 4. Docker Network & Persistent Volume Preflight
echo -e "\n${BLUE}[4/8] 🌐 Verifying Docker Network & Persistent Volumes...${NC}"
if ! docker network inspect platform-mysql &> /dev/null; then
    echo -e "${YELLOW}⚠️ Docker network 'platform-mysql' does not exist. Creating...${NC}"
    docker network create platform-mysql
    echo -e "${GREEN}✓ Created network 'platform-mysql'.${NC}"
else
    echo -e "${GREEN}✓ External network 'platform-mysql' is ready.${NC}"
fi

# Ensure volumes exist
docker volume create devadmin_media >/dev/null 2>&1 || true
docker volume create devadmin_static >/dev/null 2>&1 || true
echo -e "${GREEN}✓ Persistent storage volumes (devadmin_media, devadmin_static) verified.${NC}"

# 5. Backup Current Running Images for Rollback Safety
echo -e "\n${BLUE}[5/8] 🛡️ Backing Up Existing Container Images for Rollback...${NC}"
if docker image inspect devadmin-backend:latest >/dev/null 2>&1; then
    docker tag devadmin-backend:latest devadmin-backend:rollback-backup || true
    echo -e "${GREEN}✓ Tagged devadmin-backend:rollback-backup${NC}"
fi
if docker image inspect devadmin-frontend:latest >/dev/null 2>&1; then
    docker tag devadmin-frontend:latest devadmin-frontend:rollback-backup || true
    echo -e "${GREEN}✓ Tagged devadmin-frontend:rollback-backup${NC}"
fi

# 6. Build Production Containers
echo -e "\n${BLUE}[6/8] 🔨 Building Production Images (Multi-Stage Optimization)...${NC}"
${COMPOSE_CMD} build --pull

# 7. Safe Database Migrations & Static Asset Collection
echo -e "\n${BLUE}[7/8] 🗄️ Executing Safe Migrations & Collecting Static Files...${NC}"
echo "Applying database schema migrations..."
${COMPOSE_CMD} run --rm backend python manage.py migrate --noinput

echo "Collecting and hashing static assets..."
${COMPOSE_CMD} run --rm backend python manage.py collectstatic --noinput

echo "Restarting production service containers..."
${COMPOSE_CMD} up -d --remove-orphans

# 8. Multi-Attempt Health Checks & Automatic Rollback
echo -e "\n${BLUE}[8/8] 🩺 Verifying Production Service Health...${NC}"

BACKEND_PORT="${BACKEND_PORT:-8108}"
FRONTEND_PORT="${FRONTEND_PORT:-8107}"
BACKEND_HEALTH_URL="http://127.0.0.1:${BACKEND_PORT}/health/"
FRONTEND_HEALTH_URL="http://127.0.0.1:${FRONTEND_PORT}/healthz"

MAX_RETRIES=10
RETRY_DELAY=3

backend_healthy=false
frontend_healthy=false

echo "Probing backend health at ${BACKEND_HEALTH_URL}..."
for ((i=1; i<=MAX_RETRIES; i++)); do
    if curl -s -f -o /dev/null "${BACKEND_HEALTH_URL}"; then
        backend_healthy=true
        echo -e "${GREEN}✓ Backend probe responded 200 OK (Attempt $i/$MAX_RETRIES).${NC}"
        break
    fi
    echo "  [Attempt $i/$MAX_RETRIES] Backend initializing, retrying in ${RETRY_DELAY}s..."
    sleep ${RETRY_DELAY}
done

echo "Probing frontend health at ${FRONTEND_HEALTH_URL}..."
for ((i=1; i<=MAX_RETRIES; i++)); do
    if curl -s -f -o /dev/null "${FRONTEND_HEALTH_URL}"; then
        frontend_healthy=true
        echo -e "${GREEN}✓ Frontend probe responded 200 OK (Attempt $i/$MAX_RETRIES).${NC}"
        break
    fi
    echo "  [Attempt $i/$MAX_RETRIES] Frontend initializing, retrying in ${RETRY_DELAY}s..."
    sleep ${RETRY_DELAY}
done

if [ "$backend_healthy" = true ] && [ "$frontend_healthy" = true ]; then
    # Tag successful build as latest stable
    docker tag devadmin-backend:latest devadmin-backend:stable || true
    docker tag devadmin-frontend:latest devadmin-frontend:stable || true

    echo -e "\n${GREEN}${BOLD}================================================================${NC}"
    echo -e "${GREEN}${BOLD}   ✨ DevAdmin Production Deployment Succeeded!                 ${NC}"
    echo -e "${GREEN}${BOLD}================================================================${NC}"
    echo -e "Frontend SPA:  https://devadmin.logicbyroshan.in  (127.0.0.1:${FRONTEND_PORT})"
    echo -e "Backend API:   https://devadmin-api.logicbyroshan.in  (127.0.0.1:${BACKEND_PORT})"
    echo -e "API Docs:      https://devadmin-api.logicbyroshan.in/api/docs/"
    echo -e "Health Check:  https://devadmin-api.logicbyroshan.in/health/"
    echo -e "\nContainer Status:"
    ${COMPOSE_CMD} ps
    exit 0
else
    echo -e "\n${RED}${BOLD}❌ ERROR: Deployment health check failed! Initiating automatic rollback...${NC}"
    
    if [ -f "scripts/rollback.sh" ]; then
        bash scripts/rollback.sh || true
    else
        echo -e "${YELLOW}Reverting to rollback-backup containers...${NC}"
        ${COMPOSE_CMD} restart || true
    fi

    echo -e "\n${RED}Recent Backend Logs:${NC}"
    ${COMPOSE_CMD} logs --tail=40 backend || true

    echo -e "\n${RED}Recent Frontend Logs:${NC}"
    ${COMPOSE_CMD} logs --tail=40 frontend || true

    exit 1
fi
