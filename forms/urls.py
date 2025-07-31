from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'templates', views.FormTemplateViewSet)
router.register(r'fields', views.FormFieldViewSet)
router.register(r'responses', views.FormResponseViewSet)
router.register(r'shares', views.FormShareViewSet)
router.register(r'analytics', views.FormAnalyticsViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('templates/<uuid:template_id>/render/', views.render_form, name='render-form'),
    path('templates/<uuid:template_id>/submit/', views.submit_form, name='submit-form'),
    path('templates/<uuid:template_id>/preview/', views.preview_form, name='preview-form'),
    path('templates/<uuid:template_id>/duplicate/', views.duplicate_form, name='duplicate-form'),
    path('shared/<str:share_url>/', views.shared_form_view, name='shared-form'),
    path('builder/field-types/', views.get_field_types, name='field-types'),
]
