from rest_framework import serializers
from .models import (
    AnalyticsQuery, AnalyticsDashboard, AnalyticsWidget, 
    PredictiveModel, ModelPrediction, AnalyticsSession
)


class AnalyticsQuerySerializer(serializers.ModelSerializer):
    """Serializer for AnalyticsQuery model."""
    
    user_name = serializers.CharField(source='user.phone_number', read_only=True)
    
    class Meta:
        model = AnalyticsQuery
        fields = '__all__'
        read_only_fields = ('id', 'user', 'created_at', 'updated_at', 'processing_started_at', 'processing_completed_at')


class AnalyticsWidgetSerializer(serializers.ModelSerializer):
    """Serializer for AnalyticsWidget model."""
    
    dashboard_name = serializers.CharField(source='dashboard.name', read_only=True)
    
    class Meta:
        model = AnalyticsWidget
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'last_updated')


class AnalyticsDashboardSerializer(serializers.ModelSerializer):
    """Serializer for AnalyticsDashboard model."""
    
    dashboard_widgets = AnalyticsWidgetSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.phone_number', read_only=True)
    shared_with_names = serializers.SerializerMethodField()
    
    class Meta:
        model = AnalyticsDashboard
        fields = '__all__'
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at', 'last_refreshed_at')
    
    def get_shared_with_names(self, obj):
        return [user.phone_number for user in obj.shared_with.all()]


class PredictiveModelSerializer(serializers.ModelSerializer):
    """Serializer for PredictiveModel model."""
    
    created_by_name = serializers.CharField(source='created_by.phone_number', read_only=True)
    
    class Meta:
        model = PredictiveModel
        fields = '__all__'
        read_only_fields = ('id', 'created_by', 'created_at', 'trained_at', 'updated_at', 
                           'prediction_count', 'last_prediction_at')


class ModelPredictionSerializer(serializers.ModelSerializer):
    """Serializer for ModelPrediction model."""
    
    model_name = serializers.CharField(source='model.name', read_only=True)
    requested_by_name = serializers.CharField(source='requested_by.phone_number', read_only=True)
    
    class Meta:
        model = ModelPrediction
        fields = '__all__'
        read_only_fields = ('id', 'requested_by', 'created_at', 'validated_at')


class AnalyticsSessionSerializer(serializers.ModelSerializer):
    """Serializer for AnalyticsSession model."""
    
    user_name = serializers.CharField(source='user.phone_number', read_only=True)
    
    class Meta:
        model = AnalyticsSession
        fields = '__all__'
        read_only_fields = ('id', 'user', 'started_at', 'last_activity_at', 'ended_at', 'duration_seconds')
