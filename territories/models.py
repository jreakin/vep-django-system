from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.gis.db import models as gis_models
from django.contrib.gis.geos import Polygon, MultiPolygon
from simple_history.models import HistoricalRecords
import uuid

User = get_user_model()


class Territory(models.Model):
    """Spatial territory definitions for campaigns."""
    
    TERRITORY_TYPE_CHOICES = [
        ('precinct', 'Precinct'),
        ('district', 'District'),
        ('custom', 'Custom Area'),
        ('walklist', 'Walk List Area'),
        ('canvass_zone', 'Canvass Zone'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('archived', 'Archived'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    territory_type = models.CharField(max_length=50, choices=TERRITORY_TYPE_CHOICES)
    description = models.TextField(blank=True)
    
    # Campaign/user association
    campaign_id = models.UUIDField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_territories')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_territories')
    
    # Spatial fields
    boundary = gis_models.PolygonField(help_text="Territory boundary as polygon")
    center_point = gis_models.PointField(null=True, blank=True, help_text="Center point of territory")
    area_sq_meters = models.FloatField(null=True, blank=True, help_text="Area in square meters")
    
    # Metadata
    external_id = models.CharField(max_length=100, blank=True, help_text="External system ID")
    properties = models.JSONField(default=dict, blank=True, help_text="Additional territory properties")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Tracking
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Audit logging
    history = HistoricalRecords()

    class Meta:
        indexes = [
            models.Index(fields=['campaign_id']),
            models.Index(fields=['territory_type']),
            models.Index(fields=['created_by']),
            models.Index(fields=['assigned_to']),
        ]

    def save(self, *args, **kwargs):
        """Calculate center point and area on save."""
        if self.boundary:
            self.center_point = self.boundary.centroid
            # Area in square meters (assuming WGS84)
            self.area_sq_meters = self.boundary.area * 111319.9 ** 2  # approximate conversion
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.get_territory_type_display()})"


class WalkListTerritory(models.Model):
    """Enhanced walk list with spatial territory support."""
    
    STATUS_CHOICES = [
        ('assigned', 'Assigned'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('on_hold', 'On Hold'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    territory = models.ForeignKey(Territory, on_delete=models.CASCADE, related_name='walk_lists')
    
    # Assignment
    volunteer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='territory_walk_lists')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_territory_walk_lists')
    
    # Routing and navigation
    route_order = models.JSONField(default=list, help_text="Ordered list of voter IDs for optimal routing")
    start_location = gis_models.PointField(null=True, blank=True, help_text="Recommended start location")
    estimated_duration_minutes = models.IntegerField(null=True, blank=True)
    
    # GPS verification settings
    require_gps_verification = models.BooleanField(default=True)
    max_distance_meters = models.IntegerField(default=1609, help_text="Max distance from address (default 1 mile)")
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='assigned')
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    target_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Audit logging
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.name} - {self.volunteer.email}"


class TerritoryAssignment(models.Model):
    """Track voter assignments to territories."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    territory = models.ForeignKey(Territory, on_delete=models.CASCADE, related_name='voter_assignments')
    voter_id = models.UUIDField()
    
    # Assignment metadata
    assigned_at = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='territory_assignments')
    is_active = models.BooleanField(default=True)
    
    # Spatial verification
    is_within_boundary = models.BooleanField(default=True, help_text="Whether voter location is within territory boundary")
    distance_to_boundary_meters = models.FloatField(null=True, blank=True, help_text="Distance to boundary if outside")

    class Meta:
        unique_together = ['territory', 'voter_id']
        indexes = [
            models.Index(fields=['territory']),
            models.Index(fields=['voter_id']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"Voter {self.voter_id} in {self.territory.name}"


class CanvassRoute(models.Model):
    """Optimized routing for canvassing activities."""
    
    OPTIMIZATION_TYPE_CHOICES = [
        ('shortest_distance', 'Shortest Distance'),
        ('shortest_time', 'Shortest Time'),
        ('balanced', 'Balanced Distance/Time'),
        ('manual', 'Manual Order'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    walk_list = models.OneToOneField(WalkListTerritory, on_delete=models.CASCADE, related_name='route')
    
    # Route configuration
    optimization_type = models.CharField(max_length=50, choices=OPTIMIZATION_TYPE_CHOICES, default='balanced')
    start_address = models.TextField(blank=True)
    end_address = models.TextField(blank=True)
    
    # Route data
    waypoints = models.JSONField(default=list, help_text="Ordered list of {voter_id, lat, lng, address} objects")
    route_geometry = gis_models.LineStringField(null=True, blank=True, help_text="Route as LineString")
    total_distance_meters = models.FloatField(null=True, blank=True)
    estimated_duration_minutes = models.IntegerField(null=True, blank=True)
    
    # Metadata
    generated_at = models.DateTimeField(auto_now_add=True)
    generated_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='generated_routes')
    is_current = models.BooleanField(default=True)

    def __str__(self):
        return f"Route for {self.walk_list.name}"


class TerritoryAnalytics(models.Model):
    """Analytics and metrics for territories."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    territory = models.ForeignKey(Territory, on_delete=models.CASCADE, related_name='analytics')
    
    # Voter metrics
    total_voters = models.IntegerField(default=0)
    registered_voters = models.IntegerField(default=0)
    likely_voters = models.IntegerField(default=0)
    contacted_voters = models.IntegerField(default=0)
    
    # Demographics (aggregated)
    age_demographics = models.JSONField(default=dict, help_text="Age distribution")
    party_demographics = models.JSONField(default=dict, help_text="Party affiliation distribution")
    turnout_history = models.JSONField(default=dict, help_text="Historical turnout by election")
    
    # Geographic metrics
    population_density = models.FloatField(null=True, blank=True, help_text="People per square km")
    average_income = models.FloatField(null=True, blank=True)
    
    # Canvassing metrics
    canvass_completion_rate = models.FloatField(default=0.0, help_text="Percentage of assigned canvassing completed")
    average_contact_rate = models.FloatField(default=0.0, help_text="Percentage of successful contacts")
    
    # Timestamp
    calculated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Analytics for {self.territory.name}"
