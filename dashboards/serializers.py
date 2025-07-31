from rest_framework import serializers
from .models import Dashboard, AuditLog, Notification, ChartConfig, FileUpload


class DashboardSerializer(serializers.ModelSerializer):
    """Serializer for Dashboard model."""
    
    shared_with_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Dashboard
        fields = [
            'id', 'name', 'config', 'is_private', 'shared_with',
            'shared_with_details', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'shared_with_details']
    
    def get_shared_with_details(self, obj):
        """Get details of users the dashboard is shared with."""
        return [
            {
                'id': str(user.id),
                'phone_number': user.phone_number,
                'role': user.role
            }
            for user in obj.shared_with.all()
        ]


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for AuditLog model."""
    
    user_details = serializers.SerializerMethodField()
    content_type_name = serializers.SerializerMethodField()
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_details', 'action', 'content_type', 
            'content_type_name', 'object_id', 'changes', 'ip_address', 
            'user_agent', 'timestamp'
        ]
        read_only_fields = '__all__'
    
    def get_user_details(self, obj):
        """Get user details."""
        if obj.user:
            return {
                'id': str(obj.user.id),
                'phone_number': obj.user.phone_number,
                'role': obj.user.role
            }
        return None
    
    def get_content_type_name(self, obj):
        """Get content type name."""
        if obj.content_type:
            return obj.content_type.model
        return None


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model."""
    
    content_type_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'notification_type', 'content_type',
            'content_type_name', 'object_id', 'is_read', 'read_at',
            'created_at', 'action_url', 'action_data'
        ]
        read_only_fields = ['id', 'created_at', 'content_type_name']
    
    def get_content_type_name(self, obj):
        """Get content type name."""
        if obj.content_type:
            return obj.content_type.model
        return None


class ChartConfigSerializer(serializers.ModelSerializer):
    """Serializer for ChartConfig model."""
    
    shared_with_details = serializers.SerializerMethodField()
    dashboards_details = serializers.SerializerMethodField()
    
    class Meta:
        model = ChartConfig
        fields = [
            'id', 'name', 'description', 'chart_type', 'data_source',
            'query_config', 'display_config', 'is_public', 'shared_with',
            'shared_with_details', 'dashboards', 'dashboards_details',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'shared_with_details', 'dashboards_details']
    
    def get_shared_with_details(self, obj):
        """Get details of users the chart is shared with."""
        return [
            {
                'id': str(user.id),
                'phone_number': user.phone_number,
                'role': user.role
            }
            for user in obj.shared_with.all()
        ]
    
    def get_dashboards_details(self, obj):
        """Get details of dashboards this chart is added to."""
        return [
            {
                'id': str(dashboard.id),
                'name': dashboard.name
            }
            for dashboard in obj.dashboards.all()
        ]


class FileUploadSerializer(serializers.ModelSerializer):
    """Serializer for FileUpload model."""
    
    user_details = serializers.SerializerMethodField()
    
    class Meta:
        model = FileUpload
        fields = [
            'id', 'user', 'user_details', 'original_filename', 'file_type',
            'file_size', 'status', 'progress_percent', 'error_message',
            'records_total', 'records_processed', 'records_created',
            'records_updated', 'records_duplicates', 'records_errors',
            'created_at', 'completed_at'
        ]
        read_only_fields = '__all__'
    
    def get_user_details(self, obj):
        """Get user details."""
        return {
            'id': str(obj.user.id),
            'phone_number': obj.user.phone_number,
            'role': obj.user.role
        }