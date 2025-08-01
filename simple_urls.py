"""
Simple URL configuration for demonstration of backend-frontend integration
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json

@csrf_exempt
@require_http_methods(["POST"])
def send_pin(request):
    """Mock PIN sending endpoint"""
    try:
        data = json.loads(request.body)
        phone_number = data.get('phone')
        
        if not phone_number:
            return JsonResponse({'error': 'Phone number is required'}, status=400)
        
        # Mock response for successful PIN sending
        return JsonResponse({
            'message': 'PIN sent successfully',
            'phone': phone_number,
            'success': True
        })
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': 'Failed to send PIN'}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def verify_pin(request):
    """Mock PIN verification endpoint"""
    try:
        data = json.loads(request.body)
        phone_number = data.get('phone')
        pin = data.get('pin')
        
        if not phone_number or not pin:
            return JsonResponse({'error': 'Phone number and PIN are required'}, status=400)
        
        # Mock successful verification for PIN "123456"
        if pin == "123456":
            return JsonResponse({
                'message': 'Authentication successful',
                'token': 'mock-auth-token-12345',
                'user': {
                    'id': 1,
                    'phone': phone_number,
                    'name': 'Demo User'
                },
                'success': True
            })
        else:
            return JsonResponse({'error': 'Invalid PIN'}, status=401)
            
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': 'Verification failed'}, status=500)

def api_status(request):
    """API status endpoint"""
    return JsonResponse({
        'status': 'operational',
        'message': 'Backend API is running',
        'backend': 'Django',
        'frontend_integration': 'enabled'
    })

def campaigns_list(request):
    """Mock campaigns list"""
    return JsonResponse({
        'campaigns': [
            {'id': 1, 'name': 'Demo Campaign 2024', 'status': 'active'},
            {'id': 2, 'name': 'Local Election Campaign', 'status': 'draft'},
        ],
        'count': 2
    })

def dashboard_data(request):
    """Mock dashboard data"""
    return JsonResponse({
        'total_campaigns': 2,
        'active_campaigns': 1,
        'total_voters': 15000,
        'engagement_rate': 0.75,
        'recent_activity': [
            {'action': 'Campaign created', 'timestamp': '2024-01-01T10:00:00Z'},
            {'action': 'Voter data updated', 'timestamp': '2024-01-01T09:30:00Z'},
        ]
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/status/', api_status, name='api_status'),
    path('api/auth/send-pin/', send_pin, name='send_pin'),
    path('api/auth/verify-pin/', verify_pin, name='verify_pin'),
    path('api/campaigns/', campaigns_list, name='campaigns_list'),
    path('api/dashboard/', dashboard_data, name='dashboard_data'),
]