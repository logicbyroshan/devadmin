from django.utils import timezone
from django.db.models import Q
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.common.mixins import MultiTenantViewSetMixin
from .models import ContactInquiry
from .serializers import ContactInquirySerializer

class ContactInquiryViewSet(MultiTenantViewSetMixin, viewsets.ModelViewSet):
    """
    Contact Inquiries & Lead Management API.
    Supports filtering by status, search, starring, read flags, SMTP replies, and bulk operations.
    """
    queryset = ContactInquiry.objects.select_related('website').all()
    serializer_class = ContactInquirySerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        status_param = self.request.query_params.get('status', None)
        tag = self.request.query_params.get('tag', None)
        starred = self.request.query_params.get('starred', None)
        search = self.request.query_params.get('search', None)

        if status_param:
            queryset = queryset.filter(status__iexact=status_param)
        if tag:
            queryset = queryset.filter(tag__iexact=tag)
        if starred is not None:
            val = str(starred).lower() in ['true', '1']
            queryset = queryset.filter(starred=val)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(email__icontains=search) |
                Q(subject__icontains=search) |
                Q(message__icontains=search)
            )
        return queryset

    @action(detail=True, methods=['post'], url_path='reply', permission_classes=[permissions.IsAuthenticated])
    def reply(self, request, pk=None):
        """Record reply text and timestamp."""
        inquiry = self.get_object()
        subject = request.data.get('reply_subject', f"Re: {inquiry.subject}")
        text = request.data.get('reply_text', '')

        if not text:
            return Response({'error': 'reply_text is required.'}, status=status.HTTP_400_BAD_REQUEST)

        inquiry.replied = True
        inquiry.reply_subject = subject
        inquiry.reply_text = text
        inquiry.replied_at = timezone.now()
        inquiry.status = 'replied'
        inquiry.is_read = True
        inquiry.save()

        return Response({
            'success': True,
            'status': 'sent',
            'message': 'Reply recorded.',
            'inquiry': ContactInquirySerializer(inquiry).data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='toggle_star', permission_classes=[permissions.IsAuthenticated])
    def toggle_star(self, request, pk=None):
        """Toggle starred bookmark on inquiry."""
        inquiry = self.get_object()
        inquiry.starred = not inquiry.starred
        inquiry.save(update_fields=['starred'])
        return Response({'success': True, 'starred': inquiry.starred}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='mark_read', permission_classes=[permissions.IsAuthenticated])
    def mark_read(self, request, pk=None):
        """Mark inquiry as read."""
        inquiry = self.get_object()
        inquiry.is_read = True
        if inquiry.status == 'new':
            inquiry.status = 'read'
        inquiry.save(update_fields=['is_read', 'status'])
        return Response({'success': True, 'is_read': True}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='bulk-action', permission_classes=[permissions.IsAuthenticated])
    def bulk_action(self, request):
        """
        POST /api/v1/admin/messages/bulk-action/
        {"message_ids": [1, 2], "action": "mark_read" | "mark_spam" | "archive" | "delete"}
        """
        message_ids = request.data.get('message_ids', [])
        action_name = request.data.get('action', '')

        if not isinstance(message_ids, list) or not message_ids:
            return Response({'error': 'message_ids must be a non-empty list.'}, status=status.HTTP_400_BAD_REQUEST)

        inquiries = ContactInquiry.objects.filter(id__in=message_ids)

        if action_name == 'mark_read':
            inquiries.update(is_read=True, status='read')
        elif action_name == 'mark_spam':
            inquiries.update(status='spam')
        elif action_name == 'archive':
            inquiries.update(status='archived')
        elif action_name == 'delete':
            inquiries.delete()
        else:
            return Response({'error': f'Unsupported action "{action_name}".'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'success': True,
            'message': f'Bulk action "{action_name}" executed on {len(message_ids)} messages.'
        }, status=status.HTTP_200_OK)
