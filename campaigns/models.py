from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class Audience(models.Model):
    """Audience definitions for campaign targeting."""
    
    PLATFORM_CHOICES = [
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('facebook', 'Facebook'),
        ('twitter', 'Twitter/X'),
        ('tiktok', 'TikTok'),
        ('snapchat', 'Snapchat'),
        ('direct_mail', 'Direct Mail'),
        ('phone', 'Phone'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('completed', 'Completed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    account = models.ForeignKey(User, on_delete=models.CASCADE, related_name='audiences')
    filters = models.JSONField(default=dict)  # Complex filtering criteria
    platform = models.CharField(max_length=50, choices=PLATFORM_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    estimated_size = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.get_platform_display()}"


class Campaign(models.Model):
    """Campaign execution and management."""
    
    CAMPAIGN_TYPE_CHOICES = [
        ('awareness', 'Awareness'),
        ('persuasion', 'Persuasion'),
        ('gotv', 'Get Out The Vote'),
        ('fundraising', 'Fundraising'),
        ('volunteer_recruitment', 'Volunteer Recruitment'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('scheduled', 'Scheduled'),
        ('running', 'Running'),
        ('paused', 'Paused'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    campaign_type = models.CharField(max_length=50, choices=CAMPAIGN_TYPE_CHOICES)
    account = models.ForeignKey(User, on_delete=models.CASCADE, related_name='campaigns')
    audience = models.ForeignKey(Audience, on_delete=models.CASCADE, related_name='campaigns')
    message_template = models.TextField()
    personalization_data = models.JSONField(default=dict, blank=True)
    scheduled_send = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Metrics
    sent_count = models.IntegerField(default=0)
    delivered_count = models.IntegerField(default=0)
    opened_count = models.IntegerField(default=0)
    clicked_count = models.IntegerField(default=0)
    conversion_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.get_campaign_type_display()}"


class CampaignExecution(models.Model):
    """Track individual campaign message sends."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='executions')
    voter_id = models.UUIDField()
    sent_at = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    opened_at = models.DateTimeField(null=True, blank=True)
    clicked_at = models.DateTimeField(null=True, blank=True)
    conversion_at = models.DateTimeField(null=True, blank=True)
    platform_message_id = models.CharField(max_length=200, blank=True)
    error_message = models.TextField(blank=True)

    class Meta:
        unique_together = ['campaign', 'voter_id']

    def __str__(self):
        return f"{self.campaign.name} - Voter {self.voter_id}"
