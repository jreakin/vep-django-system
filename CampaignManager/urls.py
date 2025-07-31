"""
URL configuration for CampaignManager project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # API endpoints
    path('api/auth/', include('authentication.urls')),
    path('api/users/', include('users.urls')),
    path('api/billing/', include('billing.urls')),
    path('api/voter-data/', include('voter_data.urls')),
    path('api/dashboards/', include('dashboards.urls')),
    path('api/integrations/', include('integrations.urls')),
    path('api/canvassing/', include('canvassing.urls')),
    path('api/campaigns/', include('campaigns.urls')),
    path('api/forms/', include('forms.urls')),
    path('api/territories/', include('territories.urls')),
    path('api/redistricting/', include('redistricting.urls')),
    path('api/analytics/', include('analytics.urls')),
    
    # Impersonation
    path('impersonate/', include('impersonate.urls')),
    
    # Frontend (placeholder)
    path('', include('frontend.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
