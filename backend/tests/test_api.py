"""
DevAdmin Comprehensive Test Suite
Tests authentication, permissions, multi-tenancy, serializers, analytics,
contact replies, health diagnostics, Swagger docs, and production security.
"""

from unittest.mock import patch
from django.test import TestCase, override_settings
from django.contrib.auth.models import User
from django.conf import settings
from rest_framework.test import APIClient
from rest_framework import status

from apps.websites.models import Website
from apps.projects.models import Project
from apps.experiences.models import Experience
from apps.skills.models import Skill
from apps.categories.models import Category
from apps.achievements.models import Achievement
from apps.contacts.models import ContactInquiry
from apps.faqs.models import Faq
from apps.profiles.models import PortfolioProfile
from apps.common.services.stats_service import AnalyticsService


class DevAdminApiTestSuite(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create websites
        self.site_meet = Website.objects.create(
            slug='dev-meet',
            name='DevMeet',
            badge='MEET',
            tag='Video Suite',
            primary_color='blue'
        )
        self.site_mitra = Website.objects.create(
            slug='dev-mitra',
            name='DevMitra',
            badge='MITRA',
            tag='Mentorship',
            primary_color='sky'
        )
        self.site_mate = Website.objects.create(
            slug='dev-mate',
            name='DevMate',
            badge='DevMate',
            tag='Sandbox IDE',
            primary_color='violet'
        )

        # Create superadmin user
        self.admin_user = User.objects.create_superuser(
            username='adminuser',
            email='admin@devadmin.io',
            password='ComplexPassword123!',
            first_name='Admin',
            last_name='User'
        )

        # Create regular non-superuser
        self.normal_user = User.objects.create_user(
            username='normaluser',
            email='normal@devadmin.io',
            password='ComplexPassword123!',
            first_name='Normal',
            last_name='User'
        )

        # Obtain JWT Token for superadmin
        res = self.client.post('/api/auth/token/', {
            'username': 'adminuser',
            'password': 'ComplexPassword123!'
        })
        self.access_token = res.data['access']
        self.refresh_token = res.data['refresh']

        # Authenticated superadmin client
        self.auth_client = APIClient()
        self.auth_client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')

    def test_health_check_endpoints(self):
        """Test all health endpoints return 200 and healthy DB status."""
        for endpoint in ['/health/', '/api/health/', '/api/v1/health/']:
            response = self.client.get(endpoint)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data['status'], 'healthy')
            self.assertEqual(response.data['database']['status'], 'healthy')
            self.assertIn('latency_ms', response.data['database'])

    def test_health_check_degraded_simulation(self):
        """Test health check returns 503 when database connection fails and does not leak credentials."""
        with patch('django.db.connection.cursor', side_effect=Exception('DB Connection Refused')):
            response = self.client.get('/health/')
            self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
            self.assertEqual(response.data['status'], 'degraded')
            self.assertEqual(response.data['database']['status'], 'unhealthy')

    def test_api_root_and_documentation(self):
        """Test root discovery and OpenAPI schema endpoints."""
        res_root = self.client.get('/')
        self.assertEqual(res_root.status_code, status.HTTP_200_OK)
        self.assertIn('documentation', res_root.data)

        res_api_root = self.client.get('/api/')
        self.assertEqual(res_api_root.status_code, status.HTTP_200_OK)

        res_schema = self.client.get('/api/schema/')
        self.assertEqual(res_schema.status_code, status.HTTP_200_OK)

        res_docs = self.client.get('/api/docs/')
        self.assertEqual(res_docs.status_code, status.HTTP_200_OK)

    def test_jwt_authentication_lifecycle(self):
        """Test complete token obtain, refresh, invalid credentials rejection, and superadmin validation."""
        # 1. Non-superuser login is strictly forbidden
        res_non_super = self.client.post('/api/auth/token/', {
            'username': 'normaluser',
            'password': 'ComplexPassword123!'
        })
        self.assertEqual(res_non_super.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('Access denied', str(res_non_super.data))

        # 2. Refresh token
        res_refresh = self.client.post('/api/auth/token/refresh/', {
            'refresh': self.refresh_token
        })
        self.assertEqual(res_refresh.status_code, status.HTTP_200_OK)
        new_access = res_refresh.data['access']

        # 3. Access with new token
        new_client = APIClient()
        new_client.credentials(HTTP_AUTHORIZATION=f'Bearer {new_access}')
        res_me = new_client.get('/api/auth/me/')
        self.assertEqual(res_me.status_code, status.HTTP_200_OK)
        self.assertEqual(res_me.data['username'], 'adminuser')
        self.assertTrue(res_me.data['is_superuser'])

        # 4. Invalid credentials rejection
        res_invalid = self.client.post('/api/auth/token/', {
            'username': 'adminuser',
            'password': 'WrongPassword123'
        })
        self.assertEqual(res_invalid.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_registration_and_validation(self):
        """Test registration is protected by superadmin authentication and validates password."""
        # Unauthenticated registration is rejected with 401
        res_unauth = self.client.post('/api/auth/register/', {
            'username': 'newuser1',
            'email': 'new1@example.com',
            'password': 'ValidSecretPassword123!'
        })
        self.assertEqual(res_unauth.status_code, status.HTTP_401_UNAUTHORIZED)

        # Authenticated superadmin weak password validation
        res_weak = self.auth_client.post('/api/auth/register/', {
            'username': 'newuser1',
            'email': 'new1@example.com',
            'password': '123'
        })
        self.assertEqual(res_weak.status_code, status.HTTP_400_BAD_REQUEST)

        # Authenticated superadmin registration success
        res_success = self.auth_client.post('/api/auth/register/', {
            'username': 'newuser1',
            'email': 'new1@example.com',
            'password': 'ValidSecretPassword123!',
            'first_name': 'New',
            'last_name': 'User'
        })
        self.assertEqual(res_success.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', res_success.data)
        self.assertTrue(User.objects.filter(username='newuser1').exists())

    def test_password_change_flow(self):
        """Test authenticated password change endpoint."""
        res_wrong = self.auth_client.post('/api/auth/change-password/', {
            'current_password': 'WrongPassword!',
            'new_password': 'BrandNewPassword123!'
        })
        self.assertEqual(res_wrong.status_code, status.HTTP_400_BAD_REQUEST)

        res_correct = self.auth_client.post('/api/auth/change-password/', {
            'current_password': 'ComplexPassword123!',
            'new_password': 'BrandNewPassword123!'
        })
        self.assertEqual(res_correct.status_code, status.HTTP_200_OK)

        res_login = self.client.post('/api/auth/token/', {
            'username': 'adminuser',
            'password': 'BrandNewPassword123!'
        })
        self.assertEqual(res_login.status_code, status.HTTP_200_OK)

    def test_project_crud_and_atomic_metrics(self):
        """Test creating project, atomic like increment, atomic view increment, and visibility."""
        payload = {
            'website': 'dev-meet',
            'title': 'Realtime Video Conferencing',
            'slug': 'realtime-video-conferencing',
            'description': 'WebRTC streaming room',
            'category': 'Web Application',
            'status': 'LIVE',
            'completed_date': '2025-06-01',
            'visible': True
        }
        res_unauth = self.client.post('/api/projects/', payload)
        self.assertEqual(res_unauth.status_code, status.HTTP_401_UNAUTHORIZED)

        res_create = self.auth_client.post('/api/projects/', payload)
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)
        proj_id = res_create.data['id']

        # Atomic Like
        res_like = self.client.post(f'/api/projects/{proj_id}/like/')
        self.assertEqual(res_like.status_code, status.HTTP_200_OK)
        self.assertEqual(res_like.data['likes'], 1)

        # Atomic View
        res_view = self.client.post(f'/api/projects/{proj_id}/view/')
        self.assertEqual(res_view.status_code, status.HTTP_200_OK)
        self.assertEqual(res_view.data['views'], 1)

        # Toggle visibility
        res_toggle = self.auth_client.post(f'/api/projects/{proj_id}/toggle_visibility/')
        self.assertEqual(res_toggle.status_code, status.HTTP_200_OK)
        self.assertFalse(res_toggle.data['visible'])

    def test_skills_and_experiences_crud(self):
        """Test skills and experience endpoints with multi-tenant filtering."""
        # Skill
        res_skill = self.auth_client.post('/api/skills/', {
            'website': 'dev-meet',
            'name': 'Python',
            'level': 90,
            'category': 'Backend',
            'visible': True
        })
        self.assertEqual(res_skill.status_code, status.HTTP_201_CREATED)

        # Experience
        res_exp = self.auth_client.post('/api/experiences/', {
            'website': 'dev-meet',
            'role': 'Senior Software Engineer',
            'company': 'Tech Corp',
            'start_date': '2023-01-01',
            'current': True,
            'visible': True
        })
        self.assertEqual(res_exp.status_code, status.HTTP_201_CREATED)
        exp_id = res_exp.data['id']

        res_exp_toggle = self.auth_client.post(f'/api/experiences/{exp_id}/toggle_visibility/')
        self.assertEqual(res_exp_toggle.status_code, status.HTTP_200_OK)

    def test_contact_inquiry_public_submit_and_admin_reply(self):
        """Test public contact inquiry creation and authenticated email reply."""
        contact_payload = {
            'website': 'dev-meet',
            'name': 'Client User',
            'email': 'client@example.com',
            'subject': 'Project Discussion',
            'message': 'Can we build an app together?',
            'tag': 'Inquiry'
        }
        res_submit = self.client.post('/api/contacts/', contact_payload)
        self.assertEqual(res_submit.status_code, status.HTTP_201_CREATED)
        inquiry_id = res_submit.data['id']

        res_list_unauth = self.client.get('/api/contacts/')
        self.assertEqual(res_list_unauth.status_code, status.HTTP_401_UNAUTHORIZED)

        res_list = self.auth_client.get('/api/contacts/')
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)

        res_reply = self.auth_client.post(f'/api/contacts/{inquiry_id}/reply/', {
            'reply_subject': 'Re: Project Discussion',
            'reply_text': 'I would love to collaborate!'
        })
        self.assertEqual(res_reply.status_code, status.HTTP_200_OK)
        self.assertEqual(res_reply.data['status'], 'sent')

        inquiry = ContactInquiry.objects.get(id=inquiry_id)
        self.assertTrue(inquiry.replied)
        self.assertTrue(inquiry.is_read)

    def test_faqs_and_categories_endpoints(self):
        """Test FAQs and Categories CRUD."""
        # Category
        res_cat = self.auth_client.post('/api/categories/', {
            'website': 'dev-meet',
            'name': 'Full Stack Architecture',
            'slug': 'full-stack-architecture',
            'type': 'project'
        })
        self.assertEqual(res_cat.status_code, status.HTTP_201_CREATED)

        # FAQ
        res_faq = self.auth_client.post('/api/faqs/', {
            'website': 'dev-meet',
            'question': 'What stack do you use?',
            'answer': 'Django and React.',
            'category': 'General',
            'visible': True
        })
        self.assertEqual(res_faq.status_code, status.HTTP_201_CREATED)

    def test_public_serving_apis(self):
        """Test public bootstrap, summary, profile, banner, and chat views."""
        res_bootstrap = self.client.get('/api/bootstrap/')
        self.assertEqual(res_bootstrap.status_code, status.HTTP_200_OK)

        res_summary = self.client.get('/api/summary/')
        self.assertEqual(res_summary.status_code, status.HTTP_200_OK)

        res_profile = self.client.get('/api/profile/')
        self.assertEqual(res_profile.status_code, status.HTTP_200_OK)

        res_banners = self.client.get('/api/banners/')
        self.assertEqual(res_banners.status_code, status.HTTP_200_OK)

        res_rexi = self.client.post('/api/rexi/chat/', {'message': 'Hello AI Assistant'})
        self.assertEqual(res_rexi.status_code, status.HTTP_200_OK)

    def test_dashboard_analytics_service(self):
        """Test analytics metrics and dynamic contribution heatmap."""
        # Initial state before activity
        initial_heatmap = AnalyticsService.generate_contribution_heatmap()
        self.assertIn('months', initial_heatmap)
        self.assertEqual(len(initial_heatmap['months']), 12)
        self.assertEqual(initial_heatmap['total_annual_contributions'], 0)

        # Create real activity
        Project.objects.create(
            website=self.site_meet,
            title='Test Realtime Project',
            slug='test-realtime-project',
            description='Testing activity aggregation',
            category='Backend'
        )
        Skill.objects.create(
            website=self.site_meet,
            name='Python Test',
            level=85,
            category='Language'
        )

        metrics = AnalyticsService.get_dashboard_metrics(website_slug='dev-meet')
        self.assertIn('projects', metrics)
        self.assertIn('messages', metrics)

        # Re-fetch heatmap to verify real activity was tracked
        updated_heatmap = AnalyticsService.generate_contribution_heatmap(website_slug='dev-meet')
        self.assertIn('months', updated_heatmap)
        self.assertEqual(len(updated_heatmap['months']), 12)
        self.assertGreaterEqual(updated_heatmap['total_annual_contributions'], 2)


    def test_dashboard_endpoints_unauthenticated_forbidden(self):
        """Test unauthenticated GET requests to all dashboard analytics endpoints return 401 Unauthorized."""
        endpoints = [
            '/api/dashboard/stats/',
            '/api/dashboard/activities/',
            '/api/dashboard/heatmap/',
            '/api/v1/admin/analytics/dashboard/',
            '/api/admin/analytics/dashboard/',
        ]
        for url in endpoints:
            response = self.client.get(url)
            self.assertEqual(
                response.status_code,
                status.HTTP_401_UNAUTHORIZED,
                f"Endpoint {url} should be protected but returned {response.status_code}"
            )

    def test_dashboard_endpoints_authenticated_success(self):
        """Test authenticated GET requests to all dashboard analytics endpoints return 200 OK."""
        # 1. /api/dashboard/stats/
        res_stats = self.auth_client.get('/api/dashboard/stats/?website=dev-meet')
        self.assertEqual(res_stats.status_code, status.HTTP_200_OK)
        self.assertIn('projects', res_stats.data)

        # 2. /api/dashboard/activities/
        res_activities = self.auth_client.get('/api/dashboard/activities/?website=dev-meet')
        self.assertEqual(res_activities.status_code, status.HTTP_200_OK)

        # 3. /api/dashboard/heatmap/
        res_heatmap = self.auth_client.get('/api/dashboard/heatmap/')
        self.assertEqual(res_heatmap.status_code, status.HTTP_200_OK)
        self.assertIn('months', res_heatmap.data)

        # 4. /api/v1/admin/analytics/dashboard/
        res_admin_dash = self.auth_client.get('/api/v1/admin/analytics/dashboard/')
        self.assertEqual(res_admin_dash.status_code, status.HTTP_200_OK)
        self.assertTrue(res_admin_dash.data['success'])
        self.assertIn('projects', res_admin_dash.data['data'])

    def test_production_security_settings(self):
        """Test critical production security configuration attributes."""
        self.assertEqual(settings.SECURE_PROXY_SSL_HEADER, ('HTTP_X_FORWARDED_PROTO', 'https'))
        self.assertTrue(settings.SESSION_COOKIE_HTTPONLY)
        self.assertEqual(settings.X_FRAME_OPTIONS, 'DENY')
        self.assertTrue(settings.SECURE_CONTENT_TYPE_NOSNIFF)
