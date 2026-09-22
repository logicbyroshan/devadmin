"""
System & Database Health Check Endpoint & API Root Overview
"""

import time
from django.conf import settings
from django.db import connection
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status


class HealthCheckView(APIView):
    """
    Health check endpoint for production uptime monitoring and readiness probes.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        start_time = time.time()
        db_status = "healthy"
        db_error = None

        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        except Exception as ex:
            db_status = "unhealthy"
            db_error = str(ex)

        latency_ms = round((time.time() - start_time) * 1000, 2)
        is_healthy = db_status == "healthy"

        data = {
            "status": "healthy" if is_healthy else "degraded",
            "service": "DevAdmin REST API",
            "database": {
                "status": db_status,
                "latency_ms": latency_ms,
                "engine": connection.settings_dict.get('ENGINE', 'unknown').split('.')[-1]
            }
        }

        if db_error:
            data["database"]["error"] = db_error if settings.DEBUG else "Database connection unavailable"

        http_status = status.HTTP_200_OK if is_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
        return Response(data, status=http_status)


class ApiRootView(APIView):
    """
    Root API discovery index.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            "service": "DevAdmin Multi-Site Portfolio Management REST API",
            "version": "1.0.0",
            "documentation": {
                "swagger_ui": "/api/docs/",
                "redoc": "/api/redoc/",
                "openapi_schema": "/api/schema/"
            },
            "health": "/api/health/",
            "endpoints": {
                "auth": {
                    "token": "/api/auth/token/",
                    "refresh": "/api/auth/token/refresh/",
                    "register": "/api/auth/register/",
                    "me": "/api/auth/me/",
                    "change_password": "/api/auth/change-password/"
                },
                "websites": "/api/websites/",
                "projects": "/api/projects/",
                "blogs": "/api/blogs/",
                "experiences": "/api/experiences/",
                "skills": "/api/skills/",
                "contacts": "/api/contacts/",
                "faqs": "/api/faqs/",
                "profiles": "/api/profiles/",
                "dashboard": "/api/dashboard/stats/"
            }
        })
