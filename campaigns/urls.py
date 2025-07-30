from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'campaigns'

# DRF Router for API endpoints
router = DefaultRouter()
router.register(r'campaigns', views.CampaignViewSet, basename='campaign')
router.register(r'audiences', views.AudienceViewSet, basename='audience')

urlpatterns = [
    # Main campaign management dashboard
    path('', views.campaign_management, name='campaign_management'),
    
    # DRF API endpoints
    path('api/', include(router.urls)),
    
    # Fallback API endpoints (non-DRF)
    path('api/campaigns/', views.CampaignAPIView.as_view(), name='campaign_api'),
    path('api/audiences/', views.AudienceAPIView.as_view(), name='audience_api'),
]