from django.db import models
from django.contrib.auth import get_user_model
from simple_history.models import HistoricalRecords
import uuid
import json

User = get_user_model()


class AnalyticsQuery(models.Model):
    """Natural language queries for analytics."""
    
    QUERY_TYPE_CHOICES = [
        ('voter_analysis', 'Voter Analysis'),
        ('campaign_performance', 'Campaign Performance'),
        ('geographic_analysis', 'Geographic Analysis'),
        ('demographic_analysis', 'Demographic Analysis'),
        ('turnout_prediction', 'Turnout Prediction'),
        ('custom', 'Custom Query'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Query input
    natural_language_query = models.TextField(help_text="User's natural language query")
    query_type = models.CharField(max_length=50, choices=QUERY_TYPE_CHOICES)
    
    # Query processing
    parsed_intent = models.JSONField(default=dict, help_text="Parsed query intent and parameters")
    generated_sql = models.TextField(blank=True, help_text="Generated SQL query")
    generated_filters = models.JSONField(default=dict, help_text="Generated filter parameters")
    
    # Context
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='analytics_queries')
    campaign_id = models.UUIDField(null=True, blank=True)
    session_id = models.CharField(max_length=100, blank=True, help_text="Analytics session identifier")
    
    # Processing status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    processing_started_at = models.DateTimeField(null=True, blank=True)
    processing_completed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    
    # Results
    result_data = models.JSONField(default=dict, help_text="Query results and metrics")
    chart_config = models.JSONField(default=dict, help_text="Chart configuration for visualization")
    insights = models.JSONField(default=list, help_text="AI-generated insights")
    
    # Performance metrics
    execution_time_ms = models.IntegerField(null=True, blank=True)
    result_count = models.IntegerField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Audit logging
    history = HistoricalRecords()

    class Meta:
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['query_type']),
            models.Index(fields=['status']),
            models.Index(fields=['campaign_id']),
            models.Index(fields=['session_id']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"Query: {self.natural_language_query[:50]}..." if len(self.natural_language_query) > 50 else self.natural_language_query


class AnalyticsDashboard(models.Model):
    """Customizable analytics dashboards."""
    
    DASHBOARD_TYPE_CHOICES = [
        ('campaign_overview', 'Campaign Overview'),
        ('voter_engagement', 'Voter Engagement'),
        ('geographic_insights', 'Geographic Insights'),
        ('performance_metrics', 'Performance Metrics'),
        ('predictive_analytics', 'Predictive Analytics'),
        ('custom', 'Custom Dashboard'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    dashboard_type = models.CharField(max_length=50, choices=DASHBOARD_TYPE_CHOICES)
    description = models.TextField(blank=True)
    
    # Dashboard configuration
    widgets = models.JSONField(default=list, help_text="List of widget configurations")
    layout = models.JSONField(default=dict, help_text="Dashboard layout configuration")
    filters = models.JSONField(default=dict, help_text="Default dashboard filters")
    
    # Access control
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_dashboards')
    shared_with = models.ManyToManyField(User, blank=True, related_name='shared_dashboards')
    is_public = models.BooleanField(default=False)
    
    # Context
    campaign_id = models.UUIDField(null=True, blank=True)
    
    # Metadata
    is_active = models.BooleanField(default=True)
    refresh_interval_minutes = models.IntegerField(default=60, help_text="Auto-refresh interval")
    last_refreshed_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Audit logging
    history = HistoricalRecords()

    class Meta:
        indexes = [
            models.Index(fields=['dashboard_type']),
            models.Index(fields=['created_by']),
            models.Index(fields=['campaign_id']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"Dashboard: {self.name}"


class AnalyticsWidget(models.Model):
    """Individual widgets for analytics dashboards."""
    
    WIDGET_TYPE_CHOICES = [
        ('bar_chart', 'Bar Chart'),
        ('line_chart', 'Line Chart'),
        ('pie_chart', 'Pie Chart'),
        ('scatter_plot', 'Scatter Plot'),
        ('map', 'Map Visualization'),
        ('table', 'Data Table'),
        ('metric', 'Single Metric'),
        ('gauge', 'Gauge Chart'),
        ('heatmap', 'Heatmap'),
        ('custom', 'Custom Widget'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dashboard = models.ForeignKey(AnalyticsDashboard, on_delete=models.CASCADE, related_name='dashboard_widgets')
    
    # Widget configuration
    widget_type = models.CharField(max_length=50, choices=WIDGET_TYPE_CHOICES)
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    # Data source
    data_source = models.CharField(max_length=100, help_text="Data source identifier")
    query_config = models.JSONField(default=dict, help_text="Query configuration for data fetching")
    
    # Visualization config
    chart_config = models.JSONField(default=dict, help_text="Chart.js or similar configuration")
    display_options = models.JSONField(default=dict, help_text="Display and styling options")
    
    # Layout
    position_x = models.IntegerField(default=0)
    position_y = models.IntegerField(default=0)
    width = models.IntegerField(default=4, help_text="Grid width units")
    height = models.IntegerField(default=3, help_text="Grid height units")
    
    # Data and caching
    cached_data = models.JSONField(default=dict, help_text="Cached widget data")
    last_updated = models.DateTimeField(null=True, blank=True)
    refresh_interval_minutes = models.IntegerField(default=30)
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['dashboard']),
            models.Index(fields=['widget_type']),
            models.Index(fields=['is_active']),
        ]
        ordering = ['position_y', 'position_x']

    def __str__(self):
        return f"{self.dashboard.name} - {self.title}"


class PredictiveModel(models.Model):
    """Machine learning models for predictive analytics."""
    
    MODEL_TYPE_CHOICES = [
        ('turnout_prediction', 'Turnout Prediction'),
        ('voter_preference', 'Voter Preference'),
        ('churn_prediction', 'Volunteer Churn'),
        ('engagement_score', 'Engagement Scoring'),
        ('demographic_clustering', 'Demographic Clustering'),
        ('custom', 'Custom Model'),
    ]
    
    STATUS_CHOICES = [
        ('training', 'Training'),
        ('active', 'Active'),
        ('outdated', 'Outdated'),
        ('deprecated', 'Deprecated'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    model_type = models.CharField(max_length=50, choices=MODEL_TYPE_CHOICES)
    description = models.TextField(blank=True)
    
    # Model configuration
    algorithm = models.CharField(max_length=100, help_text="ML algorithm used")
    features = models.JSONField(default=list, help_text="Input features")
    hyperparameters = models.JSONField(default=dict, help_text="Model hyperparameters")
    
    # Training data
    training_dataset = models.CharField(max_length=200, help_text="Training dataset identifier")
    training_period_start = models.DateField(null=True, blank=True)
    training_period_end = models.DateField(null=True, blank=True)
    
    # Model performance
    accuracy_score = models.FloatField(null=True, blank=True)
    precision_score = models.FloatField(null=True, blank=True)
    recall_score = models.FloatField(null=True, blank=True)
    f1_score = models.FloatField(null=True, blank=True)
    performance_metrics = models.JSONField(default=dict, help_text="Additional performance metrics")
    
    # Model deployment
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='training')
    model_file_path = models.CharField(max_length=500, blank=True, help_text="Path to serialized model")
    version = models.CharField(max_length=20, default='1.0')
    
    # Usage tracking
    prediction_count = models.IntegerField(default=0)
    last_prediction_at = models.DateTimeField(null=True, blank=True)
    
    # Ownership
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_models')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    trained_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['model_type']),
            models.Index(fields=['status']),
            models.Index(fields=['created_by']),
        ]

    def __str__(self):
        return f"Model: {self.name} v{self.version}"


class ModelPrediction(models.Model):
    """Individual predictions from ML models."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    model = models.ForeignKey(PredictiveModel, on_delete=models.CASCADE, related_name='predictions')
    
    # Input data
    input_features = models.JSONField(default=dict, help_text="Input feature values")
    target_id = models.UUIDField(help_text="ID of entity being predicted (voter, volunteer, etc.)")
    
    # Prediction results
    prediction_value = models.FloatField(help_text="Predicted value or probability")
    confidence_score = models.FloatField(null=True, blank=True, help_text="Prediction confidence")
    prediction_category = models.CharField(max_length=100, blank=True, help_text="Predicted category/class")
    
    # Context
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requested_predictions')
    campaign_id = models.UUIDField(null=True, blank=True)
    
    # Validation and feedback
    actual_value = models.FloatField(null=True, blank=True, help_text="Actual outcome for validation")
    is_correct = models.BooleanField(null=True, blank=True)
    feedback_notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    validated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['model']),
            models.Index(fields=['target_id']),
            models.Index(fields=['campaign_id']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"Prediction: {self.model.name} for {self.target_id}"


class AnalyticsSession(models.Model):
    """User analytics sessions for tracking usage patterns."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='analytics_sessions')
    session_id = models.CharField(max_length=100, unique=True)
    
    # Session data
    queries_count = models.IntegerField(default=0)
    dashboards_viewed = models.JSONField(default=list, help_text="List of dashboard IDs viewed")
    widgets_interacted = models.JSONField(default=list, help_text="List of widget interactions")
    
    # Context
    campaign_id = models.UUIDField(null=True, blank=True)
    device_info = models.JSONField(default=dict, help_text="Device and browser information")
    
    # Session timing
    started_at = models.DateTimeField(auto_now_add=True)
    last_activity_at = models.DateTimeField(auto_now=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['campaign_id']),
            models.Index(fields=['started_at']),
        ]

    def __str__(self):
        return f"Analytics Session: {self.user.email} - {self.started_at}"
