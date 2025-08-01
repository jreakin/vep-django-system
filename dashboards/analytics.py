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


class ActionCommand(BaseModel):
    """Represents an action command parsed from natural language."""
    command_type: str = Field(description="Type of command (create, add, schedule, show)")
    entity_type: str = Field(description="Entity type (voter, list, email, broadcast)")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Command parameters")
    confidence: float = Field(default=0.0, description="Confidence score")


class SimpleNLPService:
    """Enhanced NLP service for parsing chart requests and action commands."""
    
    def __init__(self):
        self.intent_patterns = {
            'count': ['count', 'number of', 'how many', 'total'],
            'group_by': ['by', 'per', 'grouped by', 'breakdown', 'distribution'],
            'time': ['over time', 'trend', 'recent', 'last', 'past'],
            'compare': ['compare', 'vs', 'versus', 'difference'],
        }
        
        # Action command patterns
        self.action_patterns = {
            'create': ['create', 'make', 'build', 'generate', 'new'],
            'add': ['add', 'insert', 'register', 'include'],
            'schedule': ['schedule', 'plan', 'set up', 'arrange'],
            'show': ['show', 'display', 'list', 'view'],
            'update': ['update', 'modify', 'change', 'edit'],
            'delete': ['delete', 'remove', 'eliminate'],
        }
        
        self.entity_patterns = {
            'voter': ['voter', 'person', 'individual', 'constituent'],
            'contact_list': ['contact list', 'list', 'group', 'segment'],
            'email': ['email', 'message', 'communication'],
            'broadcast': ['broadcast', 'campaign', 'blast', 'mass email'],
            'volunteer': ['volunteer', 'supporter', 'activist'],
            'event': ['event', 'meeting', 'rally'],
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
    
    def is_action_command(self, text: str) -> bool:
        """Determine if the text is an action command or a chart query."""
        text_lower = text.lower()
        
        # Check for action verbs
        for action_type, patterns in self.action_patterns.items():
            if any(pattern in text_lower for pattern in patterns):
                return True
        
        return False
    
    def parse_action_command(self, text: str) -> ActionCommand:
        """Parse natural language into an action command."""
        text_lower = text.lower()
        
        # Detect command type
        command_type = None
        confidence = 0.0
        
        for action_type, patterns in self.action_patterns.items():
            matches = sum(1 for pattern in patterns if pattern in text_lower)
            if matches > 0:
                current_confidence = matches / len(patterns)
                if current_confidence > confidence:
                    command_type = action_type
                    confidence = current_confidence
        
        if not command_type:
            command_type = 'show'  # default
        
        # Detect entity type
        entity_type = None
        for entity, patterns in self.entity_patterns.items():
            if any(pattern in text_lower for pattern in patterns):
                entity_type = entity
                break
        
        if not entity_type:
            entity_type = 'voter'  # default
        
        # Extract parameters based on command and entity type
        parameters = self._extract_parameters(text_lower, command_type, entity_type)
        
        return ActionCommand(
            command_type=command_type,
            entity_type=entity_type,
            parameters=parameters,
            confidence=confidence
        )
    
    def _extract_parameters(self, text: str, command_type: str, entity_type: str) -> Dict[str, Any]:
        """Extract parameters from the command text."""
        parameters = {}
        
        # Extract common patterns
        import re
        
        # Extract names in quotes
        name_matches = re.findall(r"['\"]([^'\"]+)['\"]", text)
        if name_matches:
            parameters['name'] = name_matches[0]
        
        # Extract phone numbers
        phone_matches = re.findall(r'(\d{3}[-.]?\d{3}[-.]?\d{4})', text)
        if phone_matches:
            parameters['phone'] = phone_matches[0]
        
        # Extract email addresses
        email_matches = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
        if email_matches:
            parameters['email'] = email_matches[0]
        
        # Extract ages and age ranges
        age_matches = re.findall(r'under (\d+)|age (\d+)|(\d+) years old|(\d+)-(\d+) years', text)
        if age_matches:
            for match in age_matches:
                if match[0]:  # under X
                    parameters['age_max'] = int(match[0])
                elif match[1]:  # age X
                    parameters['age'] = int(match[1])
                elif match[2]:  # X years old
                    parameters['age'] = int(match[2])
                elif match[3] and match[4]:  # X-Y years
                    parameters['age_min'] = int(match[3])
                    parameters['age_max'] = int(match[4])
        
        # Extract locations
        locations = []
        us_states = ['alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 
                    'connecticut', 'delaware', 'florida', 'georgia', 'hawaii', 'idaho', 
                    'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana', 
                    'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota', 
                    'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 
                    'new hampshire', 'new jersey', 'new mexico', 'new york', 
                    'north carolina', 'north dakota', 'ohio', 'oklahoma', 'oregon', 
                    'pennsylvania', 'rhode island', 'south carolina', 'south dakota', 
                    'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington', 
                    'west virginia', 'wisconsin', 'wyoming']
        
        for state in us_states:
            if state in text:
                parameters['state'] = state.title()
                break
        
        # Extract common city names
        city_patterns = re.findall(r'in ([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)', text)
        if city_patterns:
            city = city_patterns[0]
            if city.lower() not in us_states:  # Don't confuse cities with states
                parameters['city'] = city
        
        # Extract time expressions for scheduling
        time_patterns = {
            'tomorrow': {'days': 1},
            'next week': {'weeks': 1},
            'next month': {'months': 1},
            'in 1 hour': {'hours': 1},
            'in 2 hours': {'hours': 2},
        }
        
        for pattern, delta in time_patterns.items():
            if pattern in text:
                from datetime import datetime, timedelta
                base_time = datetime.now()
                if 'days' in delta:
                    target_time = base_time + timedelta(days=delta['days'])
                elif 'weeks' in delta:
                    target_time = base_time + timedelta(weeks=delta['weeks'])
                elif 'hours' in delta:
                    target_time = base_time + timedelta(hours=delta['hours'])
                elif 'months' in delta:
                    target_time = base_time + timedelta(days=delta['months'] * 30)
                
                parameters['scheduled_time'] = target_time.isoformat()
                break
        
        # Extract specific times (e.g., "at 10 AM")
        time_matches = re.findall(r'at (\d{1,2})(?::(\d{2}))?\s*(am|pm)', text.lower())
        if time_matches:
            hour, minute, period = time_matches[0]
            hour = int(hour)
            minute = int(minute) if minute else 0
            
            if period == 'pm' and hour != 12:
                hour += 12
            elif period == 'am' and hour == 12:
                hour = 0
            
            parameters['scheduled_hour'] = hour
            parameters['scheduled_minute'] = minute
        
        return parameters
    
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