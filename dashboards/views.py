from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from safe_spectacular import extend_schema
from .models import Dashboard, AuditLog, Notification, ChartConfig, FileUpload
from .serializers import (
    DashboardSerializer, AuditLogSerializer, NotificationSerializer,
    ChartConfigSerializer, FileUploadSerializer
)
from .analytics import AnalyticsService, SimpleNLPService, QueryConfig, ActionCommand
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


class AnalyticsQueryView(APIView):
    """Generate charts from structured queries."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Generate chart data from a query configuration."""
        
        try:
            query_data = request.data.get('query', {})
            query_config = QueryConfig(**query_data)
            
            analytics_service = AnalyticsService()
            chart_data = analytics_service.generate_chart_from_query(
                user=request.user,
                query_config=query_config
            )
            
            return Response({
                'success': True,
                'chart_data': chart_data.model_dump()
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class NLPChartView(APIView):
    """Generate charts from natural language queries."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Generate chart from natural language query."""
        
        query_text = request.data.get('query', '')
        save_chart = request.data.get('save_chart', False)
        
        if not query_text:
            return Response({
                'success': False,
                'message': 'Query text is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Parse natural language query
            nlp_service = SimpleNLPService()
            query_config = nlp_service.parse_query(query_text)
            
            # Generate chart data
            analytics_service = AnalyticsService()
            chart_data = analytics_service.generate_chart_from_query(
                user=request.user,
                query_config=query_config
            )
            
            # Optionally save chart configuration
            chart_config = None
            if save_chart:
                chart_config = ChartConfig.objects.create(
                    user=request.user,
                    name=chart_data.title,
                    description=f"Generated from: {query_text}",
                    chart_type=chart_data.chart_type,
                    data_source=query_config.model,
                    query_config=query_config.model_dump(),
                    display_config={
                        'title': chart_data.title,
                        'x_axis_label': chart_data.x_axis_label,
                        'y_axis_label': chart_data.y_axis_label
                    }
                )
            
            response_data = {
                'success': True,
                'chart_data': chart_data.model_dump(),
                'query_config': query_config.model_dump(),
                'original_query': query_text
            }
            
            if chart_config:
                response_data['saved_chart_id'] = str(chart_config.id)
            
            return Response(response_data)
            
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_summary(request):
    """Get comprehensive dashboard summary."""
    
    try:
        analytics_service = AnalyticsService()
        summary = analytics_service.generate_dashboard_summary(request.user)
        
        return Response({
            'success': True,
            'summary': summary
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_preset_charts(request):
    """Create preset chart configurations for the user."""
    
    try:
        analytics_service = AnalyticsService()
        charts = analytics_service.create_preset_charts(request.user)
        
        return Response({
            'success': True,
            'message': f'Created {len(charts)} preset charts',
            'chart_ids': [str(chart.id) for chart in charts]
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


class ConversationalUIView(APIView):
    """
    Conversational UI that processes natural language input to handle chart queries 
    and action commands.
    
    This class provides an endpoint for users to interact with the system using natural 
    language. It determines whether the input is a chart query or an action command and 
    delegates the processing to the appropriate handler.
    
    Attributes:
        permission_classes (list): Permissions required to access this view.
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """
        Process natural language input and execute the appropriate action.
        
        This method accepts a POST request with a natural language query. It determines 
        whether the query is an action command or a chart query and processes it accordingly.
        
        Args:
            request (Request): The HTTP request object containing user input.
        
        Returns:
            Response: A JSON response indicating success or failure, along with the 
            appropriate data or error message.
        """
        
        query_text = request.data.get('query', '')
        
        if not query_text:
            return Response({
                'success': False,
                'message': 'Query text is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            nlp_service = SimpleNLPService()
            
            # Determine if this is an action command or chart query
            if nlp_service.is_action_command(query_text):
                return self._handle_action_command(request, query_text, nlp_service)
            else:
                return self._handle_chart_query(request, query_text, nlp_service)
                
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    def _handle_action_command(self, request, query_text, nlp_service):
        """Handle action commands like create, add, schedule."""
        
        action_command = nlp_service.parse_action_command(query_text)
        
        try:
            result = self._execute_action_command(request.user, action_command)
            
            return Response({
                'success': True,
                'type': 'action',
                'command': action_command.model_dump(),
                'result': result,
                'original_query': query_text
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'type': 'action',
                'command': action_command.model_dump(),
                'message': str(e),
                'original_query': query_text
            }, status=status.HTTP_400_BAD_REQUEST)
    
    def _handle_chart_query(self, request, query_text, nlp_service):
        """Handle chart generation queries."""
        
        # Parse natural language query
        query_config = nlp_service.parse_query(query_text)
        
        # Generate chart data
        analytics_service = AnalyticsService()
        chart_data = analytics_service.generate_chart_from_query(
            user=request.user,
            query_config=query_config
        )
        
        return Response({
            'success': True,
            'type': 'chart',
            'chart_data': chart_data.model_dump(),
            'query_config': query_config.model_dump(),
            'original_query': query_text
        })
    
    def _execute_action_command(self, user, action_command: ActionCommand):
        """Execute the parsed action command."""
        
        command_type = action_command.command_type
        entity_type = action_command.entity_type
        parameters = action_command.parameters
        
        if command_type == 'create' and entity_type == 'contact_list':
            return self._create_contact_list(user, parameters)
        elif command_type == 'add' and entity_type == 'voter':
            return self._add_voter(user, parameters)
        elif command_type == 'schedule' and entity_type in ['email', 'broadcast']:
            return self._schedule_broadcast(user, parameters)
        elif command_type == 'show' or command_type == 'list':
            return self._show_entities(user, entity_type, parameters)
        else:
            raise ValueError(f"Unsupported command: {command_type} {entity_type}")
    
    def _create_contact_list(self, user, parameters):
        """Create a contact list based on parameters."""
        from voter_data.models import VoterRecord
        
        # Build query based on parameters
        queryset = VoterRecord.objects.filter(account_owner=user)
        
        # Apply filters
        if 'age_max' in parameters:
            from datetime import date
            min_birth_year = date.today().year - parameters['age_max']
            queryset = queryset.filter(birth_year__gte=min_birth_year)
        
        if 'age_min' in parameters:
            from datetime import date
            max_birth_year = date.today().year - parameters['age_min']
            queryset = queryset.filter(birth_year__lte=max_birth_year)
        
        if 'state' in parameters:
            queryset = queryset.filter(residence_part_state__icontains=parameters['state'])
        
        if 'city' in parameters:
            queryset = queryset.filter(residence_part_city__icontains=parameters['city'])
        
        # Get count and sample
        total_count = queryset.count()
        sample_voters = list(queryset[:5].values('first_name', 'last_name', 'residence_part_city', 'residence_part_state'))
        
        # For now, we'll return the query result rather than actually creating a saved list
        # In a full implementation, this would create a ContactList model
        return {
            'action': 'contact_list_created',
            'total_voters': total_count,
            'sample_voters': sample_voters,
            'filters_applied': parameters,
            'message': f"Contact list created with {total_count} voters matching your criteria."
        }
    
    def _add_voter(self, user, parameters):
        """Add a new voter to the database."""
        from voter_data.models import VoterRecord
        
        # Extract required fields
        if 'name' not in parameters:
            raise ValueError("Voter name is required")
        
        # Parse full name
        name_parts = parameters['name'].split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''
        
        # Create voter record
        voter_data = {
            'account_owner': user,
            'first_name': first_name,
            'last_name': last_name,
        }
        
        # Add optional fields
        if 'phone' in parameters:
            voter_data['primary_phone_num'] = parameters['phone']
        if 'email' in parameters:
            voter_data['primary_email_addr'] = parameters['email']
        if 'state' in parameters:
            voter_data['residence_part_state'] = parameters['state']
        if 'city' in parameters:
            voter_data['residence_part_city'] = parameters['city']
        if 'age' in parameters:
            from datetime import date
            birth_year = date.today().year - parameters['age']
            voter_data['birth_year'] = birth_year
        
        voter = VoterRecord.objects.create(**voter_data)
        
        return {
            'action': 'voter_added',
            'voter_id': str(voter.id),
            'voter_name': f"{first_name} {last_name}",
            'message': f"Successfully added voter: {first_name} {last_name}"
        }
    
    def _schedule_broadcast(self, user, parameters):
        """Schedule an email broadcast."""
        # This is a placeholder implementation
        # In a real system, this would integrate with an email service
        
        scheduled_time = parameters.get('scheduled_time')
        scheduled_hour = parameters.get('scheduled_hour')
        scheduled_minute = parameters.get('scheduled_minute')
        
        if scheduled_time:
            schedule_desc = f"at {scheduled_time}"
        elif scheduled_hour is not None:
            schedule_desc = f"at {scheduled_hour:02d}:{scheduled_minute or 0:02d}"
        else:
            schedule_desc = "for immediate delivery"
        
        return {
            'action': 'broadcast_scheduled',
            'scheduled_for': schedule_desc,
            'recipient_type': 'active_volunteers',
            'message': f"Email broadcast scheduled {schedule_desc} to all active volunteers."
        }
    
    def _show_entities(self, user, entity_type, parameters):
        """Show/list entities based on type and parameters."""
        
        if entity_type == 'voter':
            from voter_data.models import VoterRecord
            queryset = VoterRecord.objects.filter(account_owner=user)
            
            # Apply filters
            if 'state' in parameters:
                queryset = queryset.filter(residence_part_state__icontains=parameters['state'])
            
            total = queryset.count()
            recent = queryset[:10].values('first_name', 'last_name', 'residence_part_city', 'residence_part_state')
            
            return {
                'action': 'show_voters',
                'total_count': total,
                'recent_voters': list(recent),
                'message': f"Found {total} voters in your database."
            }
        
        elif entity_type == 'volunteer':
            # Placeholder for volunteer management
            return {
                'action': 'show_volunteers',
                'total_count': 0,
                'message': "Volunteer management feature coming soon."
            }
        
        else:
            return {
                'action': 'show_unknown',
                'message': f"Unable to show {entity_type}. Feature not yet implemented."
            }
    """Get current data for a specific chart configuration."""
    
    try:
        chart = get_object_or_404(
            ChartConfig,
            id=chart_id,
            user=request.user
        )
        
        # Generate fresh data using the chart's query config
        query_config = QueryConfig(**chart.query_config)
        analytics_service = AnalyticsService()
        chart_data = analytics_service.generate_chart_from_query(
            user=request.user,
            query_config=query_config
        )
        
        return Response({
            'success': True,
            'chart_config': ChartConfigSerializer(chart).data,
            'chart_data': chart_data.model_dump()
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
