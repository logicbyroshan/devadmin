# DevAdmin Production Docker Deployment Guide

A complete, production-grade guide for deploying the **DevAdmin Multi-Site Portfolio Administration Platform** on a Linux VPS using **Docker Compose**, **Django 5 / Gunicorn**, **React 18 / Vite / Nginx**, **MySQL 8.0 (platform-mysql)**, and **Cloudflare**.

---

## 🏗️ Production Architecture

DevAdmin runs as two lightweight containerized services behind host Nginx reverse proxy and Cloudflare TLS termination.

```
                           INTERNET (HTTPS)
                                  │
                          CLOUDFLARE / DNS
                                  │
             ┌────────────────────┴────────────────────┐
             │                                         │
             ▼                                         ▼
https://devadmin.logicbyroshan.in         https://devadmin-api.logicbyroshan.in
             │                                         │
             │ (SSL Terminated)                        │ (SSL Terminated)
             ▼                                         ▼
    Host Nginx Server                         Host Nginx Server
 (reverse proxy to 8107)                   (reverse proxy to 8108)
             │                                         │
             ▼                                         ▼
    127.0.0.1:8107                            127.0.0.1:8108
             │                                         │
             ▼                                         ▼
┌─────────────────────────┐               ┌─────────────────────────┐
│    devadmin-frontend    │               │    devadmin-backend     │
│   (Nginx Alpine SPA)    │               │  (Django 5.0 Gunicorn)  │
│  React 18 + Vite static │               │  Python 3.12-slim WSGI  │
│  Non-root / Lightweight │               │  Non-root appuser (1000)│
└────────────┬────────────┘               └────────────┬────────────┘
             │                                         │
             └─────────── devadmin-internal ───────────┘
                                                       │
                                                       ▼ (Docker external network)
                                              ┌─────────────────┐
                                              │ platform-mysql  │
                                              │  Port 3306      │
                                              │  (devadmin_db)  │
                                              └─────────────────┘
```

### Domain Architecture
- **Frontend SPA**: `https://devadmin.logicbyroshan.in` (points to `devadmin-frontend:80` via localhost `8107`)
- **Backend REST API**: `https://devadmin-api.logicbyroshan.in` (points to `devadmin-backend:8000` via localhost `8108`)
- **Interactive OpenAPI Documentation**: `https://devadmin-api.logicbyroshan.in/api/docs/`
- **Django Admin Interface**: `https://devadmin-api.logicbyroshan.in/admin/`
- **Health Diagnostics Endpoint**: `https://devadmin-api.logicbyroshan.in/health/`

---

## 📋 Prerequisites

1. **Host Operating System**: Ubuntu 22.04 LTS / 24.04 LTS or Debian 12.
2. **Docker Engine & Compose Plugin**: Docker 24.0+ with `docker compose`.
3. **Host Nginx**: Installed on the VPS to handle reverse proxying to localhost ports.
4. **Cloudflare**: DNS records created for both subdomains:
   - `devadmin.logicbyroshan.in` -> A record pointing to VPS IP (Proxied / Orange Cloud enabled)
   - `devadmin-api.logicbyroshan.in` -> A record pointing to VPS IP (Proxied / Orange Cloud enabled)
5. **Existing MySQL**: MySQL container running on external Docker network `platform-mysql`.

---

## 🗄️ Step 1: Database Provisioning (Server Step)

DevAdmin connects to the shared platform MySQL container named `platform-mysql`.

Connect to MySQL on the host:
```bash
docker exec -it platform-mysql mysql -u root -p
```

Create the database and grant least-privilege permissions:
```sql
CREATE DATABASE IF NOT EXISTS devadmin_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'devadmin_user'@'%' IDENTIFIED BY 'YOUR_STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON devadmin_db.* TO 'devadmin_user'@'%';
FLUSH PRIVILEGES;
EXIT;
```

> [!IMPORTANT]
> The database host is `platform-mysql` (the container name on the shared Docker bridge network `platform-mysql`). DevAdmin's database user only has privileges on `devadmin_db.*`, ensuring complete tenant isolation from DevMeet, DevMitra, and DevMate.

---

## 📦 Step 2: Code Checkout & Directory Setup

Clone the repository into the standard application directory on the VPS:

```bash
sudo mkdir -p /var/www/devadmin
sudo chown -R $USER:$USER /var/www/devadmin
git clone https://github.com/logicbyroshan/devadmin-portfolio.git /var/www/devadmin
cd /var/www/devadmin
```

---

## 🔐 Step 3: Environment Configuration

Create `backend/.env` from the production template:

```bash
cp .env.production.example backend/.env
nano backend/.env
```

Generate a secure secret key:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Fill in your production secrets:

```env
# Host Port Configuration
FRONTEND_PORT=8107
BACKEND_PORT=8108
VITE_API_BASE_URL=https://devadmin-api.logicbyroshan.in

# Core Django Settings
DEBUG=False
SECRET_KEY=paste_your_generated_50_character_secret_key_here
ALLOWED_HOSTS=devadmin-api.logicbyroshan.in,devadmin.logicbyroshan.in,localhost,127.0.0.1,devadmin-backend,backend

# Database Settings (Connected to platform-mysql container)
USE_MYSQL=True
DB_HOST=platform-mysql
DB_NAME=devadmin_db
DB_USER=devadmin_user
DB_PASSWORD=YOUR_STRONG_PASSWORD_HERE
DB_PORT=3306
DB_CONN_MAX_AGE=60

# CORS & CSRF Settings
CORS_ALLOWED_ORIGINS=https://devadmin.logicbyroshan.in
CSRF_TRUSTED_ORIGINS=https://devadmin.logicbyroshan.in,https://devadmin-api.logicbyroshan.in

# HTTPS / Security Settings
SECURE_SSL_REDIRECT=False
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True

# Concurrency (Lightweight VPS: 2 workers recommended)
WEB_CONCURRENCY=2

# SMTP (Optional)
USE_REAL_SMTP=False
```

---

## 🌐 Step 4: Host Nginx Configuration

Copy the provided Nginx configuration to your system Nginx directory:

```bash
sudo cp scripts/nginx.conf /etc/nginx/sites-available/devadmin.conf
sudo ln -sf /etc/nginx/sites-available/devadmin.conf /etc/nginx/sites-enabled/devadmin.conf
sudo nginx -t
sudo systemctl reload nginx
```

### Free SSL with Certbot (Let's Encrypt)
If SSL is terminated on the host Nginx directly (or alongside Cloudflare Full/Strict SSL):

```bash
sudo certbot --nginx -d devadmin.logicbyroshan.in -d devadmin-api.logicbyroshan.in
```

---

## 🚀 Step 5: Production Deployment Pipeline

Deploy the entire stack with a single command:

```bash
bash scripts/deploy.sh
```

The script automatically:
1. Validates Git branch and pulls latest code.
2. Performs strict preflight checks on `backend/.env` (ensures `SECRET_KEY` is not default).
3. Ensures Docker and the external `platform-mysql` network exist.
4. Backs up running images to `:rollback-backup` for zero-loss recovery.
5. Builds optimized multi-stage container images (`docker compose build --pull`).
6. Runs non-destructive Django migrations (`python manage.py migrate --noinput`).
7. Collects and hashes static assets for WhiteNoise (`python manage.py collectstatic --noinput`).
8. Starts services (`docker compose up -d --remove-orphans`).
9. Executes multi-attempt health checks against backend (`/health/`) and frontend (`/healthz`).
10. Automatically triggers `scripts/rollback.sh` if any health check fails.

---

## 👤 Step 6: Initial Superuser Setup (First Time Only)

Create an initial administrator account for the DevAdmin portal:

```bash
docker compose run --rm backend python manage.py createsuperuser
```

Enter your admin username, email, and password.

---

## 🔄 Routine Update Procedure

Whenever new features or bug fixes are committed:

```bash
cd /var/www/devadmin
bash scripts/deploy.sh
```

Zero downtime update with automated migration, static asset hashing, and health verification.

---

## 🩺 Health Checks & Verification

| Target | Probe URL / Command | Expected Output |
|---|---|---|
| **Backend REST API Health** | `curl -f http://127.0.0.1:8108/health/` | `{"status":"healthy","database":{"status":"healthy"}}` |
| **Frontend Health** | `curl -f http://127.0.0.1:8107/healthz` | `healthy` |
| **Public Frontend** | `https://devadmin.logicbyroshan.in` | HTTP 200 (React App) |
| **Public API Root** | `https://devadmin-api.logicbyroshan.in/api/` | HTTP 200 (API Schema overview) |
| **Swagger UI** | `https://devadmin-api.logicbyroshan.in/api/docs/` | Interactive Swagger interface |
| **Container Status** | `docker compose ps` | Both containers `Up (healthy)` |

---

## 🪵 Viewing Logs & Resource Monitoring

```bash
# Stream all logs
docker compose logs -f

# Stream backend Django/Gunicorn logs only
docker compose logs -f backend

# Stream frontend Nginx access logs only
docker compose logs -f frontend

# Check container resource utilization
docker stats devadmin-backend devadmin-frontend
```

---

## 🛡️ Backup & Rollback Strategy

### 1. Database Backup Before Major Migrations
```bash
docker exec platform-mysql mysqldump -u root -p devadmin_db > /backup/devadmin_db_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Manual Rollback Procedure
If a deployment fails or unexpected errors occur in production:
```bash
bash scripts/rollback.sh
```

The rollback script will:
- Restore previously tagged backup images (`devadmin-backend:rollback-backup` / `:stable`).
- Restart container services.
- Verify health checks on restored containers.
- Safely preserve database state without dropping tables or resetting migrations.

---

## 🔧 Troubleshooting & Common Issues

### 1. Backend Cannot Connect to MySQL
1. Verify `platform-mysql` network exists:
   ```bash
   docker network ls | grep platform-mysql
   ```
2. Verify both `devadmin-backend` and `platform-mysql` containers are attached:
   ```bash
   docker network inspect platform-mysql
   ```
3. Test connectivity from inside backend container:
   ```bash
   docker compose run --rm backend python -c "import django; django.setup(); from django.db import connection; connection.cursor(); print('DB Connected!')"
   ```

### 2. 403 CSRF Verification Failed
Ensure `CSRF_TRUSTED_ORIGINS` in `backend/.env` contains `https://devadmin.logicbyroshan.in` and `https://devadmin-api.logicbyroshan.in`.
Ensure Host Nginx sets `proxy_set_header X-Forwarded-Proto $scheme;`.

### 3. Coexistence With Other Projects
DevAdmin is isolated on `devadmin-internal` and connects to `platform-mysql` via external bridge.
Deploying DevAdmin will not restart, rebuild, or affect:
- DevMeet
- DevMitra
- DevMate
