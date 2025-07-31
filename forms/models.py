from django.db import models
from django.contrib.auth import get_user_model
from simple_history.models import HistoricalRecords
import uuid
import json

User = get_user_model()


class FormTemplate(models.Model):
    """Dynamic form template definition."""
    
    FORM_TYPE_CHOICES = [
        ('survey', 'Survey'),
        ('registration', 'Registration'),
        ('petition', 'Petition'),
        ('volunteer_signup', 'Volunteer Signup'),
        ('event_rsvp', 'Event RSVP'),
        ('feedback', 'Feedback'),
        ('custom', 'Custom'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('archived', 'Archived'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    form_type = models.CharField(max_length=50, choices=FORM_TYPE_CHOICES)
    description = models.TextField(blank=True)
    
    # Form configuration
    fields = models.JSONField(default=list, help_text="List of field definitions")
    validation_rules = models.JSONField(default=dict, help_text="Form-level validation rules")
    styling = models.JSONField(default=dict, help_text="Form styling and layout configuration")
    
    # Access control
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_forms')
    shared_with = models.ManyToManyField(User, blank=True, related_name='shared_forms')
    is_public = models.BooleanField(default=False)
    requires_login = models.BooleanField(default=True)
    
    # Campaign/context linking
    campaign_id = models.UUIDField(null=True, blank=True)
    walk_list_ids = models.JSONField(default=list, blank=True, help_text="Associated walk lists")
    
    # Status and metadata
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    version = models.IntegerField(default=1)
    is_current_version = models.BooleanField(default=True)
    parent_form = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='versions')
    
    # Tracking
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)
    
    # Audit logging
    history = HistoricalRecords()

    class Meta:
        indexes = [
            models.Index(fields=['form_type']),
            models.Index(fields=['campaign_id']),
            models.Index(fields=['created_by']),
            models.Index(fields=['status']),
            models.Index(fields=['is_current_version']),
        ]

    def __str__(self):
        return f"{self.name} v{self.version}"


class FormField(models.Model):
    """Individual field definition for dynamic forms."""
    
    FIELD_TYPE_CHOICES = [
        ('text', 'Text Input'),
        ('textarea', 'Text Area'),
        ('email', 'Email'),
        ('phone', 'Phone Number'),
        ('number', 'Number'),
        ('date', 'Date'),
        ('time', 'Time'),
        ('datetime', 'Date & Time'),
        ('select', 'Dropdown'),
        ('radio', 'Radio Buttons'),
        ('checkbox', 'Checkboxes'),
        ('boolean', 'Yes/No'),
        ('file', 'File Upload'),
        ('signature', 'Digital Signature'),
        ('rating', 'Rating Scale'),
        ('location', 'Location Picker'),
        ('hidden', 'Hidden Field'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    form_template = models.ForeignKey(FormTemplate, on_delete=models.CASCADE, related_name='form_fields')
    
    # Field definition
    field_name = models.CharField(max_length=100, help_text="Unique field identifier")
    field_type = models.CharField(max_length=50, choices=FIELD_TYPE_CHOICES)
    label = models.CharField(max_length=200)
    placeholder = models.CharField(max_length=200, blank=True)
    help_text = models.TextField(blank=True)
    
    # Field configuration
    is_required = models.BooleanField(default=False)
    default_value = models.TextField(blank=True)
    options = models.JSONField(default=list, help_text="Options for select/radio/checkbox fields")
    validation_rules = models.JSONField(default=dict, help_text="Field-specific validation")
    
    # Layout and behavior
    order = models.IntegerField(default=0)
    width = models.CharField(max_length=20, default='full', help_text="Field width: full, half, third")
    is_conditional = models.BooleanField(default=False)
    show_condition = models.JSONField(default=dict, help_text="Conditions for showing this field")
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['form_template', 'field_name']
        ordering = ['order', 'created_at']
        indexes = [
            models.Index(fields=['form_template', 'order']),
            models.Index(fields=['field_type']),
        ]

    def __str__(self):
        return f"{self.form_template.name} - {self.label}"


class FormResponse(models.Model):
    """Individual form submission/response."""
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    form_template = models.ForeignKey(FormTemplate, on_delete=models.CASCADE, related_name='responses')
    
    # Response data
    response_data = models.JSONField(default=dict, help_text="Field_name -> value mapping")
    metadata = models.JSONField(default=dict, help_text="Submission metadata (IP, user agent, etc.)")
    
    # Context linking
    submitted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='form_responses')
    voter_id = models.UUIDField(null=True, blank=True, help_text="Associated voter record")
    walk_list_id = models.UUIDField(null=True, blank=True, help_text="Associated walk list")
    session_id = models.CharField(max_length=100, blank=True, help_text="Anonymous session tracking")
    
    # Location data (for mobile canvassing)
    submission_location = models.JSONField(default=dict, help_text="GPS coordinates and accuracy")
    is_gps_verified = models.BooleanField(default=False)
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='submitted')
    submitted_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    # Audit logging
    history = HistoricalRecords()

    class Meta:
        indexes = [
            models.Index(fields=['form_template']),
            models.Index(fields=['submitted_by']),
            models.Index(fields=['voter_id']),
            models.Index(fields=['walk_list_id']),
            models.Index(fields=['status']),
            models.Index(fields=['submitted_at']),
        ]

    def __str__(self):
        submitter = self.submitted_by.email if self.submitted_by else self.session_id or 'Anonymous'
        return f"{self.form_template.name} - {submitter}"


class FormShare(models.Model):
    """Shareable form links with access control."""
    
    ACCESS_TYPE_CHOICES = [
        ('public', 'Public Access'),
        ('link_only', 'Link Only'),
        ('password', 'Password Protected'),
        ('login_required', 'Login Required'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    form_template = models.ForeignKey(FormTemplate, on_delete=models.CASCADE, related_name='shares')
    
    # Access configuration
    access_type = models.CharField(max_length=20, choices=ACCESS_TYPE_CHOICES)
    password = models.CharField(max_length=255, blank=True, help_text="Hashed password for protected access")
    allowed_users = models.ManyToManyField(User, blank=True, related_name='form_access')
    
    # Link configuration
    share_url = models.CharField(max_length=255, unique=True)
    max_submissions = models.IntegerField(null=True, blank=True, help_text="Maximum number of submissions")
    expires_at = models.DateTimeField(null=True, blank=True)
    
    # Tracking
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_form_shares')
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    # Usage stats
    view_count = models.IntegerField(default=0)
    submission_count = models.IntegerField(default=0)

    def __str__(self):
        return f"Share: {self.form_template.name} - {self.access_type}"


class FormAnalytics(models.Model):
    """Analytics and metrics for form usage."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    form_template = models.ForeignKey(FormTemplate, on_delete=models.CASCADE, related_name='analytics')
    
    # Response metrics
    total_responses = models.IntegerField(default=0)
    completed_responses = models.IntegerField(default=0)
    draft_responses = models.IntegerField(default=0)
    completion_rate = models.FloatField(default=0.0)
    
    # Field analytics
    field_completion_rates = models.JSONField(default=dict, help_text="Field_name -> completion_rate")
    drop_off_points = models.JSONField(default=list, help_text="Fields where users commonly stop")
    
    # Usage patterns
    peak_usage_hours = models.JSONField(default=list, help_text="Hours with most activity")
    device_breakdown = models.JSONField(default=dict, help_text="Mobile vs desktop usage")
    geographic_breakdown = models.JSONField(default=dict, help_text="Responses by location")
    
    # Performance metrics
    average_completion_time_seconds = models.IntegerField(null=True, blank=True)
    bounce_rate = models.FloatField(default=0.0)
    
    # Timestamp
    calculated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Analytics: {self.form_template.name}"
