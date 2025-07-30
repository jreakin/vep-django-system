from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class WalkList(models.Model):
    """Canvassing walk lists for volunteers."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    campaign_id = models.UUIDField()
    volunteer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='walk_lists')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_walk_lists')
    voter_ids = models.JSONField(default=list)  # List of voter UUIDs
    target_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=50, default='assigned')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.volunteer.email}"


class Questionnaire(models.Model):
    """Survey questionnaires for canvassing."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    campaign_id = models.UUIDField()
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_questionnaires')
    questions = models.JSONField(default=list)  # List of question objects
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - Campaign {self.campaign_id}"


class CanvassResponse(models.Model):
    """Individual responses from canvassing activities."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    questionnaire = models.ForeignKey(Questionnaire, on_delete=models.CASCADE, related_name='responses')
    walk_list = models.ForeignKey(WalkList, on_delete=models.CASCADE, related_name='responses')
    voter_id = models.UUIDField()
    volunteer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='canvass_responses')
    responses = models.JSONField(default=dict)  # Question ID -> Answer mapping
    contact_attempted = models.BooleanField(default=False)
    contact_made = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    response_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['questionnaire', 'voter_id', 'walk_list']

    def __str__(self):
        return f"Response {self.voter_id} - {self.questionnaire.name}"
