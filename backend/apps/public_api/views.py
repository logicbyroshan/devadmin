import time
from django.db.models import Sum, Count, Q, F
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

from apps.websites.models import Website
from apps.profiles.models import PortfolioProfile
from apps.profiles.serializers import PortfolioProfileSerializer
from apps.projects.models import Project
from apps.projects.serializers import ProjectSerializer
from apps.blogs.models import BlogPost
from apps.blogs.serializers import (
    BlogPostSerializer,
    PublicBlogPostListSerializer,
    PublicBlogPostDetailSerializer
)
from apps.experiences.models import Experience
from apps.experiences.serializers import ExperienceSerializer
from apps.skills.models import Skill
from apps.skills.serializers import SkillSerializer
from apps.achievements.models import Achievement
from apps.achievements.serializers import AchievementSerializer
from apps.categories.models import Category
from apps.categories.serializers import CategorySerializer
from apps.contacts.models import ContactInquiry
from apps.contacts.serializers import ContactInquirySerializer


def get_target_website():
    return Website.objects.filter(slug='dev-mate').first() or Website.objects.first()


class BootstrapView(APIView):
    """
    GET /api/bootstrap/ & /api/v1/bootstrap/
    Single-roundtrip payload initializing the entire public portfolio client.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        website = get_target_website()
        site_filter = {'website': website} if website else {}

        profile_obj = PortfolioProfile.objects.filter(**site_filter).first()
        profile_data = PortfolioProfileSerializer(profile_obj).data if profile_obj else {}

        projects = Project.objects.filter(Q(visible=True) | Q(is_active=True), **site_filter).prefetch_related('screenshots')
        projects_data = ProjectSerializer(projects, many=True).data

        blogs = BlogPost.objects.filter(Q(visible=True) | Q(is_active=True), status='PUBLISHED', **site_filter)
        blogs_data = PublicBlogPostListSerializer(blogs, many=True).data

        experiences = Experience.objects.filter(Q(visible=True) | Q(is_active=True), **site_filter).prefetch_related('images')
        experiences_data = ExperienceSerializer(experiences, many=True).data

        skills = Skill.objects.filter(Q(visible=True) | Q(is_active=True), **site_filter)
        skills_data = SkillSerializer(skills, many=True).data

        achievements = Achievement.objects.filter(is_active=True, **site_filter)
        achievements_data = AchievementSerializer(achievements, many=True).data

        categories = Category.objects.all()
        categories_data = CategorySerializer(categories, many=True).data

        # Build banner payload
        banner_data = {
            "badge": profile_data.get("hero_badge", "Hello, I am"),
            "full_name": profile_data.get("full_name", "Roshan Damor"),
            "title": profile_data.get("title", "Software Engineer · Full Stack AI"),
            "description": profile_data.get("hero_description", ""),
            "profile_image": profile_data.get("profile_image", "/media/profile/hero.webp"),
            "hero_image": profile_data.get("hero_image", "/media/hero/custom_hero.webp"),
            "stat_1": {
                "value": profile_data.get("hero_stat_1_value", "1,000+"),
                "label": profile_data.get("hero_stat_1_label", "Production Users"),
                "icon": profile_data.get("hero_stat_1_icon", "fas fa-users"),
            },
            "stat_2": {
                "value": profile_data.get("hero_stat_2_value", "136K+"),
                "label": profile_data.get("hero_stat_2_label", "ID Cards Processed"),
                "icon": profile_data.get("hero_stat_2_icon", "fas fa-id-card"),
            },
            "stat_3": {
                "value": profile_data.get("hero_stat_3_value", "86K+"),
                "label": profile_data.get("hero_stat_3_label", "Cards Downloaded"),
                "icon": profile_data.get("hero_stat_3_icon", "fas fa-cloud-download-alt"),
            },
        }

        # Build summary metrics
        summary_data = {
            "total_projects": projects.count(),
            "total_skills": skills.count(),
            "total_experiences": experiences.count(),
            "total_achievements": achievements.count(),
            "total_blogs": blogs.count(),
            "total_project_views": projects.aggregate(total=Sum('views'))['total'] or 0,
            "total_project_likes": projects.aggregate(total=Sum('likes'))['total'] or 0,
        }

        return Response({
            "success": True,
            "profile": profile_data,
            "banner": banner_data,
            "projects": projects_data,
            "blogs": blogs_data,
            "experience": experiences_data,
            "skills": skills_data,
            "achievements": achievements_data,
            "categories": categories_data,
            "summary": summary_data,
        }, status=status.HTTP_200_OK)


class SummaryView(APIView):
    """
    GET /api/summary/ & /api/v1/summary/
    Aggregated public metrics for the portfolio.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        website = get_target_website()
        site_filter = {'website': website} if website else {}

        projects = Project.objects.filter(Q(visible=True) | Q(is_active=True), **site_filter)
        skills = Skill.objects.filter(Q(visible=True) | Q(is_active=True), **site_filter)
        experiences = Experience.objects.filter(Q(visible=True) | Q(is_active=True), **site_filter)
        achievements = Achievement.objects.filter(is_active=True, **site_filter)
        blogs = BlogPost.objects.filter(Q(visible=True) | Q(is_active=True), status='PUBLISHED', **site_filter)

        return Response({
            "success": True,
            "data": {
                "projects_count": projects.count(),
                "skills_count": skills.count(),
                "experience_count": experiences.count(),
                "achievements_count": achievements.count(),
                "blogs_count": blogs.count(),
                "total_views": projects.aggregate(total=Sum('views'))['total'] or 0,
                "total_likes": projects.aggregate(total=Sum('likes'))['total'] or 0,
            }
        }, status=status.HTTP_200_OK)


class BannerView(APIView):
    """
    GET /api/banners/ & /api/v1/banners/
    Dynamic hero banner settings with highlight stat cards.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        website = get_target_website()
        site_filter = {'website': website} if website else {}
        profile = PortfolioProfile.objects.filter(**site_filter).first()
        profile_data = PortfolioProfileSerializer(profile).data if profile else {}

        return Response({
            "success": True,
            "data": {
                "hero_badge": profile_data.get("hero_badge", "Hello, I am"),
                "full_name": profile_data.get("full_name", "Roshan Damor"),
                "title": profile_data.get("title", "Software Engineer · Full Stack AI"),
                "hero_description": profile_data.get("hero_description", ""),
                "profile_image": profile_data.get("profile_image", "/static/images/hero.webp"),
                "hero_image": profile_data.get("hero_image", "/static/images/hero.webp"),
                "hero_highlights_title": profile_data.get("hero_highlights_title", "Quick Portfolio Highlights"),
                "hero_highlights_visible": profile_data.get("hero_highlights_visible", True),
                "hero_stats": profile_data.get("hero_stats") or [
                    {
                        "value": profile_data.get("hero_stat_1_value", "1,000+"),
                        "label": profile_data.get("hero_stat_1_label", "Production Users"),
                        "icon": profile_data.get("hero_stat_1_icon", "fas fa-users"),
                    },
                    {
                        "value": profile_data.get("hero_stat_2_value", "136K+"),
                        "label": profile_data.get("hero_stat_2_label", "ID Cards Processed"),
                        "icon": profile_data.get("hero_stat_2_icon", "fas fa-id-card"),
                    },
                    {
                        "value": profile_data.get("hero_stat_3_value", "86K+"),
                        "label": profile_data.get("hero_stat_3_label", "Cards Downloaded"),
                        "icon": profile_data.get("hero_stat_3_icon", "fas fa-cloud-download-alt"),
                    },
                ],
                "stat_1": {
                    "value": profile_data.get("hero_stat_1_value", "1,000+"),
                    "label": profile_data.get("hero_stat_1_label", "Production Users"),
                    "icon": profile_data.get("hero_stat_1_icon", "fas fa-users"),
                },
                "stat_2": {
                    "value": profile_data.get("hero_stat_2_value", "136K+"),
                    "label": profile_data.get("hero_stat_2_label", "ID Cards Processed"),
                    "icon": profile_data.get("hero_stat_2_icon", "fas fa-id-card"),
                },
                "stat_3": {
                    "value": profile_data.get("hero_stat_3_value", "86K+"),
                    "label": profile_data.get("hero_stat_3_label", "Cards Downloaded"),
                    "icon": profile_data.get("hero_stat_3_icon", "fas fa-cloud-download-alt"),
                },
            }
        }, status=status.HTTP_200_OK)


class PublicProfileView(APIView):
    """
    GET /api/profile/ & /api/v1/profile/
    Public user profile and contact links.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        website = get_target_website()
        site_filter = {'website': website} if website else {}
        profile = PortfolioProfile.objects.filter(**site_filter).first()
        profile_data = PortfolioProfileSerializer(profile).data if profile else {}

        return Response({
            "success": True,
            "data": profile_data
        }, status=status.HTTP_200_OK)


class PublicContactSubmitView(APIView):
    """
    POST /api/contact/ & /api/v1/contact/
    Public contact form submission.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        name = request.data.get('name', '').strip()
        email = request.data.get('email', '').strip()
        subject = request.data.get('subject', 'New Contact Message').strip()
        message = request.data.get('message', '').strip()
        tag = request.data.get('tag', 'Inquiry')

        if not name or not email or not message:
            return Response(
                {'error': 'Name, email, and message are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        website = get_target_website()
        inquiry = ContactInquiry.objects.create(
            website=website,
            name=name,
            email=email,
            subject=subject,
            message=message,
            tag=tag if tag in ['Inquiry', 'Hire', 'Feedback', 'Consultation'] else 'Inquiry',
            status='new',
            is_read=False
        )

        return Response({
            'success': True,
            'message': 'Thank you! Your message has been received.',
            'id': inquiry.id
        }, status=status.HTTP_201_CREATED)


class RexiChatView(APIView):
    """
    POST /api/rexi/chat/ & /api/v1/rexi/chat/
    AI Assistant conversational endpoint.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        user_message = request.data.get('message', '').strip()
        if not user_message:
            return Response({'error': 'Message cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

        # Intelligent portfolio context responder
        response_text = (
            f"Hello! I am Rexi, Roshan Damor's portfolio AI assistant. "
            f"Regarding your query ('{user_message[:50]}...'), Roshan is a Full-Stack Software Engineer "
            f"specializing in distributed systems, high-scale Python/Django services, React glassmorphic UIs, "
            f"and production AI workflows. Feel free to explore his featured projects or reach out directly!"
        )

        return Response({
            'success': True,
            'response': response_text,
            'model': 'Rexi-Qwen3-0.6B-Portfolio'
        }, status=status.HTTP_200_OK)


class AdminAnalyticsDashboardView(APIView):
    """
    GET /api/v1/admin/analytics/dashboard/
    Real-time aggregate counters and telemetry matching Section 4 of API.md.
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request):
        website = get_target_website()
        site_filter = {'website': website} if website else {}

        projects = Project.objects.filter(**site_filter)
        skills = Skill.objects.filter(**site_filter)
        experiences = Experience.objects.filter(**site_filter)
        achievements = Achievement.objects.filter(**site_filter)
        messages = ContactInquiry.objects.filter(**site_filter)
        blogs = BlogPost.objects.filter(**site_filter)

        categories_count = Category.objects.count()

        return Response({
            "success": True,
            "data": {
                "projects": {
                    "total": projects.count(),
                    "active": projects.filter(Q(visible=True) | Q(is_active=True)).count(),
                    "views": projects.aggregate(total=Sum('views'))['total'] or 0,
                    "likes": projects.aggregate(total=Sum('likes'))['total'] or 0,
                },
                "skills": {
                    "total": skills.count(),
                    "categories": categories_count or Skill.objects.values('category').distinct().count(),
                },
                "experience": {
                    "total": experiences.count(),
                },
                "achievements": {
                    "total": achievements.count(),
                },
                "messages": {
                    "total": messages.count(),
                    "unread": messages.filter(is_read=False).count(),
                },
                "blogs": {
                    "total": blogs.count(),
                    "live": blogs.filter(status='PUBLISHED').count(),
                    "draft": blogs.filter(status='DRAFT').count(),
                }
            }
        }, status=status.HTTP_200_OK)


class PublicProjectBySlugView(APIView):
    """
    GET /api/projects/{slug}/ & /api/v1/projects/{slug}/
    Public single project detail with documentation, screenshots, and next/prev pagination.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        try:
            if slug.isdigit():
                project = Project.objects.select_related('website').prefetch_related('screenshots').get(id=int(slug))
            else:
                project = Project.objects.select_related('website').prefetch_related('screenshots').get(slug=slug)
        except Project.DoesNotExist:
            return Response({'error': 'Project not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Prev and next project navigation
        prev_proj = Project.objects.filter(order__lt=project.order, visible=True).order_by('-order').first()
        next_proj = Project.objects.filter(order__gt=project.order, visible=True).order_by('order').first()

        data = ProjectSerializer(project).data
        data['pagination'] = {
            'prev': {'slug': prev_proj.slug, 'title': prev_proj.title} if prev_proj else None,
            'next': {'slug': next_proj.slug, 'title': next_proj.title} if next_proj else None,
        }
        res_data = dict(data)
        res_data['success'] = True
        res_data['data'] = dict(data)
        return Response(res_data, status=status.HTTP_200_OK)


class PublicBlogBySlugView(APIView):
    """
    GET /api/blogs/{slug}/ & /api/v1/blogs/{slug}/
    Public single blog article detail matching Section 12.2 of API.md.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        try:
            if slug.isdigit():
                blog = BlogPost.objects.select_related('website').get(id=int(slug))
            else:
                blog = BlogPost.objects.select_related('website').get(slug=slug)
        except BlogPost.DoesNotExist:
            return Response({'error': 'Blog article not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = PublicBlogPostDetailSerializer(blog)
        res_data = dict(serializer.data)
        res_data['success'] = True
        res_data['data'] = dict(serializer.data)
        return Response(res_data, status=status.HTTP_200_OK)
