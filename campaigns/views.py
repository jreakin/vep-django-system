from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views import View
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
import json

from .models import Campaign, Audience, CampaignExecution
from .serializers import (
    CampaignSerializer, AudienceSerializer, CampaignExecutionSerializer,
    CampaignCreateSerializer, CampaignMetricsSerializer
)


class CampaignViewSet(viewsets.ModelViewSet):
    """
    API ViewSet for Campaign management
    """
    permission_classes = [IsAuthenticated]
    serializer_class = CampaignSerializer
    
    def get_queryset(self):
        # Filter campaigns based on user's role and permissions
        user = self.request.user
        if hasattr(user, 'role') and user.role == 'owner':
            return Campaign.objects.all()
        else:
            return Campaign.objects.filter(account=user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CampaignCreateSerializer
        return CampaignSerializer
    
    def perform_create(self, serializer):
        serializer.save(account=self.request.user)
    
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Start a campaign"""
        campaign = self.get_object()
        if campaign.status == 'draft' or campaign.status == 'paused':
            campaign.status = 'running'
            campaign.save()
            return Response({'message': 'Campaign started successfully'})
        else:
            return Response(
                {'error': 'Campaign cannot be started from current status'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        """Pause a campaign"""
        campaign = self.get_object()
        if campaign.status == 'running':
            campaign.status = 'paused'
            campaign.save()
            return Response({'message': 'Campaign paused successfully'})
        else:
            return Response(
                {'error': 'Campaign cannot be paused from current status'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def metrics(self, request, pk=None):
        """Get detailed campaign metrics"""
        campaign = self.get_object()
        
        # Calculate additional metrics
        total_sent = campaign.sent_count
        open_rate = (campaign.opened_count / total_sent * 100) if total_sent > 0 else 0
        click_rate = (campaign.clicked_count / total_sent * 100) if total_sent > 0 else 0
        conversion_rate = (campaign.conversion_count / total_sent * 100) if total_sent > 0 else 0
        
        metrics_data = {
            'campaign_id': campaign.id,
            'sent_count': campaign.sent_count,
            'delivered_count': campaign.delivered_count,
            'opened_count': campaign.opened_count,
            'clicked_count': campaign.clicked_count,
            'conversion_count': campaign.conversion_count,
            'open_rate': round(open_rate, 2),
            'click_rate': round(click_rate, 2),
            'conversion_rate': round(conversion_rate, 2),
            'recent_executions': self.get_recent_executions(campaign)
        }
        
        serializer = CampaignMetricsSerializer(metrics_data)
        return Response(serializer.data)
    
    def get_recent_executions(self, campaign):
        """Get recent campaign executions"""
        executions = CampaignExecution.objects.filter(
            campaign=campaign
        ).order_by('-sent_at')[:10]
        
        return [
            {
                'voter_id': str(execution.voter_id),
                'sent_at': execution.sent_at,
                'delivered_at': execution.delivered_at,
                'opened_at': execution.opened_at,
                'clicked_at': execution.clicked_at,
                'conversion_at': execution.conversion_at,
                'error_message': execution.error_message
            }
            for execution in executions
        ]


class AudienceViewSet(viewsets.ModelViewSet):
    """
    API ViewSet for Audience management
    """
    permission_classes = [IsAuthenticated]
    serializer_class = AudienceSerializer
    
    def get_queryset(self):
        # Filter audiences based on user's role and permissions
        user = self.request.user
        if hasattr(user, 'role') and user.role == 'owner':
            return Audience.objects.all()
        else:
            return Audience.objects.filter(account=user)
    
    def perform_create(self, serializer):
        serializer.save(account=self.request.user)
    
    @action(detail=True, methods=['post'])
    def estimate_size(self, request, pk=None):
        """Estimate audience size based on filters"""
        audience = self.get_object()
        
        # This would integrate with your voter data system
        # For now, return a mock estimate
        estimated_size = 1000  # Replace with actual calculation
        
        audience.estimated_size = estimated_size
        audience.save()
        
        return Response({
            'estimated_size': estimated_size,
            'message': 'Audience size updated'
        })


@login_required
def campaign_management(request):
    """
    Main campaign management dashboard view
    """
    return render(request, 'frontend/campaign_management.html', {
        'user': request.user
    })


@method_decorator(csrf_exempt, name='dispatch')
class CampaignAPIView(View):
    """
    Basic API view for campaign operations (fallback for non-DRF)
    """
    
    def get(self, request):
        """Get campaigns list"""
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        campaigns = Campaign.objects.filter(account=request.user)
        campaigns_data = [
            {
                'id': str(campaign.id),
                'name': campaign.name,
                'campaign_type': campaign.campaign_type,
                'status': campaign.status,
                'sent_count': campaign.sent_count,
                'delivered_count': campaign.delivered_count,
                'opened_count': campaign.opened_count,
                'clicked_count': campaign.clicked_count,
                'conversion_count': campaign.conversion_count,
                'created_at': campaign.created_at.isoformat(),
                'message_template': campaign.message_template,
                'budget': str(campaign.budget) if campaign.budget else None,
                'scheduled_send': campaign.scheduled_send.isoformat() if campaign.scheduled_send else None
            }
            for campaign in campaigns
        ]
        
        return JsonResponse(campaigns_data, safe=False)
    
    def post(self, request):
        """Create new campaign"""
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        try:
            data = json.loads(request.body)
            
            # Validate required fields
            required_fields = ['name', 'campaign_type', 'audience', 'message_template']
            for field in required_fields:
                if not data.get(field):
                    return JsonResponse({'error': f'{field} is required'}, status=400)
            
            # Get audience
            try:
                audience = Audience.objects.get(id=data['audience'], account=request.user)
            except Audience.DoesNotExist:
                return JsonResponse({'error': 'Invalid audience'}, status=400)
            
            # Create campaign
            campaign = Campaign.objects.create(
                name=data['name'],
                campaign_type=data['campaign_type'],
                account=request.user,
                audience=audience,
                message_template=data['message_template'],
                budget=data.get('budget'),
                scheduled_send=data.get('scheduled_send')
            )
            
            return JsonResponse({
                'success': True,
                'campaign': {
                    'id': str(campaign.id),
                    'name': campaign.name,
                    'status': campaign.status
                }
            })
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class AudienceAPIView(View):
    """
    Basic API view for audience operations (fallback for non-DRF)
    """
    
    def get(self, request):
        """Get audiences list"""
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        audiences = Audience.objects.filter(account=request.user)
        audiences_data = [
            {
                'id': str(audience.id),
                'name': audience.name,
                'platform': audience.platform,
                'status': audience.status,
                'estimated_size': audience.estimated_size,
                'created_at': audience.created_at.isoformat(),
                'filters': audience.filters
            }
            for audience in audiences
        ]
        
        return JsonResponse(audiences_data, safe=False)
    
    def post(self, request):
        """Create new audience"""
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        try:
            data = json.loads(request.body)
            
            # Validate required fields
            required_fields = ['name', 'platform']
            for field in required_fields:
                if not data.get(field):
                    return JsonResponse({'error': f'{field} is required'}, status=400)
            
            # Create audience
            audience = Audience.objects.create(
                name=data['name'],
                platform=data['platform'],
                account=request.user,
                filters=data.get('filters', {}),
                status='active'
            )
            
            return JsonResponse({
                'success': True,
                'audience': {
                    'id': str(audience.id),
                    'name': audience.name,
                    'platform': audience.platform,
                    'status': audience.status
                }
            })
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
