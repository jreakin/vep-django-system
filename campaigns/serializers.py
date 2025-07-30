from rest_framework import serializers
from .models import Campaign, Audience, CampaignExecution


class AudienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Audience
        fields = ['id', 'name', 'platform', 'filters', 'status', 'estimated_size', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'estimated_size']

    def validate_filters(self, value):
        """Validate that filters is a valid dictionary"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Filters must be a valid JSON object")
        return value


class CampaignSerializer(serializers.ModelSerializer):
    audience_name = serializers.SerializerMethodField()
    platform = serializers.SerializerMethodField()
    
    class Meta:
        model = Campaign
        fields = [
            'id', 'name', 'campaign_type', 'audience', 'audience_name', 'platform',
            'message_template', 'personalization_data', 'scheduled_send', 'status', 'budget',
            'sent_count', 'delivered_count', 'opened_count', 'clicked_count', 'conversion_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'sent_count', 'delivered_count', 
            'opened_count', 'clicked_count', 'conversion_count'
        ]

    def get_audience_name(self, obj):
        """Get the audience name"""
        return obj.audience.name if obj.audience else None

    def get_platform(self, obj):
        """Get the platform from the audience"""
        return obj.audience.platform if obj.audience else None

    def validate_audience(self, value):
        """Validate that user has access to the audience"""
        request = self.context.get('request')
        if request and request.user:
            user = request.user
            # Check if user owns this audience or is an owner
            if hasattr(user, 'role') and user.role == 'owner':
                return value
            elif value.account != user:
                raise serializers.ValidationError("You don't have access to this audience")
        return value

    def validate_message_template(self, value):
        """Basic validation for message template"""
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Message template must be at least 10 characters long")
        return value


class CampaignExecutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampaignExecution
        fields = [
            'id', 'campaign', 'voter_id', 'sent_at', 'delivered_at', 'opened_at', 
            'clicked_at', 'conversion_at', 'platform_message_id', 'error_message'
        ]
        read_only_fields = ['id', 'sent_at']


class CampaignCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for campaign creation"""
    class Meta:
        model = Campaign
        fields = [
            'name', 'campaign_type', 'audience', 'message_template', 
            'scheduled_send', 'budget', 'personalization_data'
        ]

    def validate_audience(self, value):
        """Validate that user has access to the audience"""
        request = self.context.get('request')
        if request and request.user:
            user = request.user
            # Check if user owns this audience or is an owner
            if hasattr(user, 'role') and user.role == 'owner':
                return value
            elif value.account != user:
                raise serializers.ValidationError("You don't have access to this audience")
        return value


class CampaignMetricsSerializer(serializers.Serializer):
    """Serializer for campaign metrics response"""
    campaign_id = serializers.UUIDField()
    sent_count = serializers.IntegerField()
    delivered_count = serializers.IntegerField()
    opened_count = serializers.IntegerField()
    clicked_count = serializers.IntegerField()
    conversion_count = serializers.IntegerField()
    open_rate = serializers.FloatField()
    click_rate = serializers.FloatField()
    conversion_rate = serializers.FloatField()
    recent_executions = serializers.ListField(child=serializers.DictField())