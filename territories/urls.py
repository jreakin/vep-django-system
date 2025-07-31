from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'territories', views.TerritoryViewSet)
router.register(r'walk-lists', views.WalkListTerritoryViewSet)
router.register(r'assignments', views.TerritoryAssignmentViewSet)
router.register(r'routes', views.CanvassRouteViewSet)
router.register(r'analytics', views.TerritoryAnalyticsViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('territories/<uuid:territory_id>/assign-voters/', views.assign_voters_to_territory, name='assign-voters-to-territory'),
    path('territories/<uuid:territory_id>/spatial-query/', views.spatial_query_voters, name='spatial-query-voters'),
    path('walk-lists/<uuid:walk_list_id>/generate-route/', views.generate_canvass_route, name='generate-canvass-route'),
    path('walk-lists/<uuid:walk_list_id>/optimize-route/', views.optimize_canvass_route, name='optimize-canvass-route'),
]
