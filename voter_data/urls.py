from django.urls import path
from . import views

app_name = 'voter_data'

urlpatterns = [
    # Voter records
    path('voters/', views.VoterRecordListCreateView.as_view(), name='voter_list'),
    path('voters/<uuid:pk>/', views.VoterRecordDetailView.as_view(), name='voter_detail'),
    
    # Elections
    path('elections/', views.ElectionListCreateView.as_view(), name='election_list'),
    path('elections/<uuid:pk>/', views.ElectionDetailView.as_view(), name='election_detail'),
    
    # File upload and processing
    path('upload/', views.FileUploadView.as_view(), name='file_upload'),
    path('upload/mapping/', views.ColumnMappingView.as_view(), name='column_mapping'),
    path('upload/process/', views.DataProcessingView.as_view(), name='data_processing'),
    
    # Voter engagement
    path('engagement/', views.VoterEngagementListCreateView.as_view(), name='engagement_list'),
]