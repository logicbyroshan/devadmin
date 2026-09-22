# DevAdmin - Multi-Site Portfolio Management Platform & REST API

<div align="center">

![DevAdmin Banner](https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80)

**An ultra-modern, enterprise-grade multi-tenant portfolio management system and REST API.**  
*Built with React 18, Vite, Tailwind CSS, Lucide Icons, Django 5.x REST Framework, SimpleJWT, MySQL / SQLite, and OpenAPI 3.0 / Swagger UI.*

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React 18](https://img.shields.io/badge/React-18.3-61dafb.svg?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![Django](https://img.shields.io/badge/Django-5.2-092e20.svg?logo=django)](https://www.djangoproject.com/)
[![DRF](https://img.shields.io/badge/Django%20REST-3.16-red.svg)](https://www.django-rest-framework.org/)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.0-85ea2d.svg?logo=openapi-initiative)](http://localhost:8000/api/docs/)

[Features](#-key-features) • [Architecture](#-architecture) • [API Documentation](#-interactive-api-docs) • [Quick Start](#-quick-start) • [Direct Server Deployment](#-direct-server-production-deployment-no-docker) • [Directory Structure](#-repository-structure)

</div>

---

## 🌟 Key Features

### 1. 🏢 Multi-Tenant Site Partitioning
- Manage multiple independent developer portfolio websites from a single unified control console.
- Pre-configured sites: **DevMeet** (WebRTC Video Suite), **DevMitra** (AI Peer Pairing), and **DevMate** (Cloud IDE Sandbox).
- Instant multi-site switching from the top navbar with synchronized tenant-scoped API queries (`?website=slug` or integer ID).

### 2. 🎴 3-Card Responsive Grid Layouts
- Uniform, high-density **3-card grids** (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) across all modules:
  - **Projects Showcase**
  - **Technical Blogs**
  - **Career Experience Milestones**
  - **Technical Skills & Stack**
  - **Frequently Asked Questions (FAQs)**
- Category filter pills, one-click visibility toggles, and direct Edit/Delete card actions.

### 3. 📅 Custom OLED Dark Glassmorphic DatePicker (`CustomDatePicker.jsx`)
- Built-in, fully customizable calendar picker replacing browser native date inputs.
- Month and year navigation with previous/next month day padding.
- Theme accent gradients matching active portfolio site (`blue`, `sky`, `violet`).
- Today quick-select action, clear button, and click-outside dismissal.

### 4. ✍️ Ultra-Rich Content & System Architecture Builder (`RichContentBuilder`)
- Integrated into Projects, Technical Blogs, and Profile Bio.
- **Write**, **Split (Side-by-Side Editor & Live Preview)**, and **Preview** modes.
- Visual custom widgets:
  - 🏛️ **System Architecture Topologies** (` ```architecture `)
  - ⚡ **Performance Benchmark Bar Charts** (` ```chart:barchart `)
  - 📈 **Latency & Throughput Line Graphs** (` ```chart:linegraph `)
  - 📡 **REST API Specification Tables**
  - 🎬 **Video Walkthrough Embeds** (` ```video:embed `)
  - 💡 **Alert Callout Blocks** (`> [!NOTE]`, `> [!TIP]`, `> [!WARNING]`)

### 5. 📊 12-Month Contribution Activity Heatmap
- Full 365-day annual commit and deployment activity matrix (January through December).
- 4-level color-coded contribution intensity legend.

### 6. 📬 Authenticated SMTP Email Reply Console
- Split 2-column contact inquiry feed and direct email composer.
- Dispatch live email replies via authenticated SMTP relay with timestamp tracking (`replied_at`, `is_read=True`).
- Quick canned reply suggestions (*"Available for work"*, *"Schedule Call"*).

### 7. 🔐 Full JWT Authentication & Security Console
- Dark glassmorphic **Security Console Modal** (`AuthModal.jsx`).
- Secure JWT token pair generation (`/api/auth/token/`), automatic token refresh (`/api/auth/token/refresh/`), and persistent session state.
- Change password endpoint (`/api/auth/change-password/`) with Django password validator enforcement.
- Administrator registration (`/api/auth/register/`) and one-click quick demo login.

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         React 18 Frontend SPA                               │
│       Vite │ Tailwind CSS │ Lucide Icons │ CustomDatePicker │ AuthContext   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ REST API (JSON / JWT Bearer)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 Django REST Framework Ingress & API Layer                   │
│         drf-spectacular (OpenAPI 3.0 / Swagger UI) │ SimpleJWT │ CORS       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Reusable Service Layer (DRY Pattern)                    │
│  ┌─────────────────────────┐  ┌───────────────────────┐  ┌───────────────┐  │
│  │ MultiTenantQueryService │  │  NotificationService  │  │AnalyticsServic│  │
│  │ - ?website=slug scoping │  │  - SMTP Email Relay   │  │- Single-pass  │  │
│  │ - Category/Status filter│  │  - Auto-Read & Reply  │  │  aggregations │  │
│  │ - Visibility Toggling   │  │  - Delivery Logging   │  │- Heatmap Gen  │  │
│  └─────────────────────────┘  └───────────────────────┘  └───────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│         Database Layer (MySQL 8.0 / SQLite Dual Mode with B-Tree Indexes)   │
│  - idx_proj_site_status / idx_proj_site_cat / idx_proj_site_vis             │
│  - idx_blog_site_status / idx_blog_site_cat / idx_blog_site_vis             │
│  - idx_exp_site_status / idx_exp_site_cat / idx_exp_site_vis                │
│  - idx_msg_site_read / idx_msg_site_tag / idx_msg_site_starred              │
│  - idx_faq_site_cat / idx_faq_site_vis                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📖 Interactive API Docs

When running the backend server locally or in production, interactive documentation is available out of the box:

- **Swagger UI**: [`http://localhost:8000/api/docs/`](http://localhost:8000/api/docs/)
- **ReDoc**: [`http://localhost:8000/api/redoc/`](http://localhost:8000/api/redoc/)
- **OpenAPI Schema (JSON/YAML)**: [`http://localhost:8000/api/schema/`](http://localhost:8000/api/schema/)
- **Health Check Probe**: [`http://localhost:8000/api/health/`](http://localhost:8000/api/health/)
- **Technical Specification Guide**: [backend/API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md)

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js** 18+ or 20+ LTS
- **Python** 3.10+ or 3.11+
- **Git**

---

### 2. Backend Setup (Django REST Framework)

```bash
cd backend

# 1. Create and activate Python virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run database migrations
python manage.py migrate

# 4. Seed database with realistic multi-site portfolio data
python manage.py seed_data

# 5. Run automated test suite
python manage.py test tests

# 6. Start development server (Port 8000)
python manage.py runserver
```

> **Backend API is now live at:** `http://localhost:8000/api/`  
> **Swagger UI:** `http://localhost:8000/api/docs/`

---

### 3. Frontend Setup (React + Vite)

In a new terminal window:

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start Vite development server (Port 3000)
npm run dev
```

> **DevAdmin Dashboard is now live at:** `http://localhost:3000/`

---

## 🚀 Production Deployment (Docker Compose)

DevAdmin is engineered for high-performance containerized deployment on Linux VPS servers using **Docker Compose**, **Django 5 / Gunicorn**, **React 18 / Vite / Nginx**, and **MySQL 8.0 (platform-mysql)**:

- **Frontend SPA**: `https://devadmin.logicbyroshan.in` (Nginx container on localhost port 8107)
- **Backend API**: `https://devadmin-api.logicbyroshan.in` (Gunicorn container on localhost port 8108)
- **Automated Zero-Downtime Deployment**: Run `bash scripts/deploy.sh` to pull changes, run migrations, collect static assets, and healthcheck services.

👉 **See the complete step-by-step production setup guide in [DEPLOYMENT.md](DEPLOYMENT.md).**

---

## 📁 Repository Structure

```
DevAdmin/
├── backend/
│   ├── apps/                   # Reusable Service Layer (Tenant, Mail, Stats, Mixins, Health)
│   ├── devadmin_backend/       # Root Django settings, WSGI, ASGI, and URLs
│   ├── tests/                  # Automated integration test suite
│   ├── Dockerfile              # Production Python 3.12-slim container definition
│   ├── requirements.txt        # Frozen Python dependencies
│   ├── .env.example            # Backend environment template
│   └── manage.py
├── frontend/
│   ├── src/                    # React views, components, and API client
│   ├── Dockerfile              # Multi-stage build (Node 20 -> Nginx Alpine)
│   ├── nginx.conf              # Container-level SPA Nginx configuration
│   ├── package.json
│   ├── .env.example            # Frontend environment template
│   └── vite.config.js
├── scripts/
│   ├── deploy.sh               # One-click Docker production deployment script
│   ├── nginx.conf              # Host Nginx reverse proxy configuration (two subdomains)
│   └── devadmin.service        # Legacy systemd daemon configuration (Deprecated)
├── docker-compose.yml          # Primary multi-container production configuration
├── DEPLOYMENT.md               # Step-by-step VPS production deployment manual
└── README.md                   # Project documentation
```

---

## 📄 License

This project is licensed under the **MIT License**.
