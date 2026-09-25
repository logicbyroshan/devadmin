"""
Seed rich DevMate portfolio data matching API.md and ADMIN_API.md specifications.
"""
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'devadmin_backend.settings')
import django
django.setup()

from apps.websites.models import Website
from apps.profiles.models import PortfolioProfile
from apps.categories.models import Category
from apps.projects.models import Project, ProjectScreenshot
from apps.experiences.models import Experience, ExperienceImage
from apps.skills.models import Skill
from apps.achievements.models import Achievement
from apps.contacts.models import ContactInquiry
from apps.faqs.models import Faq

print("Starting DevMate data seed...")

# 1. Website
devmate, _ = Website.objects.get_or_create(
    slug='dev-mate',
    defaults={
        'name': 'DevMate',
        'badge': 'DevMate',
        'tag': 'In-Browser Cloud Sandbox & Code IDE',
        'primary_color': 'violet',
        'is_active': True,
    }
)
devmate.name = 'DevMate'
devmate.badge = 'DevMate'
devmate.tag = 'In-Browser Cloud Sandbox & Code IDE'
devmate.save()

# 2. Portfolio Profile & Hero Settings
profile, _ = PortfolioProfile.objects.get_or_create(website=devmate)
profile.full_name = "Roshan Damor"
profile.title = "Software Engineer · Full Stack AI"
profile.email = "mail@logicbyroshan.in"
profile.phone = "+91 90000 00000"
profile.location = "Bhopal, Madhya Pradesh, India"
profile.bio = "Software Engineer specializing in scalable full-stack web applications, distributed systems, and AI workflows."
profile.profile_image = "/media/profile/hero.webp"
profile.hero_image = "/media/hero/custom_hero.webp"
profile.hero_badge = "Hello, I am"
profile.hero_description = "I build production software and AI-powered applications, from backend systems and SaaS platforms to LLM-powered workflows and intelligent developer tools."
profile.hero_stat_1_value = "1,000+"
profile.hero_stat_1_label = "Production Users"
profile.hero_stat_1_icon = "fas fa-users"
profile.hero_stat_2_value = "136K+"
profile.hero_stat_2_label = "ID Cards Processed"
profile.hero_stat_2_icon = "fas fa-id-card"
profile.hero_stat_3_value = "86K+"
profile.hero_stat_3_label = "Cards Downloaded"
profile.hero_stat_3_icon = "fas fa-cloud-download-alt"
profile.github = "https://github.com/logicbyroshan"
profile.linkedin = "https://linkedin.com/in/logicbyroshan"
profile.twitter = "https://twitter.com/logicbyroshan"
profile.youtube = "https://youtube.com/@logicbyroshan"
profile.website_url = "https://logicbyroshan.in"
profile.resume = "/media/documents/Roshan_Damor_Resume.pdf"
profile.status = "available"
profile.work_type = "remote"
profile.hourly_rate = "45.00"
profile.experience_years = "3"
profile.open_to_opportunities = True
profile.available_for_freelance = True
profile.avatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"
profile.save()
print("Profile & Hero settings configured.")

# 3. Categories Taxonomy
categories_data = [
    {"name": "Enterprise SaaS", "category_type": "project", "slug": "enterprise-saas", "icon": "fas fa-briefcase", "color": "#38bdf8", "description": "Multi-tenant cloud applications and high-throughput transaction systems."},
    {"name": "AI & Developer Tools", "category_type": "project", "slug": "ai-developer-tools", "icon": "fas fa-robot", "color": "#a855f7", "description": "LLM integrations, agentic workflows, and code execution sandboxes."},
    {"name": "Systems & Cloud", "category_type": "project", "slug": "systems-cloud", "icon": "fas fa-server", "color": "#10b981", "description": "Microservices, Celery workers, and high-concurrency relays."},
    {"name": "Frontend Engineering", "category_type": "skill", "slug": "frontend-engineering", "icon": "fab fa-react", "color": "#61dafb", "description": "React, Next.js, Vite, TypeScript, and TailwindCSS."},
    {"name": "Backend & Cloud", "category_type": "skill", "slug": "backend-cloud", "icon": "fab fa-python", "color": "#306998", "description": "Python, Django, FastAPI, Node.js, Redis, and Docker."},
    {"name": "Architecture & Distributed Systems", "category_type": "blog", "slug": "architecture-distributed-systems", "icon": "fas fa-network-wired", "color": "#f59e0b", "description": "Engineering-first guides to scalable decoupled architectures."},
]

for cat in categories_data:
    Category.objects.update_or_create(slug=cat['slug'], defaults=cat)
print("Categories seeded.")

# 4. Projects with rich Case Study Documentation & Screenshots
projects_data = [
    {
        "title": "CardFlow Enterprise ID Automation Engine",
        "project_name": "CardFlow",
        "slug": "cardflow",
        "category": "Enterprise SaaS",
        "description": "High-throughput asynchronous ID card generation platform processing 136K+ cards with Celery and Redis.",
        "documentation": """# CardFlow Technical Case Study & Architecture Overview

CardFlow is an enterprise-grade ID card rendering and batch processing pipeline engineered for high concurrency and zero-loss print queues.

## 🏛️ System Architecture Topology

```architecture:microservices
title: CardFlow Distributed Print & Rendering Pipeline
nodes:
  - [Client Dashboard (React)] -> [Nginx Reverse Proxy & Load Balancer]
  - [Nginx Reverse Proxy] -> [Django REST Framework Gateway]
  - [DRF Gateway] -> [Redis Celery Task Broker]
  - [Redis Broker] -> [Celery Worker Cluster (SVG/PDF Renderer)]
  - [Celery Workers] -> [AWS S3 / Local Media Engine]
  - [Celery Workers] -> [PostgreSQL Transaction Ledger]
```

## ⚡ Performance Benchmarks

| Metric | Legacy Node Pipeline | CardFlow Celery Cluster | Improvement |
| :--- | :--- | :--- | :--- |
| **Throughput (Cards/sec)** | 12 cards/sec | 145 cards/sec | **+1108%** |
| **Memory per Worker** | 480 MB | 85 MB | **-82%** |
| **PDF Generation Jitter** | 240 ms | 18 ms | **-92.5%** |

## 🔑 Key Engineering Innovations
1. **Asynchronous Vector Pre-Rasterization**: Pre-caching SVG assets in Redis memory for instantaneous composite stamping.
2. **Atomic Batch Ledger**: Zero orphan records with PostgreSQL row-level locks on multi-tenant batch generation.
""",
        "technologies": "Python, Django, Celery, Redis, React, PostgreSQL, Docker",
        "status": "active",
        "completed_date": "2025-06-15",
        "image": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80",
        "demo_url": "https://cardflow.logicbyroshan.in",
        "live_url": "https://cardflow.logicbyroshan.in",
        "github_url": "https://github.com/logicbyroshan/cardflow",
        "visible": True,
        "is_active": True,
        "featured": True,
        "is_featured": True,
        "views": 2540,
        "likes": 189,
        "order": 0,
        "screenshots": [
            {"image": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80", "caption": "CardFlow Multi-Tenant Generation Matrix", "order": 0},
            {"image": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80", "caption": "Real-time Celery Job Queue Monitor", "order": 1}
        ]
    },
    {
        "title": "DevMate In-Browser Sandbox IDE",
        "project_name": "DevMate IDE",
        "slug": "devmate-ide",
        "category": "AI & Developer Tools",
        "description": "In-browser cloud compilation sandbox supporting Python, Node.js, and Go microservices with live preview.",
        "documentation": """# DevMate Cloud Code Execution Engine

DevMate is an isolated sandbox environment designed for sub-second code compilation, collaborative debugging, and interactive architectural diagrams.

## 🏛️ Isolated Container Sandbox Lifecycle

```architecture:microservices
title: WebAssembly & Containerized Execution Flow
nodes:
  - [Monaco Editor Instance] -> [WebSocket Session Stream]
  - [Session Stream] -> [Pyodide / WebAssembly Engine]
  - [Session Stream] -> [Remote Docker Runner API]
  - [Docker Runner] -> [Pty Stream & Terminal Output]
```

## 🚀 Highlights
- **Sub-100ms Code Execution**: Instant evaluation of Python scripts and microservice endpoints.
- **Rich Architecture Diagrams**: Embedded D2, Mermaid, and interactive benchmark visualizations.
""",
        "technologies": "React, TypeScript, WebAssembly, Python, Docker, TailwindCSS",
        "status": "active",
        "completed_date": "2025-07-20",
        "image": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80",
        "demo_url": "https://devmate.logicbyroshan.in",
        "live_url": "https://devmate.logicbyroshan.in",
        "github_url": "https://github.com/logicbyroshan/devmate",
        "visible": True,
        "is_active": True,
        "featured": True,
        "is_featured": True,
        "views": 1840,
        "likes": 142,
        "order": 1,
        "screenshots": [
            {"image": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80", "caption": "DevMate In-Browser IDE Workspace", "order": 0}
        ]
    }
]

for pdata in projects_data:
    screenshots = pdata.pop("screenshots", [])
    proj, _ = Project.objects.update_or_create(
        slug=pdata['slug'],
        website=devmate,
        defaults=pdata
    )
    # Clear & re-seed screenshots
    proj.screenshots.all().delete()
    for sdata in screenshots:
        ProjectScreenshot.objects.create(project=proj, **sdata)

print("Projects and screenshots seeded.")

# 5. Work Experience
experiences_data = [
    {
        "role": "Software Engineer",
        "company": "Adarsh ID Cards",
        "category": "Enterprise SaaS",
        "employment_type": "full-time",
        "location": "Bhopal, MP, India",
        "company_website": "https://adarshidcards.in",
        "start_date": "2024-06-01",
        "period": "2024 - Present",
        "is_current": True,
        "status": "CURRENT",
        "short_description": "Leading architecture for CardFlow processing 136K+ ID cards with Celery and Redis.",
        "description": "Architected distributed task queues, optimized Django REST APIs, and built high-performance vector rendering pipelines.",
        "visible": True,
        "is_active": True,
        "order": 0
    }
]

for edata in experiences_data:
    Experience.objects.update_or_create(
        role=edata['role'],
        company=edata['company'],
        website=devmate,
        defaults=edata
    )
print("Experience seeded.")

# 7. Skills
skills_data = [
    {"name": "Python & Django", "category": "Backend", "proficiency": 95, "years_of_experience": 3, "icon": "fab fa-python", "is_top": True, "order": 0},
    {"name": "React & Next.js", "category": "Frontend", "proficiency": 92, "years_of_experience": 3, "icon": "fab fa-react", "is_top": True, "order": 1},
    {"name": "Distributed Celery Workers", "category": "Backend", "proficiency": 90, "years_of_experience": 2, "icon": "fas fa-microchip", "is_top": True, "order": 2},
    {"name": "PostgreSQL & Redis", "category": "Database", "proficiency": 88, "years_of_experience": 3, "icon": "fas fa-database", "is_top": True, "order": 3},
    {"name": "Docker & Cloud Deployments", "category": "DevOps", "proficiency": 85, "years_of_experience": 2, "icon": "fab fa-docker", "is_top": False, "order": 4},
]

for sdata in skills_data:
    Skill.objects.update_or_create(
        name=sdata['name'],
        website=devmate,
        defaults=sdata
    )
print("Skills seeded.")

# 8. Achievements
achievements_data = [
    {
        "title": "Full Stack AI Architecture Specialist",
        "issuer": "DeepLearning.AI",
        "category": "Certification",
        "date_earned": "2024-11-20",
        "description": "Certified in building and evaluating agentic AI workflows, LLM orchestration, and vector retrieval pipelines.",
        "is_featured": True,
        "is_active": True,
        "order": 0
    }
]

for adata in achievements_data:
    Achievement.objects.update_or_create(
        title=adata['title'],
        website=devmate,
        defaults=adata
    )
print("Achievements seeded.")

# 9. Contact Inquiry
contacts_data = [
    {
        "name": "Sarah Jenkins",
        "email": "sarah.jenkins@techcorp.io",
        "subject": "Enterprise SaaS Consulting Inquiry",
        "message": "Hi Roshan, loved your work on CardFlow and distributed Celery pipelines. We are looking for a senior engineer to consult on a high-throughput queue system.",
        "tag": "Hire",
        "status": "new",
        "is_read": False,
        "starred": True,
    }
]

for cdata in contacts_data:
    ContactInquiry.objects.update_or_create(
        email=cdata['email'],
        website=devmate,
        defaults=cdata
    )
print("Contacts seeded.")

print("All DevMate seed data loaded successfully!")
