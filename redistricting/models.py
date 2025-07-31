from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.gis.db import models as gis_models
from django.contrib.gis.geos import MultiPolygon, Polygon
from simple_history.models import HistoricalRecords
import uuid
import json

User = get_user_model()


class RedistrictingPlan(models.Model):
    """Redistricting plan with multiple districts."""
    
    PLAN_TYPE_CHOICES = [
        ('congressional', 'Congressional'),
        ('state_senate', 'State Senate'),
        ('state_house', 'State House'),
        ('county', 'County'),
        ('municipal', 'Municipal'),
        ('school_district', 'School District'),
        ('custom', 'Custom'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('proposed', 'Proposed'),
        ('approved', 'Approved'),
        ('enacted', 'Enacted'),
        ('rejected', 'Rejected'),
        ('archived', 'Archived'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    plan_type = models.CharField(max_length=50, choices=PLAN_TYPE_CHOICES)
    description = models.TextField(blank=True)
    
    # Jurisdiction and authority
    state = models.CharField(max_length=2, help_text="State abbreviation")
    jurisdiction = models.CharField(max_length=100, blank=True, help_text="County, city, etc.")
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_plans')
    authority_type = models.CharField(max_length=50, choices=[
        ('state', 'State Government'),
        ('county', 'County Government'),
        ('municipal', 'Municipal Government'),
        ('commission', 'Redistricting Commission'),
        ('court', 'Court Order'),
        ('citizen', 'Citizen Initiative'),
    ], blank=True)
    
    # Plan metadata
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    target_districts = models.IntegerField(help_text="Number of districts in plan")
    target_population_per_district = models.IntegerField(null=True, blank=True)
    
    # Geographic boundaries
    boundary = gis_models.MultiPolygonField(null=True, blank=True, help_text="Overall plan boundary")
    
    # Metrics and validation
    total_population = models.IntegerField(default=0)
    population_deviation = models.FloatField(default=0.0, help_text="Maximum population deviation percentage")
    compactness_score = models.FloatField(null=True, blank=True, help_text="Compactness metric (0-1)")
    efficiency_gap = models.FloatField(null=True, blank=True, help_text="Partisan efficiency gap")
    
    # Version control
    version = models.IntegerField(default=1)
    parent_plan = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='versions')
    is_current_version = models.BooleanField(default=True)
    
    # Import/export tracking
    source_format = models.CharField(max_length=50, blank=True, help_text="Original file format")
    source_file_name = models.CharField(max_length=255, blank=True)
    export_formats = models.JSONField(default=list, help_text="Available export formats")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    
    # Audit logging
    history = HistoricalRecords()

    class Meta:
        indexes = [
            models.Index(fields=['plan_type']),
            models.Index(fields=['state']),
            models.Index(fields=['status']),
            models.Index(fields=['created_by']),
            models.Index(fields=['is_current_version']),
        ]

    def __str__(self):
        return f"{self.name} v{self.version} ({self.get_plan_type_display()})"


class District(models.Model):
    """Individual district within a redistricting plan."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    plan = models.ForeignKey(RedistrictingPlan, on_delete=models.CASCADE, related_name='districts')
    
    # District identification
    district_number = models.IntegerField()
    name = models.CharField(max_length=100, blank=True)
    external_id = models.CharField(max_length=50, blank=True, help_text="External system identifier")
    
    # Geographic data
    boundary = gis_models.MultiPolygonField(help_text="District boundary as multipolygon")
    area_sq_meters = models.FloatField(null=True, blank=True)
    perimeter_meters = models.FloatField(null=True, blank=True)
    
    # Demographics
    total_population = models.IntegerField(default=0)
    voting_age_population = models.IntegerField(default=0)
    demographic_breakdown = models.JSONField(default=dict, help_text="Population by race/ethnicity")
    
    # Political metrics
    partisan_lean = models.FloatField(null=True, blank=True, help_text="Partisan lean score")
    competitiveness_score = models.FloatField(null=True, blank=True, help_text="Electoral competitiveness")
    historical_voting = models.JSONField(default=dict, help_text="Historical election results")
    
    # Compliance metrics
    compactness_score = models.FloatField(null=True, blank=True)
    contiguity_verified = models.BooleanField(default=True)
    population_deviation = models.FloatField(default=0.0)
    
    # Administrative areas contained
    counties = models.JSONField(default=list, help_text="List of counties or parts thereof")
    municipalities = models.JSONField(default=list, help_text="List of cities/towns")
    precincts = models.JSONField(default=list, help_text="List of voting precincts")
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['plan', 'district_number']
        indexes = [
            models.Index(fields=['plan', 'district_number']),
            models.Index(fields=['total_population']),
        ]

    def save(self, *args, **kwargs):
        """Calculate area and perimeter on save."""
        if self.boundary:
            # Calculate area in square meters
            self.area_sq_meters = self.boundary.area * 111319.9 ** 2  # approximate conversion
            # Calculate perimeter in meters  
            self.perimeter_meters = self.boundary.length * 111319.9  # approximate conversion
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.plan.name} - District {self.district_number}"


class PlanComparison(models.Model):
    """Compare multiple redistricting plans."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    plans = models.ManyToManyField(RedistrictingPlan, related_name='comparisons')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='plan_comparisons')
    
    # Comparison criteria
    criteria = models.JSONField(default=dict, help_text="Comparison criteria and weights")
    
    # Results
    comparison_results = models.JSONField(default=dict, help_text="Detailed comparison results")
    ranking = models.JSONField(default=list, help_text="Plans ranked by overall score")
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Comparison: {self.name}"


class PlanMetrics(models.Model):
    """Detailed metrics and validation for redistricting plans."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    plan = models.OneToOneField(RedistrictingPlan, on_delete=models.CASCADE, related_name='metrics')
    
    # Population metrics
    ideal_population = models.IntegerField(default=0)
    max_population_deviation = models.FloatField(default=0.0)
    population_range = models.JSONField(default=dict, help_text="Min/max district populations")
    
    # Compactness metrics
    polsby_popper_scores = models.JSONField(default=list, help_text="PP scores for each district")
    reock_scores = models.JSONField(default=list, help_text="Reock scores for each district")
    convex_hull_scores = models.JSONField(default=list, help_text="Convex hull scores")
    
    # Contiguity validation
    contiguous_districts = models.IntegerField(default=0)
    non_contiguous_districts = models.JSONField(default=list, help_text="List of non-contiguous districts")
    
    # Political metrics
    partisan_bias = models.FloatField(null=True, blank=True)
    efficiency_gap = models.FloatField(null=True, blank=True)
    mean_median_difference = models.FloatField(null=True, blank=True)
    competitive_districts = models.IntegerField(default=0)
    
    # Administrative compliance
    county_splits = models.IntegerField(default=0)
    municipality_splits = models.IntegerField(default=0)
    precinct_splits = models.IntegerField(default=0)
    
    # Voting Rights Act compliance
    majority_minority_districts = models.IntegerField(default=0)
    coalition_districts = models.IntegerField(default=0)
    vra_compliance_notes = models.TextField(blank=True)
    
    # Overall scores
    overall_score = models.FloatField(null=True, blank=True)
    compliance_score = models.FloatField(null=True, blank=True)
    
    # Calculation metadata
    calculated_at = models.DateTimeField(auto_now=True)
    calculation_version = models.CharField(max_length=10, default='1.0')

    def __str__(self):
        return f"Metrics for {self.plan.name}"


class PlanComment(models.Model):
    """Comments and feedback on redistricting plans."""
    
    COMMENT_TYPE_CHOICES = [
        ('general', 'General Comment'),
        ('concern', 'Concern'),
        ('suggestion', 'Suggestion'),
        ('legal', 'Legal Issue'),
        ('data', 'Data Issue'),
        ('technical', 'Technical Issue'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    plan = models.ForeignKey(RedistrictingPlan, on_delete=models.CASCADE, related_name='comments')
    district = models.ForeignKey(District, on_delete=models.CASCADE, null=True, blank=True, related_name='comments')
    
    # Comment data
    comment_type = models.CharField(max_length=20, choices=COMMENT_TYPE_CHOICES)
    title = models.CharField(max_length=200)
    content = models.TextField()
    
    # Author information
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='plan_comments')
    author_organization = models.CharField(max_length=100, blank=True)
    
    # Location context
    location_reference = gis_models.PointField(null=True, blank=True, help_text="Geographic reference point")
    affected_areas = models.JSONField(default=list, help_text="List of affected geographic areas")
    
    # Status tracking
    is_public = models.BooleanField(default=True)
    is_resolved = models.BooleanField(default=False)
    response = models.TextField(blank=True)
    responded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='plan_responses')
    responded_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['plan']),
            models.Index(fields=['comment_type']),
            models.Index(fields=['is_public']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"Comment on {self.plan.name}: {self.title}"


class PlanExport(models.Model):
    """Track plan exports and downloads."""
    
    EXPORT_FORMAT_CHOICES = [
        ('shapefile', 'Shapefile'),
        ('geojson', 'GeoJSON'),
        ('kml', 'KML'),
        ('csv', 'CSV'),
        ('pdf', 'PDF Report'),
        ('json', 'JSON'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    plan = models.ForeignKey(RedistrictingPlan, on_delete=models.CASCADE, related_name='exports')
    
    # Export details
    format = models.CharField(max_length=20, choices=EXPORT_FORMAT_CHOICES)
    file_name = models.CharField(max_length=255)
    file_size_bytes = models.BigIntegerField(null=True, blank=True)
    
    # Request details
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='plan_exports')
    export_options = models.JSONField(default=dict, help_text="Export configuration options")
    
    # Status tracking
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('expired', 'Expired'),
    ], default='pending')
    
    # Timestamps
    requested_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Export: {self.plan.name} as {self.format}"
