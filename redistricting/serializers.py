from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import (
    RedistrictingPlan, District, PlanComparison, PlanMetrics, 
    PlanComment, PlanExport
)


class DistrictSerializer(GeoFeatureModelSerializer):
    """Serializer for District model with GeoJSON support."""
    
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    
    class Meta:
        model = District
        geo_field = 'boundary'
        fields = '__all__'
        read_only_fields = ('id', 'area_sq_meters', 'perimeter_meters', 'created_at', 'updated_at')


class RedistrictingPlanSerializer(GeoFeatureModelSerializer):
    """Serializer for RedistrictingPlan model with GeoJSON support."""
    
    districts = DistrictSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.phone_number', read_only=True)
    district_count = serializers.SerializerMethodField()
    
    class Meta:
        model = RedistrictingPlan
        geo_field = 'boundary'
        fields = '__all__'
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at', 'approved_at')
    
    def get_district_count(self, obj):
        return obj.districts.count()


class PlanComparisonSerializer(serializers.ModelSerializer):
    """Serializer for PlanComparison model."""
    
    plan_names = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.phone_number', read_only=True)
    
    class Meta:
        model = PlanComparison
        fields = '__all__'
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at')
    
    def get_plan_names(self, obj):
        return [plan.name for plan in obj.plans.all()]


class PlanMetricsSerializer(serializers.ModelSerializer):
    """Serializer for PlanMetrics model."""
    
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    
    class Meta:
        model = PlanMetrics
        fields = '__all__'
        read_only_fields = ('calculated_at',)


class PlanCommentSerializer(serializers.ModelSerializer):
    """Serializer for PlanComment model."""
    
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    district_number = serializers.CharField(source='district.district_number', read_only=True)
    author_name = serializers.CharField(source='author.phone_number', read_only=True)
    responded_by_name = serializers.CharField(source='responded_by.phone_number', read_only=True)
    
    class Meta:
        model = PlanComment
        fields = '__all__'
        read_only_fields = ('id', 'author', 'created_at', 'updated_at', 'responded_at')


class PlanExportSerializer(serializers.ModelSerializer):
    """Serializer for PlanExport model."""
    
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    requested_by_name = serializers.CharField(source='requested_by.phone_number', read_only=True)
    
    class Meta:
        model = PlanExport
        fields = '__all__'
        read_only_fields = ('id', 'requested_by', 'requested_at', 'completed_at')


class PlanCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating redistricting plans."""
    
    class Meta:
        model = RedistrictingPlan
        fields = [
            'name', 'plan_type', 'description', 'state', 'jurisdiction',
            'authority_type', 'target_districts', 'target_population_per_district',
            'boundary', 'source_format', 'source_file_name'
        ]
    
    def validate_target_districts(self, value):
        """Validate target district count."""
        if value < 1:
            raise serializers.ValidationError("Target districts must be at least 1.")
        if value > 1000:
            raise serializers.ValidationError("Target districts cannot exceed 1000.")
        return value
    
    def create(self, validated_data):
        """Create plan with calculated fields."""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class DistrictCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating districts."""
    
    class Meta:
        model = District
        fields = [
            'plan', 'district_number', 'name', 'boundary', 'external_id',
            'total_population', 'voting_age_population', 'demographic_breakdown',
            'counties', 'municipalities', 'precincts'
        ]
    
    def validate(self, data):
        """Validate district data."""
        plan = data.get('plan')
        district_number = data.get('district_number')
        
        # Check for duplicate district numbers within plan
        if plan and district_number:
            existing = District.objects.filter(
                plan=plan, 
                district_number=district_number
            )
            if self.instance:
                existing = existing.exclude(id=self.instance.id)
            
            if existing.exists():
                raise serializers.ValidationError(
                    f"District {district_number} already exists in this plan."
                )
        
        return data
