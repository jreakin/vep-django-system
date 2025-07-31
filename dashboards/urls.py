from django.urls import path
from . import views

app_name = 'dashboards'

urlpatterns = [
    # Dashboards
    path('', views.DashboardListCreateView.as_view(), name='dashboard_list'),
    path('<uuid:pk>/', views.DashboardDetailView.as_view(), name='dashboard_detail'),
    path('stats/', views.dashboard_stats, name='dashboard_stats'),
    
    # Notifications
    path('notifications/', views.NotificationListView.as_view(), name='notification_list'),
    path('notifications/<uuid:pk>/', views.NotificationDetailView.as_view(), name='notification_detail'),
    path('notifications/count/', views.notification_count, name='notification_count'),
    path('notifications/mark-read/', views.MarkNotificationsReadView.as_view(), name='mark_notifications_read'),
    path('notifications/create/', views.create_notification, name='create_notification'),
    
    # Audit logs
    path('audit-logs/', views.AuditLogListView.as_view(), name='audit_log_list'),
    
    # Charts
    path('charts/', views.ChartConfigListCreateView.as_view(), name='chart_list'),
    path('charts/<uuid:pk>/', views.ChartConfigDetailView.as_view(), name='chart_detail'),
    
    # File uploads
    path('uploads/', views.FileUploadListView.as_view(), name='upload_list'),
]