from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import connection
from django.conf import settings
from django.utils import timezone
from django.http import HttpResponse, FileResponse
import tempfile
import os
from .models import (
    AnalyticsQuery, AnalyticsDashboard, AnalyticsWidget, 
    PredictiveModel, ModelPrediction, AnalyticsSession
)
from .serializers import (
    AnalyticsQuerySerializer, AnalyticsDashboardSerializer, AnalyticsWidgetSerializer,
    PredictiveModelSerializer, ModelPredictionSerializer, AnalyticsSessionSerializer
)
import json
import re
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class AnalyticsQueryViewSet(viewsets.ModelViewSet):
    """ViewSet for AnalyticsQuery management."""
    
    queryset = AnalyticsQuery.objects.all()
    serializer_class = AnalyticsQuerySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = AnalyticsQuery.objects.all()
        
        # Filter by user
        user_queries = self.request.query_params.get('user_queries')
        if user_queries == 'true':
            queryset = queryset.filter(user=self.request.user)
        
        # Filter by query type
        query_type = self.request.query_params.get('query_type')
        if query_type:
            queryset = queryset.filter(query_type=query_type)
        
        # Filter by status
        query_status = self.request.query_params.get('status')
        if query_status:
            queryset = queryset.filter(status=query_status)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AnalyticsDashboardViewSet(viewsets.ModelViewSet):
    """ViewSet for AnalyticsDashboard management."""
    
    queryset = AnalyticsDashboard.objects.all()
    serializer_class = AnalyticsDashboardSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = AnalyticsDashboard.objects.all()
        
        # Filter by dashboard type
        dashboard_type = self.request.query_params.get('dashboard_type')
        if dashboard_type:
            queryset = queryset.filter(dashboard_type=dashboard_type)
        
        # Filter by campaign
        campaign_id = self.request.query_params.get('campaign_id')
        if campaign_id:
            queryset = queryset.filter(campaign_id=campaign_id)
        
        # Show only user's dashboards or public ones
        queryset = queryset.filter(
            models.Q(created_by=self.request.user) |
            models.Q(shared_with=self.request.user) |
            models.Q(is_public=True)
        ).distinct()
        
        return queryset.prefetch_related('dashboard_widgets')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class AnalyticsWidgetViewSet(viewsets.ModelViewSet):
    """ViewSet for AnalyticsWidget management."""
    
    queryset = AnalyticsWidget.objects.all()
    serializer_class = AnalyticsWidgetSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = AnalyticsWidget.objects.all()
        
        # Filter by dashboard
        dashboard_id = self.request.query_params.get('dashboard_id')
        if dashboard_id:
            queryset = queryset.filter(dashboard_id=dashboard_id)
        
        # Filter by widget type
        widget_type = self.request.query_params.get('widget_type')
        if widget_type:
            queryset = queryset.filter(widget_type=widget_type)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset.select_related('dashboard').order_by('position_y', 'position_x')


class PredictiveModelViewSet(viewsets.ModelViewSet):
    """ViewSet for PredictiveModel management."""
    
    queryset = PredictiveModel.objects.all()
    serializer_class = PredictiveModelSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = PredictiveModel.objects.all()
        
        # Filter by model type
        model_type = self.request.query_params.get('model_type')
        if model_type:
            queryset = queryset.filter(model_type=model_type)
        
        # Filter by status
        model_status = self.request.query_params.get('status')
        if model_status:
            queryset = queryset.filter(status=model_status)
        
        # Show only active models by default
        active_only = self.request.query_params.get('active_only', 'false')
        if active_only == 'true':
            queryset = queryset.filter(status='active')
        
        return queryset.order_by('-trained_at')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ModelPredictionViewSet(viewsets.ModelViewSet):
    """ViewSet for ModelPrediction management."""
    
    queryset = ModelPrediction.objects.all()
    serializer_class = ModelPredictionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = ModelPrediction.objects.all()
        
        # Filter by model
        model_id = self.request.query_params.get('model_id')
        if model_id:
            queryset = queryset.filter(model_id=model_id)
        
        # Filter by campaign
        campaign_id = self.request.query_params.get('campaign_id')
        if campaign_id:
            queryset = queryset.filter(campaign_id=campaign_id)
        
        # Filter by target ID
        target_id = self.request.query_params.get('target_id')
        if target_id:
            queryset = queryset.filter(target_id=target_id)
        
        return queryset.select_related('model', 'requested_by').order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)


class AnalyticsSessionViewSet(viewsets.ModelViewSet):
    """ViewSet for AnalyticsSession management."""
    
    queryset = AnalyticsSession.objects.all()
    serializer_class = AnalyticsSessionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = AnalyticsSession.objects.all()
        
        # Show only user's sessions
        queryset = queryset.filter(user=self.request.user)
        
        # Filter by campaign
        campaign_id = self.request.query_params.get('campaign_id')
        if campaign_id:
            queryset = queryset.filter(campaign_id=campaign_id)
        
        return queryset.order_by('-started_at')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_nlp_query(request):
    """Process natural language query using AI/NLP."""
    
    query_text = request.data.get('query', '').strip()
    query_type = request.data.get('query_type', 'custom')
    campaign_id = request.data.get('campaign_id')
    
    if not query_text:
        return Response(
            {'error': 'Query text is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create query record
    analytics_query = AnalyticsQuery.objects.create(
        natural_language_query=query_text,
        query_type=query_type,
        user=request.user,
        campaign_id=campaign_id,
        status='processing'
    )
    
    try:
        # Parse query intent and generate response
        parsed_intent = parse_query_intent(query_text)
        analytics_query.parsed_intent = parsed_intent
        
        # Generate SQL or data query based on intent
        result_data, chart_config = execute_analytics_query(parsed_intent, campaign_id)
        
        # Generate insights using AI
        insights = generate_ai_insights(result_data, query_text)
        
        # Update query with results
        analytics_query.result_data = result_data
        analytics_query.chart_config = chart_config
        analytics_query.insights = insights
        analytics_query.status = 'completed'
        analytics_query.processing_completed_at = timezone.now()
        
        # Calculate execution time
        if analytics_query.processing_started_at:
            execution_time = (analytics_query.processing_completed_at - analytics_query.processing_started_at).total_seconds() * 1000
            analytics_query.execution_time_ms = int(execution_time)
        
        analytics_query.save()
        
        return Response({
            'query_id': analytics_query.id,
            'status': analytics_query.status,
            'result_data': result_data,
            'chart_config': chart_config,
            'insights': insights,
            'execution_time_ms': analytics_query.execution_time_ms,
        })
        
    except Exception as e:
        logger.error(f"Query processing failed: {str(e)}")
        analytics_query.status = 'failed'
        analytics_query.error_message = str(e)
        analytics_query.save()
        
        return Response({
            'query_id': analytics_query.id,
            'status': 'failed',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def parse_query_intent(query_text):
    """Parse natural language query to extract intent and parameters."""
    
    intent = {
        'intent_type': 'unknown',
        'entities': {},
        'filters': {},
        'aggregations': [],
        'chart_type': 'bar_chart'
    }
    
    query_lower = query_text.lower()
    
    # Intent classification
    if any(word in query_lower for word in ['show', 'display', 'chart', 'graph']):
        intent['intent_type'] = 'visualization'
    elif any(word in query_lower for word in ['count', 'how many', 'number of']):
        intent['intent_type'] = 'count'
    elif any(word in query_lower for word in ['compare', 'comparison', 'vs', 'versus']):
        intent['intent_type'] = 'comparison'
    elif any(word in query_lower for word in ['trend', 'over time', 'change']):
        intent['intent_type'] = 'trend'
        intent['chart_type'] = 'line_chart'
    elif any(word in query_lower for word in ['breakdown', 'distribution', 'by']):
        intent['intent_type'] = 'breakdown'
        intent['chart_type'] = 'pie_chart'
    
    # Entity extraction
    if 'voter' in query_lower:
        intent['entities']['subject'] = 'voters'
    elif 'volunteer' in query_lower:
        intent['entities']['subject'] = 'volunteers'
    elif 'campaign' in query_lower:
        intent['entities']['subject'] = 'campaigns'
    elif 'territory' in query_lower or 'precinct' in query_lower:
        intent['entities']['subject'] = 'territories'
    
    # Geographic entities
    geo_terms = ['precinct', 'district', 'county', 'state', 'zip', 'area', 'region']
    for term in geo_terms:
        if term in query_lower:
            intent['entities']['geography'] = term
            break
    
    # Demographic entities
    demo_terms = ['age', 'party', 'gender', 'race', 'ethnicity', 'demographic']
    for term in demo_terms:
        if term in query_lower:
            intent['entities']['demographic'] = term
            break
    
    # Time entities
    time_terms = ['today', 'yesterday', 'week', 'month', 'year', 'recent']
    for term in time_terms:
        if term in query_lower:
            intent['entities']['time_period'] = term
            break
    
    # Party affiliation detection
    parties = ['democratic', 'democrat', 'republican', 'independent', 'green', 'libertarian']
    for party in parties:
        if party in query_lower:
            intent['filters']['party_affiliation'] = party
            break
    
    return intent


def execute_analytics_query(parsed_intent, campaign_id=None):
    """Execute analytics query based on parsed intent."""
    
    intent_type = parsed_intent.get('intent_type')
    subject = parsed_intent.get('entities', {}).get('subject', 'voters')
    chart_type = parsed_intent.get('chart_type', 'bar_chart')
    
    # Sample data generation based on intent
    # In a real implementation, this would query the actual database
    
    if intent_type == 'count' and subject == 'voters':
        result_data = [{'name': 'Total Voters', 'value': 15420}]
        chart_config = {'type': 'metric', 'valueKey': 'value', 'unit': 'voters'}
        
    elif intent_type == 'breakdown' and 'party' in str(parsed_intent):
        result_data = [
            {'name': 'Democratic', 'value': 6720},
            {'name': 'Republican', 'value': 5890},
            {'name': 'Independent', 'value': 2810},
        ]
        chart_config = {'type': 'pie_chart', 'valueKey': 'value'}
        
    elif intent_type == 'trend':
        result_data = [
            {'name': 'Jan', 'value': 1200},
            {'name': 'Feb', 'value': 1450},
            {'name': 'Mar', 'value': 1320},
            {'name': 'Apr', 'value': 1680},
            {'name': 'May', 'value': 1890},
        ]
        chart_config = {'type': 'line_chart', 'xKey': 'name', 'yKey': 'value'}
        
    elif 'geography' in parsed_intent.get('entities', {}):
        result_data = [
            {'name': 'Precinct 1', 'value': 3240},
            {'name': 'Precinct 2', 'value': 2890},
            {'name': 'Precinct 3', 'value': 3120},
            {'name': 'Precinct 4', 'value': 2780},
            {'name': 'Precinct 5', 'value': 3390},
        ]
        chart_config = {'type': 'bar_chart', 'xKey': 'name', 'yKey': 'value'}
        
    else:
        # Default response
        result_data = [
            {'name': 'Category A', 'value': 120},
            {'name': 'Category B', 'value': 230},
            {'name': 'Category C', 'value': 180},
        ]
        chart_config = {'type': chart_type, 'xKey': 'name', 'yKey': 'value'}
    
    return result_data, chart_config


def generate_ai_insights(result_data, query_text):
    """Generate AI-powered insights from query results."""
    
    insights = []
    
    if not result_data or not isinstance(result_data, list):
        return insights
    
    # Statistical insights
    if len(result_data) > 1 and all('value' in item for item in result_data):
        values = [item['value'] for item in result_data]
        total = sum(values)
        max_value = max(values)
        min_value = min(values)
        
        # Find highest and lowest categories
        max_item = next(item for item in result_data if item['value'] == max_value)
        min_item = next(item for item in result_data if item['value'] == min_value)
        
        insights.append(f"The highest value is {max_item['name']} with {max_value:,}")
        insights.append(f"The lowest value is {min_item['name']} with {min_value:,}")
        
        # Calculate percentages
        if total > 0:
            max_percent = (max_value / total) * 100
            insights.append(f"{max_item['name']} represents {max_percent:.1f}% of the total")
        
        # Variance insights
        if len(values) > 2:
            avg = total / len(values)
            variance = sum((v - avg) ** 2 for v in values) / len(values)
            std_dev = variance ** 0.5
            
            if std_dev / avg > 0.3:  # High variance
                insights.append("There is significant variation in the data distribution")
            else:
                insights.append("The data shows relatively consistent distribution")
    
    # Trend insights for time series data
    if len(result_data) > 2 and all('value' in item for item in result_data):
        values = [item['value'] for item in result_data]
        
        # Check for trends
        increasing = sum(1 for i in range(1, len(values)) if values[i] > values[i-1])
        decreasing = sum(1 for i in range(1, len(values)) if values[i] < values[i-1])
        
        if increasing > decreasing:
            insights.append("The data shows an overall increasing trend")
        elif decreasing > increasing:
            insights.append("The data shows an overall decreasing trend")
        else:
            insights.append("The data shows mixed or stable trends")
        
        # Growth rate
        if len(values) >= 2:
            start_value = values[0]
            end_value = values[-1]
            if start_value > 0:
                growth_rate = ((end_value - start_value) / start_value) * 100
                insights.append(f"Growth rate from start to end: {growth_rate:+.1f}%")
    
    # Context-specific insights based on query
    query_lower = query_text.lower()
    if 'party' in query_lower and len(result_data) >= 2:
        insights.append("Consider targeting efforts based on party affiliation distribution")
    elif 'precinct' in query_lower or 'geographic' in query_lower:
        insights.append("Geographic analysis can help optimize field operations")
    elif 'turnout' in query_lower:
        insights.append("Turnout patterns indicate voter engagement levels")
    
    return insights[:5]  # Limit to 5 insights


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_query_results(request, query_id):
    """Get results for a specific analytics query."""
    
    try:
        query = AnalyticsQuery.objects.get(id=query_id, user=request.user)
    except AnalyticsQuery.DoesNotExist:
        return Response(
            {'error': 'Query not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    return Response({
        'query_id': query.id,
        'natural_language_query': query.natural_language_query,
        'query_type': query.query_type,
        'status': query.status,
        'result_data': query.result_data,
        'chart_config': query.chart_config,
        'insights': query.insights,
        'execution_time_ms': query.execution_time_ms,
        'created_at': query.created_at,
        'processed_at': query.processing_completed_at,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def refresh_dashboard(request, dashboard_id):
    """Refresh all widgets in a dashboard."""
    
    try:
        dashboard = AnalyticsDashboard.objects.get(id=dashboard_id)
    except AnalyticsDashboard.DoesNotExist:
        return Response(
            {'error': 'Dashboard not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check permissions
    if (dashboard.created_by != request.user and 
        not dashboard.shared_with.filter(id=request.user.id).exists() and 
        not dashboard.is_public):
        return Response(
            {'error': 'Access denied'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    refreshed_widgets = []
    
    for widget in dashboard.dashboard_widgets.filter(is_active=True):
        # Simulate data refresh (in real implementation, re-query data sources)
        widget.last_updated = timezone.now()
        widget.save(update_fields=['last_updated'])
        refreshed_widgets.append(widget.id)
    
    # Update dashboard refresh time
    dashboard.last_refreshed_at = timezone.now()
    dashboard.save(update_fields=['last_refreshed_at'])
    
    return Response({
        'dashboard_id': dashboard_id,
        'refreshed_widgets': refreshed_widgets,
        'refreshed_at': dashboard.last_refreshed_at,
        'message': f'Refreshed {len(refreshed_widgets)} widgets'
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_widget_data(request, widget_id):
    """Get fresh data for a specific widget."""
    
    try:
        widget = AnalyticsWidget.objects.get(id=widget_id)
    except AnalyticsWidget.DoesNotExist:
        return Response(
            {'error': 'Widget not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Simulate data fetching based on widget configuration
    # In real implementation, this would query actual data sources
    
    if widget.widget_type == 'metric':
        data = [{'name': 'Total', 'value': 1524}]
    elif widget.widget_type == 'bar_chart':
        data = [
            {'name': 'A', 'value': 120},
            {'name': 'B', 'value': 230},
            {'name': 'C', 'value': 180},
        ]
    elif widget.widget_type == 'line_chart':
        data = [
            {'name': 'Jan', 'value': 100},
            {'name': 'Feb', 'value': 150},
            {'name': 'Mar', 'value': 120},
        ]
    else:
        data = widget.cached_data or []
    
    # Update widget cache
    widget.cached_data = data
    widget.last_updated = timezone.now()
    widget.save(update_fields=['cached_data', 'last_updated'])
    
    return Response({
        'widget_id': widget_id,
        'data': data,
        'chart_config': widget.chart_config,
        'last_updated': widget.last_updated,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def batch_predict(request):
    """Run batch predictions using ML models."""
    
    model_id = request.data.get('model_id')
    target_ids = request.data.get('target_ids', [])
    campaign_id = request.data.get('campaign_id')
    
    if not model_id or not target_ids:
        return Response(
            {'error': 'model_id and target_ids are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        model = PredictiveModel.objects.get(id=model_id, status='active')
    except PredictiveModel.DoesNotExist:
        return Response(
            {'error': 'Model not found or inactive'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    predictions = []
    
    for target_id in target_ids:
        # Simulate prediction (in real implementation, use actual ML model)
        prediction_value = 0.65  # Example prediction
        confidence = 0.82
        
        prediction = ModelPrediction.objects.create(
            model=model,
            input_features={'target_id': target_id},
            target_id=target_id,
            prediction_value=prediction_value,
            confidence_score=confidence,
            requested_by=request.user,
            campaign_id=campaign_id
        )
        
        predictions.append({
            'prediction_id': prediction.id,
            'target_id': target_id,
            'prediction_value': prediction_value,
            'confidence_score': confidence,
        })
    
    # Update model usage stats
    model.prediction_count += len(predictions)
    model.last_prediction_at = timezone.now()
    model.save(update_fields=['prediction_count', 'last_prediction_at'])
    
    return Response({
        'model_id': model_id,
        'predictions': predictions,
        'total_predictions': len(predictions),
        'batch_processed_at': timezone.now()
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_insights(request):
    """Generate AI insights from campaign data."""
    
    campaign_id = request.data.get('campaign_id')
    data_sources = request.data.get('data_sources', ['voters', 'campaigns', 'territories'])
    
    # Simulate AI insight generation
    insights = [
        {
            'type': 'trend',
            'title': 'Voter Registration Trend',
            'description': 'Voter registration has increased by 15% in the past month',
            'confidence': 0.89,
            'impact': 'high',
            'recommendation': 'Continue current outreach efforts in high-growth areas'
        },
        {
            'type': 'demographic',
            'title': 'Age Group Analysis',
            'description': 'Voters aged 25-34 show highest engagement rates',
            'confidence': 0.76,
            'impact': 'medium',
            'recommendation': 'Focus digital campaigns on this demographic'
        },
        {
            'type': 'geographic',
            'title': 'Territory Performance',
            'description': 'Northern precincts have 20% higher contact success rates',
            'confidence': 0.84,
            'impact': 'high',
            'recommendation': 'Apply northern precinct strategies to other areas'
        }
    ]
    
    return Response({
        'campaign_id': campaign_id,
        'insights': insights,
        'generated_at': timezone.now(),
        'data_sources_analyzed': data_sources
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_3d_model(request):
    """Generate 3D model (.usdz) from campaign data for visionOS."""
    
    campaign_id = request.data.get('campaign_id')
    data_type = request.data.get('data_type', 'geographic')  # 'geographic', 'demographic', 'turnout'
    zip_codes = request.data.get('zip_codes', [])
    
    if not campaign_id:
        return Response(
            {'error': 'campaign_id is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Generate 3D model data based on campaign information
        model_data = generate_campaign_3d_data(campaign_id, data_type, zip_codes)
        
        # Create USDZ file
        usdz_content = create_usdz_file(model_data)
        
        # Create a temporary file to serve the USDZ
        with tempfile.NamedTemporaryFile(delete=False, suffix='.usdz') as temp_file:
            temp_file.write(usdz_content)
            temp_file_path = temp_file.name
        
        def cleanup_temp_file():
            """Clean up temporary file after response"""
            try:
                os.unlink(temp_file_path)
            except:
                pass
        
        # Create response with USDZ file
        response = FileResponse(
            open(temp_file_path, 'rb'),
            content_type='model/vnd.usdz+zip',
            as_attachment=True,
            filename=f'campaign_{campaign_id}_{data_type}_3d_model.usdz'
        )
        
        # Set headers for visionOS compatibility
        response['X-Model-Type'] = data_type
        response['X-Campaign-ID'] = campaign_id
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        
        # Schedule cleanup (in production, use a proper cleanup mechanism)
        # For now, we'll rely on OS temp file cleanup
        
        return response
        
    except Exception as e:
        logger.error(f"3D model generation failed: {str(e)}")
        return Response({
            'error': f'Failed to generate 3D model: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def generate_campaign_3d_data(campaign_id, data_type, zip_codes):
    """Generate 3D visualization data from campaign information."""
    
    # Simulate campaign data retrieval
    # In real implementation, query actual database for campaign data
    
    if data_type == 'geographic':
        # Generate geographic 3D data (voter density by location)
        return {
            'type': 'geographic_heatmap',
            'regions': [
                {'zip_code': '10001', 'voter_count': 1250, 'lat': 40.7505, 'lng': -73.9934, 'height': 1.25},
                {'zip_code': '10002', 'voter_count': 980, 'lat': 40.7156, 'lng': -73.9877, 'height': 0.98},
                {'zip_code': '10003', 'voter_count': 1580, 'lat': 40.7316, 'lng': -73.9891, 'height': 1.58},
                {'zip_code': '10004', 'voter_count': 760, 'lat': 40.7047, 'lng': -74.0142, 'height': 0.76},
                {'zip_code': '10005', 'voter_count': 1120, 'lat': 40.7062, 'lng': -74.0087, 'height': 1.12},
            ],
            'scale_factor': 0.001,  # Scale for 3D height representation
            'center': {'lat': 40.7282, 'lng': -73.9942},
            'bounds': {'north': 40.7505, 'south': 40.7047, 'east': -73.9877, 'west': -74.0142}
        }
    
    elif data_type == 'demographic':
        # Generate demographic 3D data (age/party distribution)
        return {
            'type': 'demographic_bars',
            'categories': [
                {'name': 'Age 18-25', 'value': 2340, 'color': '#FF6B6B', 'position': [0, 0, 0]},
                {'name': 'Age 26-35', 'value': 3120, 'color': '#4ECDC4', 'position': [2, 0, 0]},
                {'name': 'Age 36-50', 'value': 2890, 'color': '#45B7D1', 'position': [4, 0, 0]},
                {'name': 'Age 51-65', 'value': 2150, 'color': '#96CEB4', 'position': [6, 0, 0]},
                {'name': 'Age 65+', 'value': 1680, 'color': '#FFEAA7', 'position': [8, 0, 0]},
            ],
            'scale_factor': 0.001,
            'max_height': 5.0
        }
    
    elif data_type == 'turnout':
        # Generate turnout prediction 3D data
        return {
            'type': 'turnout_prediction',
            'precincts': [
                {'id': 'P001', 'predicted_turnout': 0.78, 'confidence': 0.85, 'position': [0, 0, 0], 'color': '#00C851'},
                {'id': 'P002', 'predicted_turnout': 0.65, 'confidence': 0.72, 'position': [3, 0, 0], 'color': '#ffbb33'},
                {'id': 'P003', 'predicted_turnout': 0.82, 'confidence': 0.91, 'position': [6, 0, 0], 'color': '#00C851'},
                {'id': 'P004', 'predicted_turnout': 0.58, 'confidence': 0.68, 'position': [9, 0, 0], 'color': '#FF4444'},
                {'id': 'P005', 'predicted_turnout': 0.71, 'confidence': 0.79, 'position': [12, 0, 0], 'color': '#ffbb33'},
            ],
            'scale_factor': 5.0,  # Scale turnout percentage to 3D height
        }
    
    else:
        # Default visualization
        return {
            'type': 'generic_bars',
            'data': [
                {'name': 'Category A', 'value': 100, 'position': [0, 0, 0], 'color': '#4285F4'},
                {'name': 'Category B', 'value': 150, 'position': [2, 0, 0], 'color': '#34A853'},
                {'name': 'Category C', 'value': 120, 'position': [4, 0, 0], 'color': '#FBBC05'},
            ],
            'scale_factor': 0.01
        }


def create_usdz_file(model_data):
    """Create USDZ file content from 3D model data."""
    
    # For simplicity, we'll create a basic USDZ structure
    # In a real implementation, you would use USD Python API or similar
    
    model_type = model_data.get('type', 'generic_bars')
    
    # Basic USD scene structure
    usd_content = """#usda 1.0
(
    defaultPrim = "CampaignVisualization"
    metersPerUnit = 1
    upAxis = "Y"
)

def Xform "CampaignVisualization" (
    customData = {
        bool preliminary_collidesWithEnvironment = 0
    }
)
{
"""
    
    if model_type == 'geographic_heatmap':
        # Generate geographic 3D visualization
        regions = model_data.get('regions', [])
        scale_factor = model_data.get('scale_factor', 0.001)
        
        for i, region in enumerate(regions):
            height = region.get('height', 1.0) * scale_factor * 10  # Scale up for visibility
            x_pos = (region.get('lng', 0) + 74.0) * 100  # Normalize longitude
            z_pos = (region.get('lat', 0) - 40.7) * 100   # Normalize latitude
            
            usd_content += f"""
    def Cube "Region_{i}" (
        prepend apiSchemas = ["MaterialBindingAPI"]
    )
    {{
        float3[] extent = [(-0.5, 0, -0.5), (0.5, {height}, 0.5)]
        double3 xformOp:translate = ({x_pos}, 0, {z_pos})
        double3 xformOp:scale = (1, {height}, 1)
        uniform token[] xformOpOrder = ["xformOp:translate", "xformOp:scale"]
        
        rel material:binding = </CampaignVisualization/Materials/RegionMaterial_{i}>
    }}
"""
    
    elif model_type == 'demographic_bars':
        # Generate demographic bar chart
        categories = model_data.get('categories', [])
        scale_factor = model_data.get('scale_factor', 0.001)
        max_height = model_data.get('max_height', 5.0)
        
        for i, category in enumerate(categories):
            height = (category.get('value', 0) * scale_factor) * max_height
            position = category.get('position', [i * 2, 0, 0])
            
            usd_content += f"""
    def Cube "Category_{i}" (
        prepend apiSchemas = ["MaterialBindingAPI"]
    )
    {{
        float3[] extent = [(-0.4, 0, -0.4), (0.4, {height}, 0.4)]
        double3 xformOp:translate = ({position[0]}, 0, {position[2]})
        double3 xformOp:scale = (0.8, {height}, 0.8)
        uniform token[] xformOpOrder = ["xformOp:translate", "xformOp:scale"]
        
        rel material:binding = </CampaignVisualization/Materials/CategoryMaterial_{i}>
    }}
"""
    
    elif model_type == 'turnout_prediction':
        # Generate turnout prediction visualization
        precincts = model_data.get('precincts', [])
        scale_factor = model_data.get('scale_factor', 5.0)
        
        for i, precinct in enumerate(precincts):
            height = precinct.get('predicted_turnout', 0.5) * scale_factor
            confidence = precinct.get('confidence', 0.5)
            position = precinct.get('position', [i * 3, 0, 0])
            
            # Vary opacity based on confidence
            opacity = 0.4 + (confidence * 0.6)
            
            usd_content += f"""
    def Cylinder "Precinct_{i}" (
        prepend apiSchemas = ["MaterialBindingAPI"]
    )
    {{
        float3[] extent = [(-0.5, 0, -0.5), (0.5, {height}, 0.5)]
        double height = {height}
        double radius = 0.5
        double3 xformOp:translate = ({position[0]}, 0, {position[2]})
        uniform token[] xformOpOrder = ["xformOp:translate"]
        
        rel material:binding = </CampaignVisualization/Materials/PrecinctMaterial_{i}>
    }}
"""
    
    # Close the main xform
    usd_content += """
}

def Scope "Materials"
{
"""
    
    # Add materials for each object
    if model_type == 'geographic_heatmap':
        regions = model_data.get('regions', [])
        for i, region in enumerate(regions):
            # Color based on voter density
            intensity = min(region.get('voter_count', 500) / 1500.0, 1.0)
            red = intensity
            green = 1.0 - intensity
            blue = 0.2
            
            usd_content += f"""
    def Material "RegionMaterial_{i}"
    {{
        token outputs:surface.connect = </CampaignVisualization/Materials/RegionMaterial_{i}/PBRShader.outputs:surface>
        
        def Shader "PBRShader"
        {{
            uniform token info:id = "UsdPreviewSurface"
            color3f inputs:diffuseColor = ({red}, {green}, {blue})
            float inputs:metallic = 0.1
            float inputs:roughness = 0.4
            token outputs:surface
        }}
    }}
"""
    
    elif model_type == 'demographic_bars':
        categories = model_data.get('categories', [])
        for i, category in enumerate(categories):
            color = category.get('color', '#4285F4')
            # Convert hex color to RGB
            r = int(color[1:3], 16) / 255.0
            g = int(color[3:5], 16) / 255.0
            b = int(color[5:7], 16) / 255.0
            
            usd_content += f"""
    def Material "CategoryMaterial_{i}"
    {{
        token outputs:surface.connect = </CampaignVisualization/Materials/CategoryMaterial_{i}/PBRShader.outputs:surface>
        
        def Shader "PBRShader"
        {{
            uniform token info:id = "UsdPreviewSurface"
            color3f inputs:diffuseColor = ({r}, {g}, {b})
            float inputs:metallic = 0.2
            float inputs:roughness = 0.3
            token outputs:surface
        }}
    }}
"""
    
    elif model_type == 'turnout_prediction':
        precincts = model_data.get('precincts', [])
        for i, precinct in enumerate(precincts):
            color = precinct.get('color', '#4285F4')
            # Convert hex color to RGB
            r = int(color[1:3], 16) / 255.0
            g = int(color[3:5], 16) / 255.0
            b = int(color[5:7], 16) / 255.0
            opacity = 0.4 + (precinct.get('confidence', 0.5) * 0.6)
            
            usd_content += f"""
    def Material "PrecinctMaterial_{i}"
    {{
        token outputs:surface.connect = </CampaignVisualization/Materials/PrecinctMaterial_{i}/PBRShader.outputs:surface>
        
        def Shader "PBRShader"
        {{
            uniform token info:id = "UsdPreviewSurface"
            color3f inputs:diffuseColor = ({r}, {g}, {b})
            float inputs:opacity = {opacity}
            float inputs:metallic = 0.1
            float inputs:roughness = 0.5
            token outputs:surface
        }}
    }}
"""
    
    # Close materials scope
    usd_content += """
}
"""
    
    # Convert to binary USDZ (simplified - in production use proper USD tools)
    # For now, we'll return the USD text content as bytes
    # A real implementation would use USD Python API to create proper USDZ
    
    return usd_content.encode('utf-8')
