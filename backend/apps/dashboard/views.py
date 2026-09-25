from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from apps.common.services.stats_service import AnalyticsService

class DashboardStatsView(APIView):
    """
    Returns single-pass aggregated counts and status metrics for projects,
    experiences, skills, messages, and FAQs.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        website_slug = request.query_params.get('website', None)
        metrics = AnalyticsService.get_dashboard_metrics(website_slug)
        return Response(metrics, status=status.HTTP_200_OK)


class DashboardActivitiesView(APIView):
    """
    Returns live recent activity feeds for deployed projects and updates.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        website_slug = request.query_params.get('website', None)
        activities = AnalyticsService.get_recent_activities(website_slug)
        return Response(activities, status=status.HTTP_200_OK)


class DashboardHeatmapView(APIView):
    """
    Returns full 12-month annual contribution activity matrix.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        heatmap = AnalyticsService.generate_contribution_heatmap(year=2025)
        return Response(heatmap, status=status.HTTP_200_OK)
