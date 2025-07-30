from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class PhoneRegistrationSerializer(serializers.Serializer):
    """Serializer for phone-based user registration."""
    
    phone_number = serializers.CharField(max_length=20)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES)
    
    def validate_phone_number(self, value):
        """Validate phone number format and uniqueness."""
        # Basic phone number validation (you may want to use a more robust validator)
        if not value.startswith('+'):
            raise serializers.ValidationError("Phone number must include country code (e.g., +1)")
        
        # Check if user already exists
        if User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("User with this phone number already exists")
        
        return value


class SendPINSerializer(serializers.Serializer):
    """Serializer for PIN sending request."""
    
    phone_number = serializers.CharField(max_length=20)
    
    def validate_phone_number(self, value):
        """Validate phone number exists."""
        try:
            User.objects.get(phone_number=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this phone number does not exist")
        
        return value


class VerifyPINSerializer(serializers.Serializer):
    """Serializer for PIN verification."""
    
    phone_number = serializers.CharField(max_length=20)
    pin = serializers.CharField(min_length=6, max_length=6)
    
    def validate_phone_number(self, value):
        """Validate phone number exists."""
        try:
            User.objects.get(phone_number=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this phone number does not exist")
        
        return value