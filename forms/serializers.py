from rest_framework import serializers
from .models import FormTemplate, FormField, FormResponse, FormShare, FormAnalytics


class FormFieldSerializer(serializers.ModelSerializer):
    """Serializer for FormField model."""
    
    class Meta:
        model = FormField
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class FormTemplateSerializer(serializers.ModelSerializer):
    """Serializer for FormTemplate model."""
    
    form_fields = FormFieldSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.phone_number', read_only=True)
    
    class Meta:
        model = FormTemplate
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'published_at')


class FormResponseSerializer(serializers.ModelSerializer):
    """Serializer for FormResponse model."""
    
    form_template_name = serializers.CharField(source='form_template.name', read_only=True)
    submitted_by_name = serializers.CharField(source='submitted_by.phone_number', read_only=True)
    
    class Meta:
        model = FormResponse
        fields = '__all__'
        read_only_fields = ('id', 'submitted_at', 'processed_at')


class FormShareSerializer(serializers.ModelSerializer):
    """Serializer for FormShare model."""
    
    form_template_name = serializers.CharField(source='form_template.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.phone_number', read_only=True)
    
    class Meta:
        model = FormShare
        fields = '__all__'
        read_only_fields = ('id', 'share_url', 'view_count', 'submission_count', 'created_at')


class FormAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer for FormAnalytics model."""
    
    form_template_name = serializers.CharField(source='form_template.name', read_only=True)
    
    class Meta:
        model = FormAnalytics
        fields = '__all__'
        read_only_fields = ('calculated_at',)


class DynamicFormSerializer(serializers.Serializer):
    """Dynamic serializer for form submissions based on form template."""
    
    def __init__(self, *args, **kwargs):
        form_template = kwargs.pop('form_template', None)
        super().__init__(*args, **kwargs)
        
        if form_template:
            # Dynamically add fields based on form template
            for field_def in form_template.form_fields.all():
                field_kwargs = {
                    'required': field_def.is_required,
                    'help_text': field_def.help_text,
                    'label': field_def.label,
                }
                
                if field_def.default_value:
                    field_kwargs['default'] = field_def.default_value
                
                # Map field types to serializer fields
                if field_def.field_type == 'text':
                    self.fields[field_def.field_name] = serializers.CharField(**field_kwargs)
                elif field_def.field_type == 'textarea':
                    self.fields[field_def.field_name] = serializers.CharField(style={'base_template': 'textarea.html'}, **field_kwargs)
                elif field_def.field_type == 'email':
                    self.fields[field_def.field_name] = serializers.EmailField(**field_kwargs)
                elif field_def.field_type == 'phone':
                    self.fields[field_def.field_name] = serializers.CharField(max_length=20, **field_kwargs)
                elif field_def.field_type == 'number':
                    self.fields[field_def.field_name] = serializers.FloatField(**field_kwargs)
                elif field_def.field_type == 'date':
                    self.fields[field_def.field_name] = serializers.DateField(**field_kwargs)
                elif field_def.field_type == 'datetime':
                    self.fields[field_def.field_name] = serializers.DateTimeField(**field_kwargs)
                elif field_def.field_type == 'boolean':
                    self.fields[field_def.field_name] = serializers.BooleanField(**field_kwargs)
                elif field_def.field_type in ['select', 'radio']:
                    choices = [(opt['value'], opt['label']) for opt in field_def.options]
                    self.fields[field_def.field_name] = serializers.ChoiceField(choices=choices, **field_kwargs)
                elif field_def.field_type == 'checkbox':
                    self.fields[field_def.field_name] = serializers.MultipleChoiceField(
                        choices=[(opt['value'], opt['label']) for opt in field_def.options],
                        **field_kwargs
                    )
                else:
                    # Default to CharField for unknown types
                    self.fields[field_def.field_name] = serializers.CharField(**field_kwargs)
