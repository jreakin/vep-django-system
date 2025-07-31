from django.contrib import admin
from django.utils.html import format_html
from .models import FormTemplate, FormField, FormResponse, FormShare, FormAnalytics


@admin.register(FormTemplate)
class FormTemplateAdmin(admin.ModelAdmin):
    """Admin interface for FormTemplate."""
    
    list_display = ['name', 'form_type', 'status', 'created_by', 'is_current_version', 'created_at']
    list_filter = ['form_type', 'status', 'is_current_version', 'requires_login', 'created_at']
    search_fields = ['name', 'description', 'created_by__phone_number']
    readonly_fields = ['id', 'created_at', 'updated_at', 'published_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'form_type', 'description', 'status')
        }),
        ('Configuration', {
            'fields': ('fields', 'validation_rules', 'styling')
        }),
        ('Access Control', {
            'fields': ('created_by', 'shared_with', 'is_public', 'requires_login')
        }),
        ('Campaign Context', {
            'fields': ('campaign_id', 'walk_list_ids')
        }),
        ('Version Control', {
            'fields': ('version', 'is_current_version', 'parent_form')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at', 'published_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(FormField)
class FormFieldAdmin(admin.ModelAdmin):
    """Admin interface for FormField."""
    
    list_display = ['form_template', 'field_name', 'field_type', 'label', 'is_required', 'order']
    list_filter = ['field_type', 'is_required', 'is_conditional']
    search_fields = ['form_template__name', 'field_name', 'label']
    ordering = ['form_template', 'order']


@admin.register(FormResponse)
class FormResponseAdmin(admin.ModelAdmin):
    """Admin interface for FormResponse."""
    
    list_display = ['form_template', 'submitted_by', 'status', 'is_gps_verified', 'submitted_at']
    list_filter = ['status', 'is_gps_verified', 'submitted_at']
    search_fields = ['form_template__name', 'submitted_by__phone_number', 'voter_id']
    readonly_fields = ['id', 'submitted_at', 'processed_at']
    ordering = ['-submitted_at']


@admin.register(FormShare)
class FormShareAdmin(admin.ModelAdmin):
    """Admin interface for FormShare."""
    
    list_display = ['form_template', 'access_type', 'share_url', 'is_active', 'view_count', 'submission_count']
    list_filter = ['access_type', 'is_active', 'created_at']
    search_fields = ['form_template__name', 'share_url']
    readonly_fields = ['share_url', 'view_count', 'submission_count', 'created_at']


@admin.register(FormAnalytics)
class FormAnalyticsAdmin(admin.ModelAdmin):
    """Admin interface for FormAnalytics."""
    
    list_display = ['form_template', 'total_responses', 'completion_rate', 'calculated_at']
    list_filter = ['calculated_at']
    search_fields = ['form_template__name']
    readonly_fields = ['calculated_at']
    ordering = ['-calculated_at']
