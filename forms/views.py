from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.gis.geos import Point
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from .models import FormTemplate, FormField, FormResponse, FormShare, FormAnalytics
from .serializers import (
    FormTemplateSerializer, 
    FormFieldSerializer, 
    FormResponseSerializer,
    FormShareSerializer, 
    FormAnalyticsSerializer,
    DynamicFormSerializer
)
import uuid
import json
import logging

logger = logging.getLogger(__name__)


class FormTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for FormTemplate management."""
    
    queryset = FormTemplate.objects.all()
    serializer_class = FormTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = FormTemplate.objects.all()
        
        # Filter by form type
        form_type = self.request.query_params.get('form_type')
        if form_type:
            queryset = queryset.filter(form_type=form_type)
        
        # Filter by status
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by campaign
        campaign_id = self.request.query_params.get('campaign_id')
        if campaign_id:
            queryset = queryset.filter(campaign_id=campaign_id)
        
        # Filter by current version only
        current_only = self.request.query_params.get('current_only')
        if current_only == 'true':
            queryset = queryset.filter(is_current_version=True)
        
        return queryset.select_related('created_by').prefetch_related('form_fields')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class FormFieldViewSet(viewsets.ModelViewSet):
    """ViewSet for FormField management."""
    
    queryset = FormField.objects.all()
    serializer_class = FormFieldSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = FormField.objects.all()
        
        # Filter by form template
        form_template_id = self.request.query_params.get('form_template_id')
        if form_template_id:
            queryset = queryset.filter(form_template_id=form_template_id)
        
        return queryset.select_related('form_template').order_by('order')


class FormResponseViewSet(viewsets.ModelViewSet):
    """ViewSet for FormResponse management."""
    
    queryset = FormResponse.objects.all()
    serializer_class = FormResponseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = FormResponse.objects.all()
        
        # Filter by form template
        form_template_id = self.request.query_params.get('form_template_id')
        if form_template_id:
            queryset = queryset.filter(form_template_id=form_template_id)
        
        # Filter by status
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by GPS verification
        gps_verified = self.request.query_params.get('gps_verified')
        if gps_verified is not None:
            queryset = queryset.filter(is_gps_verified=gps_verified.lower() == 'true')
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(submitted_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(submitted_at__lte=date_to)
        
        return queryset.select_related('form_template', 'submitted_by').order_by('-submitted_at')


class FormShareViewSet(viewsets.ModelViewSet):
    """ViewSet for FormShare management."""
    
    queryset = FormShare.objects.all()
    serializer_class = FormShareSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = FormShare.objects.all()
        
        # Filter by form template
        form_template_id = self.request.query_params.get('form_template_id')
        if form_template_id:
            queryset = queryset.filter(form_template_id=form_template_id)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset.select_related('form_template', 'created_by')
    
    def perform_create(self, serializer):
        # Generate unique share URL
        share_url = str(uuid.uuid4())
        serializer.save(
            created_by=self.request.user,
            share_url=share_url
        )


class FormAnalyticsViewSet(viewsets.ModelViewSet):
    """ViewSet for FormAnalytics management."""
    
    queryset = FormAnalytics.objects.all()
    serializer_class = FormAnalyticsSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = FormAnalytics.objects.all()
        
        # Filter by form template
        form_template_id = self.request.query_params.get('form_template_id')
        if form_template_id:
            queryset = queryset.filter(form_template_id=form_template_id)
        
        return queryset.select_related('form_template')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def render_form(request, template_id):
    """Render form template as dynamic form structure."""
    
    try:
        template = FormTemplate.objects.prefetch_related('form_fields').get(id=template_id)
    except FormTemplate.DoesNotExist:
        return Response(
            {'error': 'Form template not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check access permissions
    if (template.created_by != request.user and 
        not template.shared_with.filter(id=request.user.id).exists() and 
        not template.is_public):
        return Response(
            {'error': 'Access denied'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Build form structure
    form_structure = {
        'id': template.id,
        'name': template.name,
        'description': template.description,
        'form_type': template.form_type,
        'styling': template.styling,
        'validation_rules': template.validation_rules,
        'fields': []
    }
    
    # Add fields in order
    for field in template.form_fields.order_by('order'):
        field_data = {
            'id': field.id,
            'field_name': field.field_name,
            'field_type': field.field_type,
            'label': field.label,
            'placeholder': field.placeholder,
            'help_text': field.help_text,
            'is_required': field.is_required,
            'default_value': field.default_value,
            'options': field.options,
            'validation_rules': field.validation_rules,
            'width': field.width,
            'is_conditional': field.is_conditional,
            'show_condition': field.show_condition,
        }
        form_structure['fields'].append(field_data)
    
    return Response(form_structure)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_form(request, template_id):
    """Submit form response with validation and GPS verification."""
    
    try:
        template = FormTemplate.objects.prefetch_related('form_fields').get(id=template_id)
    except FormTemplate.DoesNotExist:
        return Response(
            {'error': 'Form template not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Validate form data using dynamic serializer
    serializer = DynamicFormSerializer(data=request.data, form_template=template)
    
    if not serializer.is_valid():
        return Response(
            {'error': 'Form validation failed', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Extract form data and metadata
    form_data = serializer.validated_data
    metadata = {
        'user_agent': request.META.get('HTTP_USER_AGENT', ''),
        'ip_address': request.META.get('REMOTE_ADDR', ''),
        'submitted_at': timezone.now().isoformat(),
    }
    
    # GPS location handling
    submission_location = {}
    is_gps_verified = False
    
    location_data = request.data.get('location')
    if location_data:
        try:
            lat = float(location_data.get('latitude'))
            lng = float(location_data.get('longitude'))
            accuracy = float(location_data.get('accuracy', 0))
            
            submission_location = {
                'latitude': lat,
                'longitude': lng,
                'accuracy': accuracy,
                'timestamp': location_data.get('timestamp', timezone.now().timestamp())
            }
            
            # Simple GPS verification (in real implementation, check against walk list requirements)
            is_gps_verified = accuracy <= 100  # Within 100 meters accuracy
            
        except (ValueError, TypeError):
            logger.warning(f"Invalid location data for form submission: {location_data}")
    
    # Create form response
    with transaction.atomic():
        response = FormResponse.objects.create(
            form_template=template,
            response_data=form_data,
            metadata=metadata,
            submitted_by=request.user,
            voter_id=request.data.get('voter_id'),
            walk_list_id=request.data.get('walk_list_id'),
            submission_location=submission_location,
            is_gps_verified=is_gps_verified,
            status='submitted'
        )
        
        # Update form analytics
        analytics, created = FormAnalytics.objects.get_or_create(
            form_template=template,
            defaults={
                'total_responses': 0,
                'completed_responses': 0,
                'completion_rate': 0.0,
            }
        )
        
        analytics.total_responses += 1
        if response.status == 'completed':
            analytics.completed_responses += 1
        
        if analytics.total_responses > 0:
            analytics.completion_rate = analytics.completed_responses / analytics.total_responses
        
        analytics.save()
    
    return Response({
        'response_id': response.id,
        'status': response.status,
        'is_gps_verified': response.is_gps_verified,
        'submitted_at': response.submitted_at,
        'message': 'Form submitted successfully'
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def preview_form(request, template_id):
    """Preview form template with sample data."""
    
    try:
        template = FormTemplate.objects.prefetch_related('form_fields').get(id=template_id)
    except FormTemplate.DoesNotExist:
        return Response(
            {'error': 'Form template not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get form structure
    form_response = render_form(request, template_id)
    form_structure = form_response.data
    
    # Add sample data for preview
    sample_data = {}
    for field in form_structure['fields']:
        field_type = field['field_type']
        field_name = field['field_name']
        
        if field_type == 'text':
            sample_data[field_name] = 'Sample text'
        elif field_type == 'email':
            sample_data[field_name] = 'sample@example.com'
        elif field_type == 'phone':
            sample_data[field_name] = '(555) 123-4567'
        elif field_type == 'number':
            sample_data[field_name] = 42
        elif field_type == 'date':
            sample_data[field_name] = '2024-01-15'
        elif field_type in ['select', 'radio'] and field['options']:
            sample_data[field_name] = field['options'][0]['value']
        elif field_type == 'checkbox' and field['options']:
            sample_data[field_name] = [field['options'][0]['value']]
        elif field_type == 'boolean':
            sample_data[field_name] = True
        elif field_type == 'rating':
            sample_data[field_name] = 4
        else:
            sample_data[field_name] = field.get('default_value', '')
    
    return Response({
        'form_structure': form_structure,
        'sample_data': sample_data,
        'preview_mode': True
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def duplicate_form(request, template_id):
    """Duplicate form template with new name."""
    
    try:
        original_template = FormTemplate.objects.prefetch_related('form_fields').get(id=template_id)
    except FormTemplate.DoesNotExist:
        return Response(
            {'error': 'Form template not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    new_name = request.data.get('name', f"{original_template.name} (Copy)")
    
    with transaction.atomic():
        # Create new template
        new_template = FormTemplate.objects.create(
            name=new_name,
            form_type=original_template.form_type,
            description=original_template.description,
            validation_rules=original_template.validation_rules,
            styling=original_template.styling,
            created_by=request.user,
            status='draft'
        )
        
        # Duplicate fields
        for field in original_template.form_fields.all():
            FormField.objects.create(
                form_template=new_template,
                field_name=field.field_name,
                field_type=field.field_type,
                label=field.label,
                placeholder=field.placeholder,
                help_text=field.help_text,
                is_required=field.is_required,
                default_value=field.default_value,
                options=field.options,
                validation_rules=field.validation_rules,
                order=field.order,
                width=field.width,
                is_conditional=field.is_conditional,
                show_condition=field.show_condition,
            )
    
    return Response({
        'new_template_id': new_template.id,
        'name': new_template.name,
        'message': 'Form template duplicated successfully'
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([AllowAny])
def shared_form_view(request, share_url):
    """Access form via shared URL."""
    
    try:
        form_share = FormShare.objects.select_related('form_template').get(
            share_url=share_url,
            is_active=True
        )
    except FormShare.DoesNotExist:
        return Response(
            {'error': 'Shared form not found or expired'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check expiration
    if form_share.expires_at and timezone.now() > form_share.expires_at:
        return Response(
            {'error': 'Shared form has expired'}, 
            status=status.HTTP_410_GONE
        )
    
    # Check submission limits
    if (form_share.max_submissions and 
        form_share.submission_count >= form_share.max_submissions):
        return Response(
            {'error': 'Maximum submissions reached'}, 
            status=status.HTTP_429_TOO_MANY_REQUESTS
        )
    
    # Update view count
    form_share.view_count += 1
    form_share.save(update_fields=['view_count'])
    
    # Get form structure (similar to render_form but without authentication)
    template = form_share.form_template
    
    form_structure = {
        'id': template.id,
        'name': template.name,
        'description': template.description,
        'form_type': template.form_type,
        'styling': template.styling,
        'fields': []
    }
    
    for field in template.form_fields.order_by('order'):
        field_data = {
            'id': field.id,
            'field_name': field.field_name,
            'field_type': field.field_type,
            'label': field.label,
            'placeholder': field.placeholder,
            'help_text': field.help_text,
            'is_required': field.is_required,
            'default_value': field.default_value,
            'options': field.options,
            'width': field.width,
        }
        form_structure['fields'].append(field_data)
    
    return Response({
        'form_structure': form_structure,
        'share_info': {
            'access_type': form_share.access_type,
            'expires_at': form_share.expires_at,
            'max_submissions': form_share.max_submissions,
            'submission_count': form_share.submission_count,
        },
        'shared': True
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_field_types(request):
    """Get available form field types and their configurations."""
    
    field_types = [
        {
            'value': 'text',
            'label': 'Text Input',
            'category': 'Basic',
            'supports_options': False,
            'supports_validation': True,
            'description': 'Single line text input'
        },
        {
            'value': 'textarea',
            'label': 'Text Area',
            'category': 'Basic',
            'supports_options': False,
            'supports_validation': True,
            'description': 'Multi-line text input'
        },
        {
            'value': 'email',
            'label': 'Email',
            'category': 'Basic',
            'supports_options': False,
            'supports_validation': True,
            'description': 'Email address input with validation'
        },
        {
            'value': 'phone',
            'label': 'Phone Number',
            'category': 'Basic',
            'supports_options': False,
            'supports_validation': True,
            'description': 'Phone number input'
        },
        {
            'value': 'number',
            'label': 'Number',
            'category': 'Basic',
            'supports_options': False,
            'supports_validation': True,
            'description': 'Numeric input'
        },
        {
            'value': 'date',
            'label': 'Date',
            'category': 'Date/Time',
            'supports_options': False,
            'supports_validation': True,
            'description': 'Date picker'
        },
        {
            'value': 'time',
            'label': 'Time',
            'category': 'Date/Time',
            'supports_options': False,
            'supports_validation': True,
            'description': 'Time picker'
        },
        {
            'value': 'datetime',
            'label': 'Date & Time',
            'category': 'Date/Time',
            'supports_options': False,
            'supports_validation': True,
            'description': 'Date and time picker'
        },
        {
            'value': 'select',
            'label': 'Dropdown',
            'category': 'Choice',
            'supports_options': True,
            'supports_validation': True,
            'description': 'Dropdown selection'
        },
        {
            'value': 'radio',
            'label': 'Radio Buttons',
            'category': 'Choice',
            'supports_options': True,
            'supports_validation': True,
            'description': 'Single choice from multiple options'
        },
        {
            'value': 'checkbox',
            'label': 'Checkboxes',
            'category': 'Choice',
            'supports_options': True,
            'supports_validation': True,
            'description': 'Multiple choice selection'
        },
        {
            'value': 'boolean',
            'label': 'Yes/No',
            'category': 'Choice',
            'supports_options': False,
            'supports_validation': False,
            'description': 'Boolean switch'
        },
        {
            'value': 'file',
            'label': 'File Upload',
            'category': 'Special',
            'supports_options': False,
            'supports_validation': True,
            'description': 'File upload input'
        },
        {
            'value': 'signature',
            'label': 'Digital Signature',
            'category': 'Special',
            'supports_options': False,
            'supports_validation': True,
            'description': 'Digital signature capture'
        },
        {
            'value': 'rating',
            'label': 'Rating Scale',
            'category': 'Special',
            'supports_options': False,
            'supports_validation': True,
            'description': 'Star rating or numeric scale'
        },
        {
            'value': 'location',
            'label': 'Location Picker',
            'category': 'Special',
            'supports_options': False,
            'supports_validation': True,
            'description': 'GPS location capture'
        },
        {
            'value': 'hidden',
            'label': 'Hidden Field',
            'category': 'Special',
            'supports_options': False,
            'supports_validation': False,
            'description': 'Hidden field for system data'
        },
    ]
    
    return Response({'field_types': field_types})
