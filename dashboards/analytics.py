"""
Analytics service with NLP-driven chart generation using Pydantic AI.
"""
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field
from django.db.models import Q, Count, Avg, Sum, Max, Min
from django.contrib.auth import get_user_model
from voter_data.models import VoterRecord, VoterEngagement, Election, ElectionData
from dashboards.models import ChartConfig, Notification
import json
import pandas as pd
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


class ChartDataPoint(BaseModel):
    """Single data point for a chart."""
    x: Any = Field(description="X-axis value")
    y: Any = Field(description="Y-axis value")
    label: Optional[str] = Field(None, description="Optional label")
    color: Optional[str] = Field(None, description="Optional color")


class ChartData(BaseModel):
    """Chart data structure."""
    chart_type: str = Field(description="Type of chart (bar, line, pie, map, table)")
    title: str = Field(description="Chart title")
    data: List[ChartDataPoint] = Field(description="Chart data points")
    x_axis_label: Optional[str] = Field(None, description="X-axis label")
    y_axis_label: Optional[str] = Field(None, description="Y-axis label")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


class QueryConfig(BaseModel):
    """Configuration for data queries."""
    model: str = Field(description="Django model name")
    filters: Dict[str, Any] = Field(default_factory=dict, description="Query filters")
    group_by: Optional[str] = Field(None, description="Field to group by")
    aggregate: Optional[str] = Field(None, description="Aggregation type (count, sum, avg, max, min)")
    aggregate_field: Optional[str] = Field(None, description="Field to aggregate")
    time_field: Optional[str] = Field(None, description="Field for time-based queries")
    time_range: Optional[str] = Field(None, description="Time range (7d, 30d, 1y, etc)")
    limit: Optional[int] = Field(100, description="Result limit")


class AnalyticsService:
    """Service for generating analytics and visualizations."""
    
    def __init__(self):
        self.model_mapping = {
            'voter': VoterRecord,
            'voters': VoterRecord,
            'voterrecord': VoterRecord,
            'engagement': VoterEngagement,
            'engagements': VoterEngagement,
            'election': Election,
            'elections': Election,
            'electiondata': ElectionData,
        }
    
    def generate_chart_from_query(self, user: User, query_config: QueryConfig) -> ChartData:
        """Generate chart data from a query configuration."""
        
        # Get the model
        model_class = self.model_mapping.get(query_config.model.lower())
        if not model_class:
            raise ValueError(f"Unknown model: {query_config.model}")
        
        # Build queryset
        queryset = self._build_queryset(model_class, user, query_config)
        
        # Execute query and format data
        if query_config.group_by:
            data_points = self._execute_grouped_query(queryset, query_config)
        else:
            data_points = self._execute_simple_query(queryset, query_config)
        
        # Determine chart type if not specified
        chart_type = self._suggest_chart_type(query_config, data_points)
        
        # Generate title
        title = self._generate_title(query_config, len(data_points))
        
        return ChartData(
            chart_type=chart_type,
            title=title,
            data=data_points,
            x_axis_label=query_config.group_by or "Categories",
            y_axis_label=query_config.aggregate or "Count",
            metadata={
                "query_config": query_config.model_dump(),
                "total_records": len(data_points)
            }
        )
    
    def _validate_and_sanitize_filters(self, model_class, filters: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and sanitize filters for the given model class."""
        sanitized_filters = {}
        model_fields = {field.name: field for field in model_class._meta.get_fields()}
        
        for field, value in filters.items():
            if field not in model_fields:
                raise ValueError(f"Invalid filter field: {field}")
            
            # Optionally, add type checks or sanitization for `value` here
            sanitized_filters[field] = value
        
        return sanitized_filters
    
    def _build_queryset(self, model_class, user: User, query_config: QueryConfig):
        """Build Django queryset from query configuration."""
        
        # Start with base queryset
        if model_class == VoterRecord:
            queryset = model_class.objects.filter(account_owner=user)
        elif model_class == VoterEngagement:
            queryset = model_class.objects.filter(engaged_by=user)
        else:
            queryset = model_class.objects.all()
        
        # Apply filters
        for field, value in query_config.filters.items():
            if hasattr(model_class, field):
                queryset = queryset.filter(**{field: value})
        
        # Apply time range filter
        if query_config.time_field and query_config.time_range:
            time_filter = self._parse_time_range(query_config.time_range)
            if time_filter:
                queryset = queryset.filter(**{f"{query_config.time_field}__gte": time_filter})
        
        return queryset
    
    def _execute_grouped_query(self, queryset, query_config: QueryConfig) -> List[ChartDataPoint]:
        """Execute a grouped query with aggregation."""
        
        group_field = query_config.group_by
        
        # Handle aggregation
        if query_config.aggregate == 'count':
            results = queryset.values(group_field).annotate(value=Count('id'))
        elif query_config.aggregate == 'sum' and query_config.aggregate_field:
            results = queryset.values(group_field).annotate(value=Sum(query_config.aggregate_field))
        elif query_config.aggregate == 'avg' and query_config.aggregate_field:
            results = queryset.values(group_field).annotate(value=Avg(query_config.aggregate_field))
        elif query_config.aggregate == 'max' and query_config.aggregate_field:
            results = queryset.values(group_field).annotate(value=Max(query_config.aggregate_field))
        elif query_config.aggregate == 'min' and query_config.aggregate_field:
            results = queryset.values(group_field).annotate(value=Min(query_config.aggregate_field))
        else:
            # Default to count
            results = queryset.values(group_field).annotate(value=Count('id'))
        
        # Convert to data points
        data_points = []
        for result in results[:query_config.limit]:
            data_points.append(ChartDataPoint(
                x=str(result[group_field] or 'Unknown'),
                y=float(result['value'] or 0)
            ))
        
        return data_points
    
    def _execute_simple_query(self, queryset, query_config: QueryConfig) -> List[ChartDataPoint]:
        """Execute a simple query without grouping."""
        
        # For simple queries, we'll return basic count or aggregation
        if query_config.aggregate == 'count':
            count = queryset.count()
            return [ChartDataPoint(x="Total", y=count)]
        
        # For other aggregations, we need a field
        if query_config.aggregate_field:
            if query_config.aggregate == 'sum':
                value = queryset.aggregate(value=Sum(query_config.aggregate_field))['value'] or 0
            elif query_config.aggregate == 'avg':
                value = queryset.aggregate(value=Avg(query_config.aggregate_field))['value'] or 0
            elif query_config.aggregate == 'max':
                value = queryset.aggregate(value=Max(query_config.aggregate_field))['value'] or 0
            elif query_config.aggregate == 'min':
                value = queryset.aggregate(value=Min(query_config.aggregate_field))['value'] or 0
            else:
                value = queryset.count()
            
            return [ChartDataPoint(x=query_config.aggregate.title(), y=float(value))]
        
        # Default to count
        count = queryset.count()
        return [ChartDataPoint(x="Total", y=count)]
    
    def _suggest_chart_type(self, query_config: QueryConfig, data_points: List[ChartDataPoint]) -> str:
        """Suggest appropriate chart type based on data."""
        
        if len(data_points) == 1:
            return "pie"  # Single value - good for pie chart
        
        if query_config.group_by:
            if len(data_points) <= 10:
                return "bar"
            else:
                return "line"  # Too many categories for bar chart
        
        if query_config.time_field:
            return "line"  # Time series data
        
        return "bar"  # Default
    
    def _generate_title(self, query_config: QueryConfig, data_count: int) -> str:
        """Generate a descriptive title for the chart."""
        
        model_name = query_config.model.title()
        
        if query_config.group_by:
            title = f"{model_name} by {query_config.group_by.replace('_', ' ').title()}"
        else:
            title = f"{model_name} {query_config.aggregate or 'Count'}"
        
        if query_config.time_range:
            title += f" ({query_config.time_range})"
        
        return title
    
    def _parse_time_range(self, time_range: str) -> Optional[datetime]:
        """Parse time range string into datetime."""
        
        now = datetime.now()
        
        if time_range == '7d':
            return now - timedelta(days=7)
        elif time_range == '30d':
            return now - timedelta(days=30)
        elif time_range == '90d':
            return now - timedelta(days=90)
        elif time_range == '1y':
            return now - timedelta(days=365)
        elif time_range == '24h':
            return now - timedelta(hours=24)
        
        return None
    
    def generate_dashboard_summary(self, user: User) -> Dict[str, Any]:
        """Generate summary statistics for dashboard."""
        
        summary = {}
        
        # Voter statistics
        if user.role in ['state', 'county', 'campaign', 'owner']:
            voters = VoterRecord.objects.filter(account_owner=user)
            summary['voters'] = {
                'total': voters.count(),
                'recent': voters.filter(created_at__gte=datetime.now() - timedelta(days=7)).count(),
                'by_state': list(voters.values('residence_part_state').annotate(count=Count('id'))[:10]),
                'by_party': list(voters.values('voter_political_party').annotate(count=Count('id'))[:5])
            }
            
            # Engagement statistics
            engagements = VoterEngagement.objects.filter(engaged_by=user)
            summary['engagements'] = {
                'total': engagements.count(),
                'recent': engagements.filter(engagement_date__gte=datetime.now() - timedelta(days=7)).count(),
                'by_type': list(engagements.values('engagement_type').annotate(count=Count('id')))
            }
        
        # Notification statistics
        notifications = Notification.objects.filter(recipient=user)
        summary['notifications'] = {
            'total': notifications.count(),
            'unread': notifications.filter(is_read=False).count(),
            'recent': notifications.filter(created_at__gte=datetime.now() - timedelta(days=7)).count()
        }
        
        return summary
    
    def create_preset_charts(self, user: User) -> List[ChartConfig]:
        """Create preset chart configurations for common analytics."""
        
        preset_configs = []
        
        if user.role in ['state', 'county', 'campaign', 'owner']:
            # Voters by state
            preset_configs.append({
                'name': 'Voters by State',
                'description': 'Distribution of voters across states',
                'chart_type': 'bar',
                'data_source': 'voters',
                'query_config': {
                    'model': 'voters',
                    'group_by': 'residence_part_state',
                    'aggregate': 'count'
                }
            })
            
            # Voters by party affiliation
            preset_configs.append({
                'name': 'Voters by Party',
                'description': 'Distribution of voters by political party',
                'chart_type': 'pie',
                'data_source': 'voters',
                'query_config': {
                    'model': 'voters',
                    'group_by': 'voter_political_party',
                    'aggregate': 'count'
                }
            })
            
            # Recent voter registrations
            preset_configs.append({
                'name': 'Recent Voter Registrations',
                'description': 'New voter registrations over the last 30 days',
                'chart_type': 'line',
                'data_source': 'voters',
                'query_config': {
                    'model': 'voters',
                    'time_field': 'created_at',
                    'time_range': '30d',
                    'aggregate': 'count'
                }
            })
            
            # Engagement activities
            preset_configs.append({
                'name': 'Engagement Activities',
                'description': 'Voter engagement activities by type',
                'chart_type': 'bar',
                'data_source': 'engagements',
                'query_config': {
                    'model': 'engagements',
                    'group_by': 'engagement_type',
                    'aggregate': 'count'
                }
            })
        
        # Create ChartConfig objects
        created_charts = []
        for config in preset_configs:
            chart = ChartConfig.objects.create(
                user=user,
                **config
            )
            created_charts.append(chart)
        
        return created_charts


class SimpleNLPService:
    """Simple NLP service for parsing chart requests."""
    
    def __init__(self):
        self.intent_patterns = {
            'count': ['count', 'number of', 'how many', 'total'],
            'group_by': ['by', 'per', 'grouped by', 'breakdown', 'distribution'],
            'time': ['over time', 'trend', 'recent', 'last', 'past'],
            'compare': ['compare', 'vs', 'versus', 'difference'],
        }
        
        self.model_patterns = {
            'voters': ['voter', 'voters', 'people', 'individuals'],
            'engagements': ['engagement', 'engagements', 'contact', 'contacts'],
            'elections': ['election', 'elections', 'vote', 'votes'],
        }
        
        self.field_patterns = {
            'state': ['state', 'states'],
            'party': ['party', 'parties', 'political party', 'affiliation'],
            'city': ['city', 'cities'],
            'age': ['age', 'ages'],
            'engagement_type': ['type', 'method', 'contact type'],
        }
    
    def parse_query(self, text: str) -> QueryConfig:
        """Parse natural language query into QueryConfig."""
        
        text_lower = text.lower()
        
        # Detect model
        model = 'voters'  # default
        for model_key, patterns in self.model_patterns.items():
            if any(pattern in text_lower for pattern in patterns):
                model = model_key
                break
        
        # Detect intent and grouping
        group_by = None
        for field_key, patterns in self.field_patterns.items():
            if any(pattern in text_lower for pattern in patterns):
                if any(group_pattern in text_lower for group_pattern in self.intent_patterns['group_by']):
                    if model == 'voters':
                        if field_key == 'state':
                            group_by = 'residence_part_state'
                        elif field_key == 'party':
                            group_by = 'voter_political_party'
                        elif field_key == 'city':
                            group_by = 'residence_part_city'
                    elif model == 'engagements':
                        if field_key == 'engagement_type':
                            group_by = 'engagement_type'
                break
        
        # Detect aggregation
        aggregate = 'count'  # default
        
        # Detect time range
        time_range = None
        time_field = None
        if any(time_pattern in text_lower for time_pattern in self.intent_patterns['time']):
            if model == 'voters':
                time_field = 'created_at'
            elif model == 'engagements':
                time_field = 'engagement_date'
            
            if 'last week' in text_lower or '7 days' in text_lower:
                time_range = '7d'
            elif 'last month' in text_lower or '30 days' in text_lower:
                time_range = '30d'
            elif 'last year' in text_lower or '1 year' in text_lower:
                time_range = '1y'
        
        return QueryConfig(
            model=model,
            group_by=group_by,
            aggregate=aggregate,
            time_field=time_field,
            time_range=time_range
        )