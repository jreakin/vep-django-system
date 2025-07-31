from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import Territory, WalkListTerritory, TerritoryAssignment, CanvassRoute, TerritoryAnalytics


class TerritorySerializer(GeoFeatureModelSerializer):
    """Serializer for Territory model with GeoJSON support."""
    
    created_by_name = serializers.CharField(source='created_by.phone_number', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.phone_number', read_only=True)
    
    class Meta:
        model = Territory
        geo_field = 'boundary'
        fields = '__all__'
        read_only_fields = ('id', 'center_point', 'area_sq_meters', 'created_at', 'updated_at')


class WalkListTerritorySerializer(serializers.ModelSerializer):
    """Serializer for WalkListTerritory model."""
    
    territory_name = serializers.CharField(source='territory.name', read_only=True)
    volunteer_name = serializers.CharField(source='volunteer.phone_number', read_only=True)
    created_by_name = serializers.CharField(source='created_by.phone_number', read_only=True)
    
    class Meta:
        model = WalkListTerritory
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class TerritoryAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for TerritoryAssignment model."""
    
    territory_name = serializers.CharField(source='territory.name', read_only=True)
    assigned_by_name = serializers.CharField(source='assigned_by.phone_number', read_only=True)
    
    class Meta:
        model = TerritoryAssignment
        fields = '__all__'
        read_only_fields = ('id', 'assigned_at')


class CanvassRouteSerializer(serializers.ModelSerializer):
    """Serializer for CanvassRoute model."""
    
    walk_list_name = serializers.CharField(source='walk_list.name', read_only=True)
    generated_by_name = serializers.CharField(source='generated_by.phone_number', read_only=True)
    
    class Meta:
        model = CanvassRoute
        fields = '__all__'
        read_only_fields = ('id', 'generated_at')


class TerritoryAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer for TerritoryAnalytics model."""
    
    territory_name = serializers.CharField(source='territory.name', read_only=True)
    
    class Meta:
        model = TerritoryAnalytics
        fields = '__all__'
        read_only_fields = ('calculated_at',)


class TerritoryCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating territories with spatial data validation."""
    
    class Meta:
        model = Territory
        fields = [
            'name', 'territory_type', 'description', 'campaign_id', 
            'assigned_to', 'boundary', 'external_id', 'properties', 'status'
        ]
    
    def validate_boundary(self, value):
        """Validate that boundary is a valid polygon."""
        if not value:
            raise serializers.ValidationError("Boundary is required.")
        
        # Basic validation - ensure it's a polygon/multipolygon
        if value.geom_type not in ['Polygon', 'MultiPolygon']:
            raise serializers.ValidationError("Boundary must be a Polygon or MultiPolygon.")
        
        return value
    
    def create(self, validated_data):
        """Create territory with calculated fields."""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
