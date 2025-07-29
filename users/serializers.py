from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import StateAccount, CountyAccount, CandidateAccount, VendorAccount, VolunteerInvite

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'is_verified', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'role']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords do not match")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


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


class CandidateAccountSerializer(serializers.ModelSerializer):
    """Serializer for CandidateAccount model."""
    
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = CandidateAccount
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


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for password reset request."""
    
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for password reset confirmation."""
    
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8)
    confirm_password = serializers.CharField(min_length=8)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Passwords do not match")
        return attrs