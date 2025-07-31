from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'plans', views.RedistrictingPlanViewSet)
router.register(r'districts', views.DistrictViewSet)
router.register(r'comparisons', views.PlanComparisonViewSet)
router.register(r'metrics', views.PlanMetricsViewSet)
router.register(r'comments', views.PlanCommentViewSet)
router.register(r'exports', views.PlanExportViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('plans/<uuid:plan_id>/validate/', views.validate_plan, name='validate-plan'),
    path('plans/<uuid:plan_id>/calculate-metrics/', views.calculate_plan_metrics, name='calculate-plan-metrics'),
    path('plans/<uuid:plan_id>/compare/', views.compare_plans, name='compare-plans'),
    path('plans/<uuid:plan_id>/export/<str:format>/', views.export_plan, name='export-plan'),
    path('districts/<uuid:district_id>/demographics/', views.get_district_demographics, name='district-demographics'),
    path('upload/shapefile/', views.upload_shapefile, name='upload-shapefile'),
    path('import/plan/', views.import_plan, name='import-plan'),
]
