from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from drf_spectacular.utils import extend_schema
from .models import Dashboard, AuditLog, Notification, ChartConfig, FileUpload
from .serializers import (
    DashboardSerializer, AuditLogSerializer, NotificationSerializer,
    ChartConfigSerializer, FileUploadSerializer
)
import json


class DashboardListCreateView(generics.ListCreateAPIView):
    """List and create dashboards."""
    
    serializer_class = DashboardSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get dashboards owned by or shared with the user."""
        user = self.request.user
        return Dashboard.objects.filter(
            Q(user=user) | Q(shared_with=user)
        ).distinct()
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class DashboardDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Dashboard detail view."""
    
    serializer_class = DashboardSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Dashboard.objects.filter(
            Q(user=user) | Q(shared_with=user)
        ).distinct()


class NotificationListView(generics.ListAPIView):
    """List notifications for the current user."""
    
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Notification.objects.filter(recipient=user)
        
        # Filter by read status
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            is_read = is_read.lower() == 'true'
            queryset = queryset.filter(is_read=is_read)
        
        # Filter by type
        notification_type = self.request.query_params.get('type')
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        
        return queryset.order_by('-created_at')


class NotificationDetailView(generics.RetrieveUpdateAPIView):
    """Notification detail view for marking as read."""
    
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)
    
    def perform_update(self, serializer):
        if serializer.validated_data.get('is_read') and not serializer.instance.is_read:
            serializer.save(read_at=timezone.now())
        else:
            serializer.save()


class MarkNotificationsReadView(APIView):
    """Mark notifications as read."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Mark notifications as read."""
        
        notification_ids = request.data.get('notification_ids', [])
        mark_all = request.data.get('mark_all', False)
        
        user = request.user
        
        if mark_all:
            # Mark all unread notifications as read
            count = Notification.objects.filter(
                recipient=user,
                is_read=False
            ).update(is_read=True, read_at=timezone.now())
            
            return Response({
                'success': True,
                'message': f'Marked {count} notifications as read'
            })
        
        elif notification_ids:
            # Mark specific notifications as read
            count = Notification.objects.filter(
                id__in=notification_ids,
                recipient=user,
                is_read=False
            ).update(is_read=True, read_at=timezone.now())
            
            return Response({
                'success': True,
                'message': f'Marked {count} notifications as read'
            })
        
        else:
            return Response({
                'success': False,
                'message': 'Either notification_ids or mark_all=true is required'
            }, status=status.HTTP_400_BAD_REQUEST)


class AuditLogListView(generics.ListAPIView):
    """List audit logs (admin/superuser only)."""
    
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Only allow superusers or owner role to see audit logs
        if not (user.is_superuser or user.role == 'owner'):
            return AuditLog.objects.none()
        
        queryset = AuditLog.objects.all()
        
        # Filter by user
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by action
        action = self.request.query_params.get('action')
        if action:
            queryset = queryset.filter(action=action)
        
        # Filter by content type
        content_type = self.request.query_params.get('content_type')
        if content_type:
            try:
                ct = ContentType.objects.get(model=content_type.lower())
                queryset = queryset.filter(content_type=ct)
            except ContentType.DoesNotExist:
                pass
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(timestamp__gte=start_date)
        if end_date:
            queryset = queryset.filter(timestamp__lte=end_date)
        
        return queryset.order_by('-timestamp')


class ChartConfigListCreateView(generics.ListCreateAPIView):
    """List and create chart configurations."""
    
    serializer_class = ChartConfigSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return ChartConfig.objects.filter(
            Q(user=user) | Q(shared_with=user) | Q(is_public=True)
        ).distinct()
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ChartConfigDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Chart configuration detail view."""
    
    serializer_class = ChartConfigSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return ChartConfig.objects.filter(
            Q(user=user) | Q(shared_with=user) | Q(is_public=True)
        ).distinct()


class FileUploadListView(generics.ListAPIView):
    """List file uploads for the current user."""
    
    serializer_class = FileUploadSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return FileUpload.objects.filter(user=self.request.user).order_by('-created_at')


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def notification_count(request):
    """Get unread notification count."""
    
    count = Notification.objects.filter(
        recipient=request.user,
        is_read=False
    ).count()
    
    return Response({
        'unread_count': count
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_stats(request):
    """Get dashboard statistics for the current user."""
    
    user = request.user
    
    # Get basic stats
    stats = {
        'dashboards_count': Dashboard.objects.filter(user=user).count(),
        'charts_count': ChartConfig.objects.filter(user=user).count(),
        'unread_notifications': Notification.objects.filter(
            recipient=user, is_read=False
        ).count(),
        'recent_uploads': FileUpload.objects.filter(
            user=user, created_at__gte=timezone.now() - timezone.timedelta(days=7)
        ).count(),
    }
    
    # Get voter data stats if user has access
    if user.role in ['state', 'county', 'campaign', 'owner']:
        from voter_data.models import VoterRecord
        stats['total_voters'] = VoterRecord.objects.filter(account_owner=user).count()
        stats['recent_voters'] = VoterRecord.objects.filter(
            account_owner=user,
            created_at__gte=timezone.now() - timezone.timedelta(days=7)
        ).count()
    
    return Response(stats)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_notification(request):
    """Create a notification (for testing or system use)."""
    
    # Only allow certain roles to create notifications
    if request.user.role not in ['owner', 'admin']:
        return Response({
            'success': False,
            'message': 'Insufficient permissions'
        }, status=status.HTTP_403_FORBIDDEN)
    
    recipient_id = request.data.get('recipient_id')
    title = request.data.get('title')
    message = request.data.get('message')
    notification_type = request.data.get('type', 'info')
    
    if not all([recipient_id, title, message]):
        return Response({
            'success': False,
            'message': 'recipient_id, title, and message are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        recipient = User.objects.get(id=recipient_id)
        
        notification = Notification.objects.create(
            recipient=recipient,
            title=title,
            message=message,
            notification_type=notification_type
        )
        
        # Send via WebSocket if available
        try:
            from asgiref.sync import async_to_sync
            from .consumers import send_notification_to_user
            
            async_to_sync(send_notification_to_user)(
                str(recipient.id),
                {
                    'id': str(notification.id),
                    'title': notification.title,
                    'message': notification.message,
                    'type': notification.notification_type,
                    'created_at': notification.created_at.isoformat(),
                }
            )
        except:
            pass  # WebSocket delivery is optional
        
        return Response({
            'success': True,
            'notification_id': str(notification.id)
        })
        
    except User.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Recipient not found'
        }, status=status.HTTP_404_NOT_FOUND)
