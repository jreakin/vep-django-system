from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
import uuid

User = get_user_model()


class Dashboard(models.Model):
    """Dashboard configurations for users."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='dashboards')
    name = models.CharField(max_length=100)
    config = models.JSONField(default=dict)  # Dashboard layout, widgets, filters
    is_private = models.BooleanField(default=True)
    shared_with = models.ManyToManyField(User, blank=True, related_name='shared_dashboards')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.user.email}"


class AuditLog(models.Model):
    """System-wide audit logging for all model changes."""
    
    ACTION_CHOICES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('view', 'View'),
        ('export', 'Export'),
        ('import', 'Import'),
        ('login', 'Login'),
        ('logout', 'Logout'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    
    # Generic foreign key to any model
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.CharField(max_length=255, null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Store changes as JSON
    changes = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['action', 'timestamp']),
        ]
    
    def __str__(self):
        user_info = f"{self.user.phone_number}" if self.user else "Anonymous"
        return f"{user_info} - {self.get_action_display()} - {self.timestamp}"


class Notification(models.Model):
    """Real-time notifications for users."""
    
    TYPE_CHOICES = [
        ('info', 'Information'),
        ('success', 'Success'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('assignment', 'Assignment'),
        ('upload_complete', 'Upload Complete'),
        ('system', 'System'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='info')
    
    # Optional link to related object
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.CharField(max_length=255, null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Notification state
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Optional action data
    action_url = models.URLField(blank=True)
    action_data = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['recipient', 'created_at']),
            models.Index(fields=['notification_type']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.recipient.phone_number}"


class ChartConfig(models.Model):
    """Configuration for analytics charts and visualizations."""
    
    CHART_TYPE_CHOICES = [
        ('bar', 'Bar Chart'),
        ('line', 'Line Chart'), 
        ('pie', 'Pie Chart'),
        ('scatter', 'Scatter Plot'),
        ('map', 'Geographic Map'),
        ('table', 'Data Table'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chart_configs')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Chart configuration
    chart_type = models.CharField(max_length=20, choices=CHART_TYPE_CHOICES)
    data_source = models.CharField(max_length=100)  # Model name or endpoint
    query_config = models.JSONField(default=dict)  # Filters, aggregations, etc.
    display_config = models.JSONField(default=dict)  # Chart.js config, styling
    
    # Sharing and permissions
    is_public = models.BooleanField(default=False)
    shared_with = models.ManyToManyField(User, blank=True, related_name='shared_charts')
    
    # Dashboard integration
    dashboards = models.ManyToManyField(Dashboard, blank=True, related_name='charts')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['user', 'chart_type']),
            models.Index(fields=['data_source']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_chart_type_display()})"


class FileUpload(models.Model):
    """Track file upload status and processing."""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    FILE_TYPE_CHOICES = [
        ('voter_data', 'Voter Data'),
        ('walklist', 'Walk List'),
        ('geographic', 'Geographic Data'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='file_uploads')
    original_filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=20, choices=FILE_TYPE_CHOICES)
    file_path = models.CharField(max_length=500)
    file_size = models.BigIntegerField()
    
    # Processing status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    progress_percent = models.IntegerField(default=0)
    error_message = models.TextField(blank=True)
    
    # Processing results
    records_total = models.IntegerField(default=0)
    records_processed = models.IntegerField(default=0)
    records_created = models.IntegerField(default=0)
    records_updated = models.IntegerField(default=0)
    records_duplicates = models.IntegerField(default=0)
    records_errors = models.IntegerField(default=0)
    
    processing_log = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['file_type', 'status']),
        ]
    
    def __str__(self):
        return f"{self.original_filename} - {self.get_status_display()}"
