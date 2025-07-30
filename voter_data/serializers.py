from rest_framework import serializers
from .models import VoterRecord, Election, ElectionData, EarlyVoteRecord, VoterEngagement


class VoterRecordSerializer(serializers.ModelSerializer):
    """Serializer for VoterRecord model."""
    
    class Meta:
        model = VoterRecord
        fields = ['id', 'voter_id', 'name', 'first_name', 'last_name', 'address', 
                 'city', 'state', 'zip_code', 'latitude', 'longitude', 'email', 
                 'phone', 'date_of_birth', 'party_affiliation', 'social_media', 
                 'employment', 'data_source', 'last_updated', 'created_at']
        read_only_fields = ['id', 'last_updated', 'created_at']


class ElectionSerializer(serializers.ModelSerializer):
    """Serializer for Election model."""
    
    class Meta:
        model = Election
        fields = ['id', 'name', 'election_date', 'election_type', 'state', 
                 'jurisdiction', 'created_at']
        read_only_fields = ['id', 'created_at']


class ElectionDataSerializer(serializers.ModelSerializer):
    """Serializer for ElectionData model."""
    
    voter = VoterRecordSerializer(read_only=True)
    election = ElectionSerializer(read_only=True)
    
    class Meta:
        model = ElectionData
        fields = ['id', 'voter', 'election', 'voted', 'vote_method', 
                 'vote_date', 'precinct', 'created_at']
        read_only_fields = ['id', 'created_at']


class EarlyVoteRecordSerializer(serializers.ModelSerializer):
    """Serializer for EarlyVoteRecord model."""
    
    voter = VoterRecordSerializer(read_only=True)
    election = ElectionSerializer(read_only=True)
    
    class Meta:
        model = EarlyVoteRecord
        fields = ['id', 'voter', 'election', 'requested_date', 'sent_date', 
                 'received_date', 'ballot_status', 'return_method', 'created_at']
        read_only_fields = ['id', 'created_at']


class VoterEngagementSerializer(serializers.ModelSerializer):
    """Serializer for VoterEngagement model."""
    
    voter = VoterRecordSerializer(read_only=True)
    
    class Meta:
        model = VoterEngagement
        fields = ['id', 'voter', 'engagement_type', 'campaign_id', 'notes', 
                 'response_data', 'engagement_date']
        read_only_fields = ['id', 'engagement_date']


class FileUploadSerializer(serializers.Serializer):
    """Serializer for file upload."""
    
    file = serializers.FileField()
    data_type = serializers.ChoiceField(
        choices=[('voter_data', 'Voter Data'), ('election_data', 'Election Data')],
        default='voter_data'
    )


class ColumnMappingSerializer(serializers.Serializer):
    """Serializer for column mapping confirmation."""
    
    file_id = serializers.CharField()
    mappings = serializers.DictField(child=serializers.CharField())
    data_type = serializers.ChoiceField(
        choices=[('voter_data', 'Voter Data'), ('election_data', 'Election Data')],
        default='voter_data'
    )