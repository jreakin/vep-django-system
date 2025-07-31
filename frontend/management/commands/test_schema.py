"""
Django management command to test and debug API schema generation.
"""
from django.core.management.base import BaseCommand
from django.conf import settings
import json


class Command(BaseCommand):
    help = 'Test API schema generation and identify issues'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Testing API schema generation...'))
        
        # Test 1: Check if drf-spectacular is available
        try:
            import drf_spectacular
            self.stdout.write(self.style.SUCCESS('✓ drf-spectacular is available'))
            
            # Test 2: Try to import the main views
            try:
                from drf_spectacular.views import SpectacularAPIView
                self.stdout.write(self.style.SUCCESS('✓ SpectacularAPIView imports successfully'))
                
                # Test 3: Try to instantiate the view
                try:
                    view = SpectacularAPIView()
                    self.stdout.write(self.style.SUCCESS('✓ SpectacularAPIView instantiates successfully'))
                    
                    # Test 4: Try to generate schema
                    try:
                        from django.test import RequestFactory
                        factory = RequestFactory()
                        request = factory.get('/api/schema/')
                        
                        # Set up the request properly
                        from django.contrib.auth.models import AnonymousUser
                        request.user = AnonymousUser()
                        
                        view.request = request
                        response = view.get(request)
                        
                        if response.status_code == 200:
                            self.stdout.write(self.style.SUCCESS('✓ Schema generation successful'))
                            
                            # Display some schema info
                            if hasattr(response, 'data'):
                                schema = response.data
                                if isinstance(schema, dict):
                                    self.stdout.write(f"Schema title: {schema.get('info', {}).get('title', 'N/A')}")
                                    self.stdout.write(f"Schema version: {schema.get('info', {}).get('version', 'N/A')}")
                                    paths_count = len(schema.get('paths', {}))
                                    self.stdout.write(f"Number of API paths: {paths_count}")
                        else:
                            self.stdout.write(self.style.ERROR(f'✗ Schema generation failed with status {response.status_code}'))
                            
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f'✗ Schema generation failed: {str(e)}'))
                        self.stdout.write(self.style.WARNING('This is likely the root cause of the API documentation issue.'))
                        
                        # Provide debugging information
                        self.stdout.write('\nDebugging information:')
                        self.stdout.write(f'Error type: {type(e).__name__}')
                        self.stdout.write(f'Error details: {str(e)}')
                        
                        # Check common issues
                        self.check_common_issues()
                        
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'✗ Cannot instantiate SpectacularAPIView: {str(e)}'))
                    
            except ImportError as e:
                self.stdout.write(self.style.ERROR(f'✗ Cannot import SpectacularAPIView: {str(e)}'))
                
        except ImportError:
            self.stdout.write(self.style.ERROR('✗ drf-spectacular is not available'))
            self.stdout.write(self.style.WARNING('This explains why the API documentation is not working.'))
            self.stdout.write('Please install drf-spectacular: pip install drf-spectacular')
        
        # Test 5: Check REST framework configuration
        self.check_rest_framework_config()
        
        # Test 6: Test our fallback schema
        self.test_fallback_schema()
    
    def check_common_issues(self):
        """Check for common schema generation issues."""
        self.stdout.write('\nChecking for common issues:')
        
        # Check if all installed apps are importable
        from django.apps import apps
        app_configs = apps.get_app_configs()
        
        for app_config in app_configs:
            try:
                # Try to import the app's models
                app_config.get_models()
                
                # Try to import views if they exist
                try:
                    views_module = f"{app_config.name}.views"
                    __import__(views_module)
                except ImportError:
                    pass  # Views module doesn't exist, that's OK
                    
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'  Issue with app {app_config.name}: {str(e)}'))
    
    def check_rest_framework_config(self):
        """Check REST framework configuration."""
        self.stdout.write('\nChecking REST Framework configuration:')
        
        rest_config = getattr(settings, 'REST_FRAMEWORK', {})
        schema_class = rest_config.get('DEFAULT_SCHEMA_CLASS')
        
        if schema_class:
            self.stdout.write(f'✓ DEFAULT_SCHEMA_CLASS: {schema_class}')
        else:
            self.stdout.write(self.style.WARNING('! No DEFAULT_SCHEMA_CLASS configured'))
        
        # Check spectacular settings
        spectacular_settings = getattr(settings, 'SPECTACULAR_SETTINGS', {})
        if spectacular_settings:
            self.stdout.write('✓ SPECTACULAR_SETTINGS configured')
        else:
            self.stdout.write(self.style.WARNING('! No SPECTACULAR_SETTINGS configured'))
    
    def test_fallback_schema(self):
        """Test our fallback schema generation."""
        self.stdout.write('\nTesting fallback schema:')
        
        try:
            from schema_fallback import FallbackSchemaView
            
            from django.test import RequestFactory
            factory = RequestFactory()
            request = factory.get('/api/schema/')
            
            view = FallbackSchemaView()
            view.request = request
            response = view.get(request)
            
            if response.status_code == 200:
                self.stdout.write(self.style.SUCCESS('✓ Fallback schema generation works'))
            else:
                self.stdout.write(self.style.ERROR(f'✗ Fallback schema failed with status {response.status_code}'))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Fallback schema failed: {str(e)}'))