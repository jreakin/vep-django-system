"""
Minimal URL configuration for testing without drf_spectacular
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints (without documentation for now)
    path('api/auth/', include('authentication.urls')),
    path('api/users/', include('users.urls')),
    path('api/billing/', include('billing.urls')),
    
    # Frontend (placeholder)
    path('', include('frontend.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)