from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

from apps.websites.views_auth import (
    SuperAdminTokenObtainPairView,
    RegisterView,
    CurrentUserView,
    ChangePasswordView
)
from apps.common.views_health import HealthCheckView, ApiRootView

# ViewSets
from apps.websites.views import WebsiteViewSet
from apps.projects.views import ProjectViewSet
from apps.blogs.views import BlogPostViewSet
from apps.experiences.views import ExperienceViewSet
from apps.skills.views import SkillViewSet
from apps.categories.views import CategoryViewSet
from apps.achievements.views import AchievementViewSet
from apps.contacts.views import ContactInquiryViewSet
from apps.faqs.views import FaqViewSet
from apps.profiles.views import (
    PortfolioProfileViewSet,
    AdminProfileView,
    UploadProfileImageView,
    DeleteProfileImageView,
    UploadHeroImageView,
    DeleteHeroImageView,
    UploadDocumentView,
    DeleteDocumentView,
)

# Public & Admin Analytics Views
from apps.public_api.views import (
    BootstrapView,
    SummaryView,
    BannerView,
    PublicProfileView,
    PublicContactSubmitView,
    RexiChatView,
    AdminAnalyticsDashboardView,
    PublicProjectBySlugView,
    PublicBlogBySlugView,
)

# Routers for standard endpoints
admin_router = DefaultRouter()
admin_router.register(r'projects', ProjectViewSet, basename='admin-projects')
admin_router.register(r'blogs', BlogPostViewSet, basename='admin-blogs')
admin_router.register(r'experiences', ExperienceViewSet, basename='admin-experiences')
admin_router.register(r'skills', SkillViewSet, basename='admin-skills')
admin_router.register(r'categories', CategoryViewSet, basename='admin-categories')
admin_router.register(r'achievements', AchievementViewSet, basename='admin-achievements')
admin_router.register(r'messages', ContactInquiryViewSet, basename='admin-messages')
admin_router.register(r'contacts', ContactInquiryViewSet, basename='admin-contacts')
admin_router.register(r'faqs', FaqViewSet, basename='admin-faqs')
admin_router.register(r'websites', WebsiteViewSet, basename='admin-websites')

public_router = DefaultRouter()
public_router.register(r'projects', ProjectViewSet, basename='public-projects')
public_router.register(r'blogs', BlogPostViewSet, basename='public-blogs')
public_router.register(r'experiences', ExperienceViewSet, basename='public-experiences')
public_router.register(r'experience', ExperienceViewSet, basename='public-experience')
public_router.register(r'skills', SkillViewSet, basename='public-skills')
public_router.register(r'categories', CategoryViewSet, basename='public-categories')
public_router.register(r'achievements', AchievementViewSet, basename='public-achievements')
public_router.register(r'contacts', ContactInquiryViewSet, basename='public-contacts')
public_router.register(r'faqs', FaqViewSet, basename='public-faqs')
public_router.register(r'websites', WebsiteViewSet, basename='public-websites')
public_router.register(r'profiles', PortfolioProfileViewSet, basename='public-profiles')


admin_patterns = [
    # Auth
    path('auth/login/', SuperAdminTokenObtainPairView.as_view(), name='admin_login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='admin_token_refresh'),
    path('auth/me/', CurrentUserView.as_view(), name='admin_me'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='admin_change_password'),
    
    # Analytics
    path('analytics/dashboard/', AdminAnalyticsDashboardView.as_view(), name='admin_analytics_dashboard'),
    
    # Profile & Hero
    path('profile/', AdminProfileView.as_view(), name='admin_profile'),
    path('profile/upload-image/', UploadProfileImageView.as_view(), name='admin_upload_profile_image'),
    path('profile/delete-image/', DeleteProfileImageView.as_view(), name='admin_delete_profile_image'),
    path('profile/upload-hero-image/', UploadHeroImageView.as_view(), name='admin_upload_hero_image'),
    path('profile/delete-hero-image/', DeleteHeroImageView.as_view(), name='admin_delete_hero_image'),
    path('profile/upload-document/', UploadDocumentView.as_view(), name='admin_upload_document'),
    path('profile/delete-document/', DeleteDocumentView.as_view(), name='admin_delete_document'),

    # Interactive Docs
    path('docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='admin_docs'),

    # Admin ViewSet Routes
    path('', include(admin_router.urls)),
]

urlpatterns = [
    path('', ApiRootView.as_view(), name='root_index'),
    path('api/', ApiRootView.as_view(), name='api_root_index'),
    path('admin/', admin.site.urls),
    
    # OpenAPI Schema & Docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='swagger-ui'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # Health Diagnostics
    path('api/health/', HealthCheckView.as_view(), name='health_check'),
    path('api/v1/health/', HealthCheckView.as_view(), name='health_check_v1'),
    path('health/', HealthCheckView.as_view(), name='health_check_root'),
    
    # Canonical Staff Admin API: /api/v1/admin/* & alias /api/admin/*
    path('api/v1/admin/', include(admin_patterns)),
    path('api/admin/', include(admin_patterns)),
    
    # Public Serving Endpoints (Both /api/ and /api/v1/)
    path('api/bootstrap/', BootstrapView.as_view(), name='public_bootstrap'),
    path('api/v1/bootstrap/', BootstrapView.as_view(), name='public_bootstrap_v1'),
    path('api/summary/', SummaryView.as_view(), name='public_summary'),
    path('api/v1/summary/', SummaryView.as_view(), name='public_summary_v1'),
    path('api/profile/', PublicProfileView.as_view(), name='public_profile'),
    path('api/v1/profile/', PublicProfileView.as_view(), name='public_profile_v1'),
    path('api/banners/', BannerView.as_view(), name='public_banners'),
    path('api/v1/banners/', BannerView.as_view(), name='public_banners_v1'),
    path('api/contact/', PublicContactSubmitView.as_view(), name='public_contact'),
    path('api/v1/contact/', PublicContactSubmitView.as_view(), name='public_contact_v1'),
    path('api/rexi/chat/', RexiChatView.as_view(), name='rexi_chat'),
    path('api/v1/rexi/chat/', RexiChatView.as_view(), name='rexi_chat_v1'),

    # Public Slug Lookups for Projects and Blogs
    path('api/projects/<str:slug>/', PublicProjectBySlugView.as_view(), name='public_project_slug'),
    path('api/v1/projects/<str:slug>/', PublicProjectBySlugView.as_view(), name='public_project_slug_v1'),
    path('api/blogs/<str:slug>/', PublicBlogBySlugView.as_view(), name='public_blog_slug'),
    path('api/v1/blogs/<str:slug>/', PublicBlogBySlugView.as_view(), name='public_blog_slug_v1'),

    # Standard Auth Endpoints for backwards compatibility
    path('api/auth/token/', SuperAdminTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/register/', RegisterView.as_view(), name='auth_register'),
    path('api/auth/me/', CurrentUserView.as_view(), name='auth_current_user'),
    path('api/auth/change-password/', ChangePasswordView.as_view(), name='auth_change_password'),
    path('api/dashboard/', include('apps.dashboard.urls')),

    # Public / Default API router (projects, blogs, skills, experiences, categories, achievements, contacts, faqs, profiles)
    path('api/', include(public_router.urls)),
    path('api/v1/', include(public_router.urls)),
]

from django.views.static import serve

urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]
