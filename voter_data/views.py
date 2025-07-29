from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from .models import VoterRecord, Election, ElectionData, EarlyVoteRecord, VoterEngagement
from .serializers import (
    VoterRecordSerializer, ElectionSerializer, ElectionDataSerializer,
    EarlyVoteRecordSerializer, VoterEngagementSerializer, FileUploadSerializer,
    ColumnMappingSerializer
)
from services import FileUploadService, GeocodingService, DataEnrichmentService


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


class ColumnMappingView(APIView):
    """Handle column mapping confirmation and data validation."""
    
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        request=ColumnMappingSerializer,
        responses={200: {'type': 'object'}}
    )
    def post(self, request):
        """Validate data with confirmed column mappings."""
        
        serializer = ColumnMappingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        file_id = serializer.validated_data['file_id']
        mappings = serializer.validated_data['mappings']
        data_type = serializer.validated_data['data_type']
        
        try:
            upload_service = FileUploadService()
            validation_result = upload_service.validate_with_mappings(file_id, mappings)
            
            return Response({
                'success': True,
                'message': 'Data validated successfully',
                'data': validation_result.dict()
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class DataProcessingView(APIView):
    """Process validated data and save to database."""
    
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """Process and save validated voter data."""
        
        file_id = request.data.get('file_id')
        mappings = request.data.get('mappings')
        
        if not file_id or not mappings:
            return Response({
                'success': False,
                'message': 'file_id and mappings are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            upload_service = FileUploadService()
            geocoding_service = GeocodingService()
            enrichment_service = DataEnrichmentService()
            
            # Process validated data
            validated_records = upload_service.process_validated_data(
                file_id, mappings, str(request.user.id)
            )
            
            saved_count = 0
            error_count = 0
            
            for record_data in validated_records:
                try:
                    # Geocode address if coordinates not provided
                    if not record_data.get('latitude') or not record_data.get('longitude'):
                        coords = geocoding_service.geocode_address(record_data['address'])
                        if coords:
                            record_data['latitude'], record_data['longitude'] = coords
                    
                    # Enrich with social media data
                    if record_data.get('email'):
                        social_data = enrichment_service.enrich_social_media(record_data['email'])
                        record_data['social_media'].update(social_data)
                    
                    # Enrich with employment data
                    if record_data.get('name') and record_data.get('email'):
                        employment_data = enrichment_service.enrich_employment(
                            record_data['name'], record_data['email']
                        )
                        record_data['employment'].update(employment_data)
                    
                    # Save to database
                    voter_record = VoterRecord.objects.create(**record_data)
                    saved_count += 1
                    
                except Exception as e:
                    error_count += 1
                    continue
            
            return Response({
                'success': True,
                'message': f'Data processed successfully. {saved_count} records saved, {error_count} errors.',
                'data': {
                    'saved_count': saved_count,
                    'error_count': error_count,
                    'total_processed': len(validated_records)
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
