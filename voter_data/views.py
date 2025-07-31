from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db import models
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from drf_spectacular.utils import extend_schema
from .models import VoterRecord, Election, ElectionData, EarlyVoteRecord, VoterEngagement
from .serializers import (
    VoterRecordSerializer, ElectionSerializer, ElectionDataSerializer,
    EarlyVoteRecordSerializer, VoterEngagementSerializer, FileUploadSerializer,
    ColumnMappingSerializer, EnhancedVoterRecordSerializer
)
from .utils import update_addresses, validate_office_type, get_valid_office_types_for_district
from .tasks import verify_address, batch_verify_addresses, update_address_from_components
from .services import VoterDeduplicationService
from dashboards.models import FileUpload, Notification
from services import FileUploadService, GeocodingService, DataEnrichmentService
from validation import ElectionMetadata
import json
import os
import uuid


class VoterRecordListCreateView(generics.ListCreateAPIView):
    """List and create voter records."""
    
    serializer_class = VoterRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filter by account owner based on user role and permissions
        user = self.request.user
        if user.role in ['state', 'county', 'candidate']:
            return VoterRecord.objects.filter(account_owner=user)
        elif user.role == 'vendor':
            # Vendors can only see shared data
            return VoterRecord.objects.none()  # Implement sharing logic
        else:
            return VoterRecord.objects.none()

    def perform_create(self, serializer):
        serializer.save(account_owner=self.request.user)


class VoterRecordDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Voter record detail view."""
    
    serializer_class = VoterRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['state', 'county', 'candidate']:
            return VoterRecord.objects.filter(account_owner=user)
        elif user.role == 'vendor':
            return VoterRecord.objects.none()  # Implement sharing logic
        else:
            return VoterRecord.objects.none()


class ElectionListCreateView(generics.ListCreateAPIView):
    """List and create elections."""
    
    serializer_class = ElectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Election.objects.all()


class ElectionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Election detail view."""
    
    serializer_class = ElectionSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Election.objects.all()


class FileUploadView(APIView):
    """Handle file uploads for voter data processing."""
    
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        request=FileUploadSerializer,
        responses={200: {'type': 'object'}}
    )
    def post(self, request):
        """Upload and process CSV file."""
        
        serializer = FileUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        uploaded_file = serializer.validated_data['file']
        data_type = serializer.validated_data['data_type']
        
        try:
            upload_service = FileUploadService()
            result = upload_service.process_upload(uploaded_file)
            
            return Response({
                'success': True,
                'message': 'File uploaded successfully',
                'data': result.dict()
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class VoterDataUploadView(APIView):
    """New enhanced file upload for voter data with deduplication."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Upload CSV/XLSX file for voter data processing."""
        
        if 'file' not in request.FILES:
            return Response({
                'success': False,
                'message': 'No file provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        uploaded_file = request.FILES['file']
        file_type = request.data.get('file_type', 'voter_data')
        
        # Validate file type
        if not uploaded_file.name.endswith(('.csv', '.xlsx', '.xls')):
            return Response({
                'success': False,
                'message': 'Only CSV and Excel files are supported'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Save file to storage
            file_path = default_storage.save(
                f'uploads/{uuid.uuid4()}_{uploaded_file.name}',
                ContentFile(uploaded_file.read())
            )
            
            # Create FileUpload record
            file_upload = FileUpload.objects.create(
                user=request.user,
                original_filename=uploaded_file.name,
                file_type=file_type,
                file_path=file_path,
                file_size=uploaded_file.size,
                status='pending'
            )
            
            # Start background processing
            from django.utils import timezone
            from asgiref.sync import async_to_sync
            from dashboards.consumers import send_notification_to_user
            
            # Send immediate response
            response_data = {
                'success': True,
                'message': 'File uploaded successfully, processing started',
                'upload_id': str(file_upload.id),
                'filename': uploaded_file.name,
                'file_size': uploaded_file.size
            }
            
            # Create notification
            Notification.objects.create(
                recipient=request.user,
                title="File Upload Started",
                message=f"Processing {uploaded_file.name}...",
                notification_type='info',
                content_object=file_upload
            )
            
            return Response(response_data)
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Upload failed: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


class ProcessUploadView(APIView):
    """Process uploaded file with deduplication."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, upload_id):
        """Start processing the uploaded file."""
        
        try:
            file_upload = get_object_or_404(
                FileUpload, 
                id=upload_id, 
                user=request.user,
                status='pending'
            )
            
            # Initialize deduplication service
            dedup_service = VoterDeduplicationService()
            
            # Process file asynchronously
            # For now, we'll do it synchronously but this should be moved to Celery
            try:
                results = dedup_service.process_csv_upload(file_upload, request.user)
                
                return Response({
                    'success': True,
                    'message': 'File processed successfully',
                    'results': results
                })
                
            except Exception as e:
                file_upload.status = 'failed'
                file_upload.error_message = str(e)
                file_upload.save()
                
                return Response({
                    'success': False,
                    'message': f'Processing failed: {str(e)}'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except FileUpload.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Upload not found'
            }, status=status.HTTP_404_NOT_FOUND)


class UploadStatusView(APIView):
    """Get upload status and progress."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, upload_id):
        """Get upload status."""
        
        try:
            file_upload = get_object_or_404(
                FileUpload,
                id=upload_id,
                user=request.user
            )
            
            return Response({
                'success': True,
                'upload': {
                    'id': str(file_upload.id),
                    'filename': file_upload.original_filename,
                    'status': file_upload.status,
                    'progress_percent': file_upload.progress_percent,
                    'records_total': file_upload.records_total,
                    'records_processed': file_upload.records_processed,
                    'records_created': file_upload.records_created,
                    'records_updated': file_upload.records_updated,
                    'records_duplicates': file_upload.records_duplicates,
                    'records_errors': file_upload.records_errors,
                    'error_message': file_upload.error_message,
                    'created_at': file_upload.created_at,
                    'completed_at': file_upload.completed_at,
                }
            })
            
        except FileUpload.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Upload not found'
            }, status=status.HTTP_404_NOT_FOUND)


class DeduplicateExistingView(APIView):
    """Deduplicate existing voter records."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Run deduplication on existing records."""
        
        campaign_id = request.data.get('campaign_id')
        
        try:
            dedup_service = VoterDeduplicationService()
            results = dedup_service.deduplicate_existing_records(
                user=request.user,
                campaign_id=campaign_id
            )
            
            # Create notification
            Notification.objects.create(
                recipient=request.user,
                title="Deduplication Complete",
                message=f"Processed {results['processed']} records, merged {results['merged']} duplicates",
                notification_type='success'
            )
            
            return Response({
                'success': True,
                'message': 'Deduplication completed',
                'results': results
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Deduplication failed: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


class ColumnMappingView(APIView):
    """Handle column mapping confirmation, data validation, and election metadata."""
    
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        request=ColumnMappingSerializer,
        responses={200: {'type': 'object'}}
    )
    def post(self, request):
        """Validate data with confirmed column mappings and election metadata."""
        
        serializer = ColumnMappingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        file_id = serializer.validated_data['file_id']
        mappings = serializer.validated_data['mappings']
        data_type = serializer.validated_data['data_type']
        
        # Extract election metadata if provided
        elections_data = request.data.get('elections', [])
        elections = []
        
        for election_data in elections_data:
            try:
                election = ElectionMetadata(**election_data)
                elections.append(election.dict())
            except Exception as e:
                return Response({
                    'success': False,
                    'message': f'Invalid election metadata: {str(e)}'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            upload_service = FileUploadService()
            validation_result = upload_service.validate_with_mappings(file_id, mappings)
            
            return Response({
                'success': True,
                'message': 'Data validated successfully',
                'data': validation_result.dict(),
                'elections': elections
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class DataProcessingView(APIView):
    """Process validated data and save to database with enhanced address handling."""
    
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        Process and save validated voter data with election metadata.

        This method processes voter data using the provided file ID and mappings, 
        and optionally handles election metadata and address verification.

        Parameters:
            request (Request): The HTTP request object containing the following data:
                - file_id (str): The ID of the uploaded file containing voter data. (Required)
                - mappings (dict): A dictionary mapping column names to data fields. (Required)
                - elections (list, optional): A list of dictionaries, where each dictionary 
                  represents election metadata. Each dictionary should match the structure 
                  expected by the ElectionMetadata class.
                - auto_verify_addresses (bool, optional): A flag indicating whether to 
                  automatically verify voter addresses. Defaults to False.

        Returns:
            Response: A JSON response indicating success or failure, along with any 
            relevant data or error messages.
        """
        
        file_id = request.data.get('file_id')
        mappings = request.data.get('mappings')
        elections_data = request.data.get('elections', [])
        auto_verify_addresses = request.data.get('auto_verify_addresses', False)
        
        if not file_id or not mappings:
            return Response({
                'success': False,
                'message': 'file_id and mappings are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            upload_service = FileUploadService()
            
            # Validate election metadata
            elections = []
            for election_data in elections_data:
                try:
                    election = ElectionMetadata(**election_data)
                    elections.append(election.dict())
                except Exception as e:
                    return Response({
                        'success': False,
                        'message': f'Invalid election metadata: {str(e)}'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Process validated data
            processed_data = upload_service.process_validated_data(
                file_id, mappings, str(request.user.id), elections
            )
            
            voter_records = processed_data['voter_records']
            election_data_records = processed_data['election_data_records']
            
            saved_count = 0
            error_count = 0
            election_saved_count = 0
            voter_ids_for_verification = []
            
            # Process voter records
            for record_data in voter_records:
                try:
                    # Create VoterRecord instance
                    voter_record = VoterRecord.objects.create(**record_data)
                    saved_count += 1
                    voter_ids_for_verification.append(str(voter_record.id))
                    
                    # Update constructed addresses
                    update_addresses(voter_record)
                    
                except Exception as e:
                    error_count += 1
                    continue
            
            # Process election data
            for election_record in election_data_records:
                try:
                    # Get or create election
                    election_meta = election_record['election_meta']
                    election, created = Election.objects.get_or_create(
                        name=election_record['election_name'],
                        defaults={
                            'election_type': election_meta.get('election_type'),
                            'year': election_meta.get('year'),
                            'date': election_meta.get('date')
                        }
                    )
                    
                    # Find voter by ID
                    voter = VoterRecord.objects.filter(
                        models.Q(voter_vuid=election_record['voter_id']) |
                        models.Q(voter_id=election_record['voter_id'])
                    ).first()
                    
                    if voter:
                        # Create or update election data
                        election_data, created = ElectionData.objects.get_or_create(
                            voter=voter,
                            election=election,
                            data_type=election_record['data_type'],
                            defaults={'value': election_record['value']}
                        )
                        if not created:
                            election_data.value = election_record['value']
                            election_data.save()
                        
                        election_saved_count += 1
                        
                except Exception as e:
                    continue
            
            # Queue address verification if requested
            if auto_verify_addresses and voter_ids_for_verification:
                batch_verify_addresses.delay(voter_ids_for_verification)
            
            return Response({
                'success': True,
                'message': f'Data processed successfully. {saved_count} voter records saved, {election_saved_count} election data records saved, {error_count} errors.',
                'data': {
                    'voter_saved_count': saved_count,
                    'election_saved_count': election_saved_count,
                    'error_count': error_count,
                    'total_processed': len(voter_records),
                    'address_verification_queued': auto_verify_addresses
                }
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class VoterEngagementListCreateView(generics.ListCreateAPIView):
    """List and create voter engagements."""
    
    serializer_class = VoterEngagementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return VoterEngagement.objects.filter(engaged_by=self.request.user)

    def perform_create(self, serializer):
        serializer.save(engaged_by=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verify_voter_address(request, voter_id):
    """Trigger address verification for a specific voter."""
    
    try:
        voter = get_object_or_404(VoterRecord, id=voter_id, account_owner=request.user)
        
        # Queue address verification task
        task = verify_address.delay(str(voter.id))
        
        return Response({
            'success': True,
            'message': 'Address verification queued',
            'task_id': task.id
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def batch_verify_voter_addresses(request):
    """Trigger batch address verification for multiple voters."""
    
    voter_ids = request.data.get('voter_ids', [])
    
    if not voter_ids:
        return Response({
            'success': False,
            'message': 'voter_ids list is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Verify user owns these voters
        owned_voters = VoterRecord.objects.filter(
            id__in=voter_ids,
            account_owner=request.user
        ).values_list('id', flat=True)
        
        owned_voter_ids = [str(vid) for vid in owned_voters]
        
        if len(owned_voter_ids) != len(voter_ids):
            return Response({
                'success': False,
                'message': 'Some voter IDs are not owned by the current user'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Queue batch verification
        task = batch_verify_addresses.delay(owned_voter_ids)
        
        return Response({
            'success': True,
            'message': f'Batch address verification queued for {len(owned_voter_ids)} voters',
            'task_id': task.id,
            'voter_count': len(owned_voter_ids)
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_office_types(request):
    """Get valid office types for a given district level."""
    
    district_level = request.GET.get('district_level')
    
    if not district_level:
        return Response({
            'success': False,
            'message': 'district_level parameter is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        office_types = get_valid_office_types_for_district(district_level)
        
        return Response({
            'success': True,
            'data': {
                'district_level': district_level,
                'office_types': office_types
            }
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def validate_district_office_type(request):
    """Validate if an office type is valid for a given district level."""
    
    district_level = request.data.get('district_level')
    office_type = request.data.get('office_type')
    
    if not district_level or not office_type:
        return Response({
            'success': False,
            'message': 'district_level and office_type are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        is_valid = validate_office_type(district_level, office_type)
        
        return Response({
            'success': True,
            'data': {
                'district_level': district_level,
                'office_type': office_type,
                'is_valid': is_valid
            }
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_voter_addresses(request, voter_id):
    """Update voter address fields from components."""
    
    try:
        voter = get_object_or_404(VoterRecord, id=voter_id, account_owner=request.user)
        
        # Queue address update task
        task = update_address_from_components.delay(str(voter.id))
        
        return Response({
            'success': True,
            'message': 'Address update queued',
            'task_id': task.id
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def voter_history(request, voter_id):
    """Get change history for a specific voter."""
    
    try:
        voter = get_object_or_404(VoterRecord, id=voter_id, account_owner=request.user)
        
        # Get historical records
        history_records = voter.history.all().order_by('-history_date')[:50]
        
        history_data = []
        for record in history_records:
            history_data.append({
                'history_id': record.history_id,
                'history_date': record.history_date,
                'history_type': record.history_type,
                'history_user': record.history_user.phone_number if record.history_user else 'System',
                'changes': record.diff_against(record.prev_record) if record.prev_record else None
            })
        
        return Response({
            'success': True,
            'voter_id': str(voter.id),
            'history': history_data
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
