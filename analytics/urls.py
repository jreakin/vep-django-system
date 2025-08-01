from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'queries', views.AnalyticsQueryViewSet)
router.register(r'dashboards', views.AnalyticsDashboardViewSet)
router.register(r'widgets', views.AnalyticsWidgetViewSet)
router.register(r'models', views.PredictiveModelViewSet)
router.register(r'predictions', views.ModelPredictionViewSet)
router.register(r'sessions', views.AnalyticsSessionViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('nlp-query/', views.process_nlp_query, name='nlp-query'),
    path('query/<uuid:query_id>/results/', views.get_query_results, name='query-results'),
    path('dashboard/<uuid:dashboard_id>/refresh/', views.refresh_dashboard, name='refresh-dashboard'),
    path('widget/<uuid:widget_id>/data/', views.get_widget_data, name='widget-data'),
    path('predictions/batch/', views.batch_predict, name='batch-predict'),
    path('insights/generate/', views.generate_insights, name='generate-insights'),
    path('3d-model/', views.generate_3d_model, name='generate-3d-model'),
    path('3d-model-url/', views.get_3d_model_url, name='get-3d-model-url'),
]
