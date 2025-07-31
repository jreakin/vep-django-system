from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.gis.db import models as gis_models
from django.contrib.gis.geos import Point
from django.core.exceptions import ValidationError
from simple_history.models import HistoricalRecords
import uuid
from math import radians, cos, sin, asin, sqrt

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
    
    # GPS verification settings
    require_gps_verification = models.BooleanField(default=True)
    max_distance_meters = models.IntegerField(default=1609, help_text="Max distance from address (default 1 mile)")
    
    # Audit logging
    history = HistoricalRecords()

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
    
    # Audit logging
    history = HistoricalRecords()

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
    
    # GPS verification fields
    submission_location = gis_models.PointField(null=True, blank=True, help_text="GPS location of submission")
    target_location = gis_models.PointField(null=True, blank=True, help_text="Target voter address location")
    distance_to_target_meters = models.FloatField(null=True, blank=True, help_text="Distance from submission to target")
    is_location_verified = models.BooleanField(default=False)
    gps_accuracy_meters = models.FloatField(null=True, blank=True)
    
    # Audit logging
    history = HistoricalRecords()

    class Meta:
        unique_together = ['questionnaire', 'voter_id', 'walk_list']

    def save(self, *args, **kwargs):
        """Calculate distance and verify location on save."""
        if self.submission_location and self.target_location:
            self.distance_to_target_meters = self.calculate_distance_meters(
                self.submission_location, self.target_location
            )
            # Mark as verified if within reasonable distance (default 1 mile / 1609 meters)
            max_distance = getattr(self.walk_list, 'max_distance_meters', 1609)
            self.is_location_verified = self.distance_to_target_meters <= max_distance
        super().save(*args, **kwargs)

    @staticmethod
    def calculate_distance_meters(point1, point2):
        """Calculate distance between two points in meters using Haversine formula."""
        if not point1 or not point2:
            return None
        
        # Convert to radians
        lat1, lon1, lat2, lon2 = map(radians, [point1.y, point1.x, point2.y, point2.x])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        r = 6371000  # Radius of earth in meters
        return c * r

    def __str__(self):
        return f"Response {self.voter_id} - {self.questionnaire.name}"


class CanvassSession(models.Model):
    """Track canvassing sessions with GPS and timing."""
    
    STATUS_CHOICES = [
        ('starting', 'Starting'),
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    walk_list = models.ForeignKey(WalkList, on_delete=models.CASCADE, related_name='sessions')
    volunteer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='canvass_sessions')
    
    # Session tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='starting')
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    
    # Location tracking
    start_location = gis_models.PointField(null=True, blank=True)
    current_location = gis_models.PointField(null=True, blank=True)
    location_history = models.JSONField(default=list, help_text="List of location updates during session")
    
    # Progress tracking
    current_voter_index = models.IntegerField(default=0)
    voters_attempted = models.IntegerField(default=0)
    voters_contacted = models.IntegerField(default=0)
    responses_collected = models.IntegerField(default=0)
    
    # Session metadata
    device_info = models.JSONField(default=dict)
    notes = models.TextField(blank=True)
    
    # Audit logging
    history = HistoricalRecords()

    def __str__(self):
        return f"Session: {self.walk_list.name} - {self.volunteer.email} ({self.status})"


class LocationUpdate(models.Model):
    """Track location updates during canvassing sessions."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(CanvassSession, on_delete=models.CASCADE, related_name='location_updates')
    
    # Location data
    location = gis_models.PointField()
    accuracy_meters = models.FloatField(null=True, blank=True)
    altitude = models.FloatField(null=True, blank=True)
    heading = models.FloatField(null=True, blank=True)
    speed_mps = models.FloatField(null=True, blank=True, help_text="Speed in meters per second")
    
    # Context
    activity_type = models.CharField(max_length=50, default='canvassing', choices=[
        ('canvassing', 'Canvassing'),
        ('traveling', 'Traveling'),
        ('break', 'Break'),
        ('other', 'Other'),
    ])
    
    # Timestamp
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['session', 'recorded_at']),
        ]

    def __str__(self):
        return f"Location: {self.session.volunteer.email} at {self.recorded_at}"
