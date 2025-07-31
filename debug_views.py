"""
Debug views for API schema issues.
"""
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import json


def schema_debug_view(request):
    """Debug endpoint to help diagnose schema generation issues."""
    
    debug_info = {
        'django_version': getattr(settings, 'DJANGO_VERSION', 'Unknown'),
        'debug_mode': settings.DEBUG,
        'installed_apps': settings.INSTALLED_APPS,
        'rest_framework_config': getattr(settings, 'REST_FRAMEWORK', {}),
        'spectacular_settings': getattr(settings, 'SPECTACULAR_SETTINGS', {}),
    }
    
    # Check if drf-spectacular is available
    try:
        import drf_spectacular
        debug_info['drf_spectacular_available'] = True
        debug_info['drf_spectacular_version'] = getattr(drf_spectacular, '__version__', 'Unknown')
    except ImportError:
        debug_info['drf_spectacular_available'] = False
    
    # Try to generate schema
    schema_generation_result = {}
    if debug_info['drf_spectacular_available']:
        try:
            from drf_spectacular.views import SpectacularAPIView
            view = SpectacularAPIView()
            view.request = request
            response = view.get(request)
            schema_generation_result['success'] = response.status_code == 200
            schema_generation_result['status_code'] = response.status_code
            if hasattr(response, 'data') and isinstance(response.data, dict):
                schema_generation_result['schema_info'] = {
                    'title': response.data.get('info', {}).get('title'),
                    'version': response.data.get('info', {}).get('version'),
                    'paths_count': len(response.data.get('paths', {}))
                }
        except Exception as e:
            schema_generation_result['success'] = False
            schema_generation_result['error'] = str(e)
            schema_generation_result['error_type'] = type(e).__name__
    
    debug_info['schema_generation'] = schema_generation_result
    
    # Test fallback schema
    fallback_result = {}
    try:
        from schema_fallback import FallbackSchemaView
        fallback_view = FallbackSchemaView()
        fallback_view.request = request
        response = fallback_view.get(request)
        fallback_result['success'] = response.status_code == 200
        fallback_result['status_code'] = response.status_code
    except Exception as e:
        fallback_result['success'] = False
        fallback_result['error'] = str(e)
    
    debug_info['fallback_schema'] = fallback_result
    
    return JsonResponse(debug_info, indent=2)


def schema_test_html(request):
    """HTML view to test schema endpoints."""
    
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>API Schema Debug</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    </head>
    <body>
        <div class="container mt-5">
            <h1>API Schema Debug Interface</h1>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5>Schema Endpoints Test</h5>
                        </div>
                        <div class="card-body">
                            <div class="d-grid gap-2">
                                <button class="btn btn-primary" onclick="testEndpoint('/api/schema/')">Test /api/schema/</button>
                                <button class="btn btn-primary" onclick="testEndpoint('/api/docs/')">Test /api/docs/</button>
                                <button class="btn btn-info" onclick="testEndpoint('/debug/schema-info/')">Get Debug Info</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5>Test Results</h5>
                        </div>
                        <div class="card-body">
                            <div id="results" style="max-height: 400px; overflow-y: auto;">
                                <p class="text-muted">Click a test button to see results here.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row mt-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5>Manual Links</h5>
                        </div>
                        <div class="card-body">
                            <ul>
                                <li><a href="/api/schema/" target="_blank">Direct link to /api/schema/</a></li>
                                <li><a href="/api/docs/" target="_blank">Direct link to /api/docs/</a></li>
                                <li><a href="/debug/schema-info/" target="_blank">Debug information (JSON)</a></li>
                                <li><a href="/" target="_blank">Back to home page</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <script>
        function testEndpoint(url) {
            $('#results').html('<div class="spinner-border" role="status"></div> Testing ' + url + '...');
            
            fetch(url)
                .then(response => {
                    const status = response.status;
                    const statusText = response.statusText;
                    
                    return response.text().then(text => {
                        let content;
                        try {
                            content = JSON.stringify(JSON.parse(text), null, 2);
                        } catch(e) {
                            content = text;
                        }
                        
                        let alertClass = status === 200 ? 'alert-success' : 'alert-danger';
                        
                        $('#results').html(`
                            <div class="alert ${alertClass}">
                                <strong>Status:</strong> ${status} ${statusText}
                            </div>
                            <pre style="max-height: 300px; overflow-y: auto; font-size: 12px;">${content}</pre>
                        `);
                    });
                })
                .catch(error => {
                    $('#results').html(`
                        <div class="alert alert-danger">
                            <strong>Error:</strong> ${error.message}
                        </div>
                    `);
                });
        }
        </script>
    </body>
    </html>
    """
    
    return HttpResponse(html_content)