from django.contrib import admin
from django.contrib.gis.admin import OSMGeoAdmin
from .models import Territory, WalkListTerritory, TerritoryAssignment, CanvassRoute, TerritoryAnalytics


@admin.register(Territory)
class TerritoryAdmin(OSMGeoAdmin):
    """Admin interface for Territory with map visualization."""
    
    list_display = ['name', 'territory_type', 'created_by', 'assigned_to', 'status', 'area_sq_meters', 'created_at']
    list_filter = ['territory_type', 'status', 'created_at']
    search_fields = ['name', 'description', 'created_by__phone_number']
    readonly_fields = ['id', 'center_point', 'area_sq_meters', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'territory_type', 'description', 'status')
        }),
        ('Assignment', {
            'fields': ('campaign_id', 'created_by', 'assigned_to')
        }),
        ('Geographic Data', {
            'fields': ('boundary', 'center_point', 'area_sq_meters')
        }),
        ('Metadata', {
            'fields': ('external_id', 'properties'),
            'classes': ('collapse',)
        }),
        ('System', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(WalkListTerritory)
class WalkListTerritoryAdmin(admin.ModelAdmin):
    """Admin interface for WalkListTerritory."""
    
    list_display = ['name', 'territory', 'volunteer', 'status', 'require_gps_verification', 'target_date']
    list_filter = ['status', 'require_gps_verification', 'created_at']
    search_fields = ['name', 'territory__name', 'volunteer__phone_number']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-created_at']


@admin.register(TerritoryAssignment)
class TerritoryAssignmentAdmin(admin.ModelAdmin):
    """Admin interface for TerritoryAssignment."""
    
    list_display = ['territory', 'voter_id', 'assigned_by', 'is_active', 'is_within_boundary', 'assigned_at']
    list_filter = ['is_active', 'is_within_boundary', 'assigned_at']
    search_fields = ['territory__name', 'voter_id', 'assigned_by__phone_number']
    readonly_fields = ['id', 'assigned_at']
    ordering = ['-assigned_at']


@admin.register(CanvassRoute)
class CanvassRouteAdmin(admin.ModelAdmin):
    """Admin interface for CanvassRoute."""
    
    list_display = ['walk_list', 'optimization_type', 'total_distance_meters', 'estimated_duration_minutes', 'is_current']
    list_filter = ['optimization_type', 'is_current', 'generated_at']
    search_fields = ['walk_list__name', 'generated_by__phone_number']
    readonly_fields = ['id', 'generated_at']


@admin.register(TerritoryAnalytics)
class TerritoryAnalyticsAdmin(admin.ModelAdmin):
    """Admin interface for TerritoryAnalytics."""
    
    list_display = ['territory', 'total_voters', 'canvass_completion_rate', 'average_contact_rate', 'calculated_at']
    list_filter = ['calculated_at']
    search_fields = ['territory__name']
    readonly_fields = ['calculated_at']
    ordering = ['-calculated_at']
