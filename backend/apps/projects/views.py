import os
from django.db import transaction
from django.db.models import F, Q
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.common.mixins import MultiTenantViewSetMixin
from .models import Project, ProjectScreenshot
from .serializers import ProjectSerializer, ProjectScreenshotSerializer

from django.conf import settings

class ProjectViewSet(MultiTenantViewSetMixin, viewsets.ModelViewSet):
    """
    Comprehensive Projects Management & Serving API.
    Supports multi-tenant scoping, category filtering, search, rich documentation,
    screenshot uploads, reordering, atomic like/view tracking, and bulk operations.
    """
    queryset = Project.objects.select_related('website').prefetch_related('screenshots').all()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        status_param = self.request.query_params.get('status', None)
        category_param = self.request.query_params.get('category', None)
        is_active = self.request.query_params.get('is_active', None)
        is_featured = self.request.query_params.get('is_featured', None)
        search_query = self.request.query_params.get('search', None)

        if status_param:
            queryset = queryset.filter(status__iexact=status_param)
        if category_param:
            queryset = queryset.filter(category__icontains=category_param)
        if is_active is not None:
            val = str(is_active).lower() in ['true', '1']
            queryset = queryset.filter(Q(visible=val) | Q(is_active=val))
        if is_featured is not None:
            val = str(is_featured).lower() in ['true', '1']
            queryset = queryset.filter(Q(featured=val) | Q(is_featured=val))
        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query) |
                Q(project_name__icontains=search_query) |
                Q(description__icontains=search_query) |
                Q(technologies__icontains=search_query)
            )
        return queryset

    @action(detail=True, methods=['post', 'get'], url_path='toggle-active', permission_classes=[permissions.IsAuthenticated])
    def toggle_active(self, request, pk=None):
        """Fast toggle active/inactive visibility for a project."""
        project = self.get_object()
        project.visible = not project.visible
        project.is_active = project.visible
        project.save(update_fields=['visible', 'is_active', 'updated_at'])
        return Response({
            'success': True,
            'id': project.id,
            'is_active': project.is_active,
            'visible': project.visible
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='upload-screenshots', permission_classes=[permissions.IsAuthenticated])
    def upload_screenshots(self, request, pk=None):
        """Upload one or multiple screenshot images for a project."""
        project = self.get_object()
        files = request.FILES.getlist('images') or request.FILES.getlist('screenshots') or request.FILES.getlist('image')
        image_urls = request.data.get('image_urls', [])
        captions = request.data.get('captions', '')

        created = []
        # Process file uploads
        if files:
            for idx, f in enumerate(files):
                filename = f"projects/screenshots/{project.id}_{f.name}"
                os.makedirs(os.path.join(settings.MEDIA_ROOT, 'projects', 'screenshots'), exist_ok=True)
                file_path = os.path.join(settings.MEDIA_ROOT, filename)
                with open(file_path, 'wb+') as destination:
                    for chunk in f.chunks():
                        destination.write(chunk)
                media_url = f"/media/{filename}"
                screenshot = ProjectScreenshot.objects.create(
                    project=project,
                    image=media_url,
                    caption=captions if isinstance(captions, str) else "",
                    order=project.screenshots.count() + idx
                )
                created.append(ProjectScreenshotSerializer(screenshot).data)

        # Process URL strings if passed
        if isinstance(image_urls, list):
            for idx, url in enumerate(image_urls):
                if url:
                    screenshot = ProjectScreenshot.objects.create(
                        project=project,
                        image=url,
                        order=project.screenshots.count() + idx
                    )
                    created.append(ProjectScreenshotSerializer(screenshot).data)

        return Response({
            'success': True,
            'message': f'Uploaded {len(created)} screenshots.',
            'screenshots': created
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path=r'screenshots/(?P<screenshot_id>\d+)', permission_classes=[permissions.IsAuthenticated])
    def delete_screenshot(self, request, pk=None, screenshot_id=None):
        """Remove a specific screenshot from the project."""
        project = self.get_object()
        try:
            screenshot = project.screenshots.get(id=screenshot_id)
            screenshot.delete()
            return Response({'success': True, 'message': 'Screenshot deleted.'}, status=status.HTTP_200_OK)
        except ProjectScreenshot.DoesNotExist:
            return Response({'error': 'Screenshot not found.'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'], url_path='reorder', permission_classes=[permissions.IsAuthenticated])
    def reorder_projects(self, request):
        """Reorder projects via order map {"order_map": {"1": 0, "2": 1}}"""
        order_map = request.data.get('order_map', {})
        if not isinstance(order_map, dict):
            return Response({'error': 'order_map must be a dictionary of id -> order index.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            for proj_id, order_val in order_map.items():
                Project.objects.filter(id=proj_id).update(order=int(order_val))

        return Response({'success': True, 'message': 'Project ordering updated.'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='bulk-status', permission_classes=[permissions.IsAuthenticated])
    def bulk_status(self, request):
        """Bulk update project status or visibility."""
        project_ids = request.data.get('project_ids', [])
        new_status = request.data.get('status', None)
        is_active = request.data.get('is_active', None)

        if not isinstance(project_ids, list) or not project_ids:
            return Response({'error': 'project_ids must be a non-empty list.'}, status=status.HTTP_400_BAD_REQUEST)

        update_kwargs = {}
        if new_status:
            update_kwargs['status'] = new_status
        if is_active is not None:
            update_kwargs['visible'] = bool(is_active)
            update_kwargs['is_active'] = bool(is_active)

        if update_kwargs:
            Project.objects.filter(id__in=project_ids).update(**update_kwargs)

        return Response({
            'success': True,
            'message': f'Updated {len(project_ids)} projects.'
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='like', permission_classes=[permissions.AllowAny])
    def atomic_like(self, request, pk=None):
        """Atomic like increment for project."""
        project = self.get_object()
        Project.objects.filter(pk=project.pk).update(likes=F('likes') + 1)
        project.refresh_from_db(fields=['likes'])
        return Response({'success': True, 'likes': project.likes}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='view', permission_classes=[permissions.AllowAny])
    def atomic_view(self, request, pk=None):
        """Atomic view tracking increment."""
        project = self.get_object()
        Project.objects.filter(pk=project.pk).update(views=F('views') + 1)
        project.refresh_from_db(fields=['views'])
        return Response({'success': True, 'views': project.views}, status=status.HTTP_200_OK)
