from django.db import models
from django.contrib.auth import get_user_model
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
