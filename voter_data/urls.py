from django.urls import path
from . import views

app_name = 'voter_data'

urlpatterns = [
    # Voter records
    path('voters/', views.VoterRecordListCreateView.as_view(), name='voter_list'),
    path('voters/<uuid:pk>/', views.VoterRecordDetailView.as_view(), name='voter_detail'),
    path('voters/<uuid:voter_id>/history/', views.voter_history, name='voter_history'),
    
    # Elections
    path('elections/', views.ElectionListCreateView.as_view(), name='election_list'),
    path('elections/<uuid:pk>/', views.ElectionDetailView.as_view(), name='election_detail'),
    
    # File upload and processing (legacy)
    path('upload/', views.FileUploadView.as_view(), name='file_upload'),
    path('upload/mapping/', views.ColumnMappingView.as_view(), name='column_mapping'),
    path('upload/process/', views.DataProcessingView.as_view(), name='data_processing'),
    
    # New enhanced file upload with deduplication
    path('upload/voter-data/', views.VoterDataUploadView.as_view(), name='voter_data_upload'),
    path('upload/<uuid:upload_id>/process/', views.ProcessUploadView.as_view(), name='process_upload'),
    path('upload/<uuid:upload_id>/status/', views.UploadStatusView.as_view(), name='upload_status'),
    path('deduplicate/', views.DeduplicateExistingView.as_view(), name='deduplicate_existing'),
    
    # Address verification
    path('voters/<uuid:voter_id>/verify-address/', views.verify_voter_address, name='verify_address'),
    path('voters/<uuid:voter_id>/update-addresses/', views.update_voter_addresses, name='update_addresses'),
    path('voters/batch-verify-addresses/', views.batch_verify_voter_addresses, name='batch_verify_addresses'),
    
    # District and office type management
    path('office-types/', views.get_office_types, name='get_office_types'),
    path('validate-office-type/', views.validate_district_office_type, name='validate_office_type'),
    
    # Voter engagement
    path('engagement/', views.VoterEngagementListCreateView.as_view(), name='engagement_list'),
]