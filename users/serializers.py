from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    OwnerAccount, StateAccount, CountyAccount, CampaignAccount, 
    VendorAccount, VolunteerInvite
)

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    
    class Meta:
        model = User
        fields = ['id', 'phone_number', 'email', 'role', 'is_verified', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class OwnerAccountSerializer(serializers.ModelSerializer):
    """Serializer for OwnerAccount model."""
    
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = OwnerAccount
        fields = ['user', 'company_name', 'contact_name', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class StateAccountSerializer(serializers.ModelSerializer):
    """Serializer for StateAccount model."""
    
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = StateAccount
        fields = ['user', 'name', 'state', 'sos_reference_id', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class CountyAccountSerializer(serializers.ModelSerializer):
    """Serializer for CountyAccount model."""
    
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = CountyAccount
        fields = ['user', 'name', 'state', 'county', 'sos_reference_id', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class CampaignAccountSerializer(serializers.ModelSerializer):
    """Serializer for CampaignAccount model."""
    
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = CampaignAccount
        fields = ['user', 'name', 'office_type', 'office_name', 'district_ids', 'state', 
                 'party_affiliation', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class VendorAccountSerializer(serializers.ModelSerializer):
    """Serializer for VendorAccount model."""
    
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = VendorAccount
        fields = ['user', 'company_name', 'contact_name', 'business_type', 
                 'states_served', 'services_offered', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class VolunteerInviteSerializer(serializers.ModelSerializer):
    """Serializer for VolunteerInvite model."""
    
    inviter = UserSerializer(read_only=True)
    
    class Meta:
        model = VolunteerInvite
        fields = ['id', 'email', 'campaign_id', 'inviter', 'status', 
                 'invited_at', 'responded_at', 'expires_at']
        read_only_fields = ['id', 'inviter', 'invited_at', 'responded_at']