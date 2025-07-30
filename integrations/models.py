from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class Integration(models.Model):
    """External service integrations."""
    
    SERVICE_CHOICES = [
        ('segment', 'Segment'),
        ('mailchimp', 'Mailchimp'),
        ('twilio', 'Twilio'),
        ('facebook', 'Facebook'),
        ('twitter', 'Twitter/X'),
        ('tiktok', 'TikTok'),
        ('snapchat', 'Snapchat'),
        ('fullcontact', 'FullContact'),
        ('spokeo', 'Spokeo'),
        ('zoominfo', 'ZoomInfo'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    account = models.ForeignKey(User, on_delete=models.CASCADE, related_name='integrations')
    service = models.CharField(max_length=50, choices=SERVICE_CHOICES)
    api_key = models.CharField(max_length=500, blank=True)  # Encrypted in production
    oauth_token = models.TextField(blank=True)  # For OAuth integrations
    settings = models.JSONField(default=dict, blank=True)  # Service-specific settings
    is_active = models.BooleanField(default=True)
    shared_with = models.ManyToManyField(User, blank=True, related_name='shared_integrations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['account', 'service']

    def __str__(self):
        return f"{self.account.email} - {self.get_service_display()}"
