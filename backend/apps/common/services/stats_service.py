"""
Reusable Dashboard Analytics & Metrics Service
Provides high-performance single-pass database aggregations, activity streams, and contribution heatmaps.
"""

import calendar
from collections import defaultdict
from typing import Dict, Any, List
from django.utils import timezone
from apps.websites.models import Website
from apps.projects.models import Project
from apps.experiences.models import Experience
from apps.skills.models import Skill
from apps.contacts.models import ContactInquiry
from apps.faqs.models import Faq
from apps.achievements.models import Achievement
from apps.profiles.models import PortfolioProfile

class AnalyticsService:
    @staticmethod
    def get_dashboard_metrics(website_slug: str = None) -> Dict[str, Any]:
        """Aggregate counts and status breakdowns for the given website or all sites."""
        site_filter = {}
        if website_slug:
            try:
                if website_slug.isdigit():
                    site = Website.objects.get(id=int(website_slug))
                else:
                    site = Website.objects.get(slug=website_slug)
                site_filter = {'website': site}
            except Website.DoesNotExist:
                site_filter = {}

        return {
            'website': website_slug or 'all',
            'projects': {
                'total': Project.objects.filter(**site_filter).count(),
                'live': Project.objects.filter(status='LIVE', **site_filter).count(),
                'offline': Project.objects.filter(status='OFFLINE', **site_filter).count(),
            },
            'experiences': {
                'total': Experience.objects.filter(**site_filter).count(),
                'current': Experience.objects.filter(status='CURRENT', **site_filter).count(),
            },
            'skills': {
                'total': Skill.objects.filter(**site_filter).count(),
            },
            'messages': {
                'total': ContactInquiry.objects.filter(**site_filter).count(),
                'unread': ContactInquiry.objects.filter(is_read=False, **site_filter).count(),
                'starred': ContactInquiry.objects.filter(starred=True, **site_filter).count(),
            },
            'faqs': {
                'total': Faq.objects.filter(**site_filter).count(),
            }
        }

    @staticmethod
    def get_recent_activities(website_slug: str = None, limit: int = 4) -> Dict[str, List[Dict[str, Any]]]:
        """Retrieve recent project deployments and updates."""
        site_filter = {}
        if website_slug:
            if website_slug.isdigit():
                site_filter = {'website_id': int(website_slug)}
            else:
                site_filter = {'website__slug': website_slug}

        recent_projects = Project.objects.filter(**site_filter).select_related('website').order_by('-created_at')[:limit]

        return {
            'projects': [{
                'id': p.id,
                'title': f'Deployed: "{p.title}"' if p.status == 'LIVE' else f'Updated project: "{p.title}"',
                'time': p.completed_date or 'Recently',
                'status': p.status,
                'category': p.category
            } for p in recent_projects]
        }

    @staticmethod
    def generate_contribution_heatmap(year: int = None, website_slug: str = None) -> Dict[str, Any]:
        """
        Generate full 12-month contribution activity matrix tracking real database activity:
        projects created/updated, skills created/updated, experiences created/updated,
        achievements, inquiries received, FAQs, and profile updates.
        """
        if year is None:
            year = timezone.now().year

        site_filter = {}
        if website_slug:
            try:
                if website_slug.isdigit():
                    site = Website.objects.get(id=int(website_slug))
                else:
                    site = Website.objects.get(slug=website_slug)
                site_filter = {'website': site}
            except Website.DoesNotExist:
                site_filter = {}

        # Daily activity map: (month, day) -> {'count': int, 'details': list, 'actions': dict}
        daily_map = defaultdict(lambda: {'count': 0, 'details': [], 'actions': defaultdict(int)})

        def register_event(dt, action_label, category):
            if not dt:
                return
            if hasattr(dt, 'year') and dt.year == year:
                m, d = dt.month, dt.day
                entry = daily_map[(m, d)]
                entry['count'] += 1
                entry['actions'][category] += 1
                if len(entry['details']) < 5:
                    entry['details'].append(action_label)

        # 1. Projects (created & updated)
        try:
            for p in Project.objects.filter(**site_filter).only('id', 'title', 'created_at', 'updated_at'):
                if p.created_at:
                    register_event(p.created_at, f"Added project '{p.title}'", "projects_added")
                if p.updated_at and p.created_at and p.updated_at.date() != p.created_at.date():
                    register_event(p.updated_at, f"Updated project '{p.title}'", "projects_updated")
        except Exception:
            pass

        # 2. Skills (created & updated)
        try:
            for s in Skill.objects.filter(**site_filter).only('id', 'name', 'created_at', 'updated_at'):
                if s.created_at:
                    register_event(s.created_at, f"Added skill '{s.name}'", "skills_added")
                if s.updated_at and s.created_at and s.updated_at.date() != s.created_at.date():
                    register_event(s.updated_at, f"Updated skill '{s.name}'", "skills_updated")
        except Exception:
            pass

        # 3. Experiences (created & updated)
        try:
            for e in Experience.objects.filter(**site_filter).only('id', 'role', 'company', 'created_at', 'updated_at'):
                if e.created_at:
                    register_event(e.created_at, f"Added experience '{e.role} at {e.company}'", "experiences_added")
                if e.updated_at and e.created_at and e.updated_at.date() != e.created_at.date():
                    register_event(e.updated_at, f"Updated experience '{e.role}'", "experiences_updated")
        except Exception:
            pass

        # 4. Achievements (created & updated)
        try:
            for a in Achievement.objects.filter(**site_filter).only('id', 'title', 'created_at', 'updated_at'):
                if a.created_at:
                    register_event(a.created_at, f"Added achievement '{a.title}'", "achievements_added")
                if a.updated_at and a.created_at and a.updated_at.date() != a.created_at.date():
                    register_event(a.updated_at, f"Updated achievement '{a.title}'", "achievements_updated")
        except Exception:
            pass

        # 5. Messages / Inquiries
        try:
            for c in ContactInquiry.objects.filter(**site_filter).only('id', 'name', 'created_at'):
                if c.created_at:
                    register_event(c.created_at, f"Received message from '{c.name}'", "messages_received")
        except Exception:
            pass

        # 6. FAQs (created & updated)
        try:
            for f in Faq.objects.filter(**site_filter).only('id', 'question', 'created_at', 'updated_at'):
                if f.created_at:
                    register_event(f.created_at, f"Added FAQ '{f.question[:30]}...'", "faqs_added")
                if f.updated_at and f.created_at and f.updated_at.date() != f.created_at.date():
                    register_event(f.updated_at, f"Updated FAQ", "faqs_updated")
        except Exception:
            pass

        # 7. Portfolio Profile (updated)
        try:
            for prof in PortfolioProfile.objects.filter(**site_filter).only('id', 'full_name', 'updated_at'):
                if prof.updated_at:
                    register_event(prof.updated_at, f"Updated profile & hero info", "profile_updated")
        except Exception:
            pass

        months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ]

        matrix = []
        total_activities = 0

        for m_idx, month_name in enumerate(months):
            month_num = m_idx + 1
            first_weekday_mon0, days_count = calendar.monthrange(year, month_num)
            # Sunday-first day of week (0=Sun, 1=Mon, ..., 6=Sat)
            start_day_offset = (first_weekday_mon0 + 1) % 7

            days = []
            for d in range(1, days_count + 1):
                entry = daily_map.get((month_num, d), {'count': 0, 'details': [], 'actions': {}})
                cnt = entry['count']
                total_activities += cnt

                # Intensity level (0 to 4)
                if cnt == 0:
                    level = 0
                elif cnt == 1:
                    level = 1
                elif cnt <= 3:
                    level = 2
                elif cnt <= 6:
                    level = 3
                else:
                    level = 4

                # Human-friendly summary string
                action_parts = []
                for act_key, act_cnt in entry.get('actions', {}).items():
                    label = act_key.replace('_', ' ')
                    action_parts.append(f"{act_cnt} {label}")
                summary_str = ", ".join(action_parts) if action_parts else ("1 activity" if cnt == 1 else f"{cnt} activities")

                days.append({
                    'day': d,
                    'level': level,
                    'count': cnt,
                    'summary': summary_str,
                    'details': entry.get('details', [])
                })

            matrix.append({
                'month': month_name,
                'month_number': month_num,
                'start_day_offset': start_day_offset,
                'days_count': days_count,
                'days': days,
                'total_commits': sum(d['count'] for d in days)
            })

        return {
            'year': year,
            'website': website_slug or 'all',
            'months': matrix,
            'total_annual_contributions': total_activities
        }
