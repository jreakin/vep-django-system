from django.shortcuts import render

from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model
from safe_spectacular import extend_schema
from .serializers import PhoneRegistrationSerializer, SendPINSerializer, VerifyPINSerializer
from .services import AuthenticationService
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


@extend_schema(
    request=PhoneRegistrationSerializer,
    responses={
        201: {'type': 'object', 'properties': {
            'message': {'type': 'string'},
            'phone_number': {'type': 'string'}
        }},
        400: {'type': 'object', 'properties': {
            'error': {'type': 'string'},
            'details': {'type': 'object'}
        }}
    }
)
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_phone(request):
    """Register user with phone number and send initial PIN."""
    
    serializer = PhoneRegistrationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            'error': 'Invalid data',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    phone_number = serializer.validated_data['phone_number']
    role = serializer.validated_data['role']
    
    auth_service = AuthenticationService()
    
    # Check rate limiting
    if not auth_service.can_request_pin(phone_number):
        return Response({
            'error': 'Too many PIN requests. Please wait before requesting another.'
        }, status=status.HTTP_429_TOO_MANY_REQUESTS)
    
    try:
        # Register user
        user = auth_service.register_user(phone_number, role)
        
        # Send initial PIN
        auth_pin = auth_service.create_pin_for_user(user)
        if not auth_pin:
            user.delete()  # Clean up if PIN sending failed
            return Response({
                'error': 'Failed to send verification PIN. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'message': 'User registered successfully. Verification PIN sent.',
            'phone_number': phone_number
        }, status=status.HTTP_201_CREATED)
        
    except ValueError as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error("Registration failed: %s", str(e))
        return Response({
            'error': 'Registration failed. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    request=SendPINSerializer,
    responses={
        200: {'type': 'object', 'properties': {
            'message': {'type': 'string'}
        }},
        400: {'type': 'object', 'properties': {
            'error': {'type': 'string'}
        }},
        429: {'type': 'object', 'properties': {
            'error': {'type': 'string'}
        }}
    }
)
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def send_pin(request):
    """Send PIN to user's phone number."""
    
    serializer = SendPINSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            'error': 'Invalid phone number',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    phone_number = serializer.validated_data['phone_number']
    auth_service = AuthenticationService()
    
    # Check rate limiting
    if not auth_service.can_request_pin(phone_number):
        return Response({
            'error': 'Too many PIN requests. Please wait before requesting another.'
        }, status=status.HTTP_429_TOO_MANY_REQUESTS)
    
    try:
        user = User.objects.get(phone_number=phone_number)
        auth_pin = auth_service.create_pin_for_user(user)
        
        if not auth_pin:
            return Response({
                'error': 'Failed to send PIN. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'message': 'PIN sent successfully'
        })
        
    except User.DoesNotExist:
        return Response({
            'error': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("PIN sending failed: %s", str(e))
        return Response({
            'error': 'Failed to send PIN. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    request=VerifyPINSerializer,
    responses={
        200: {'type': 'object', 'properties': {
            'message': {'type': 'string'},
            'token': {'type': 'string'},
            'user': {'type': 'object'}
        }},
        400: {'type': 'object', 'properties': {
            'error': {'type': 'string'}
        }},
        401: {'type': 'object', 'properties': {
            'error': {'type': 'string'}
        }}
    }
)
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def verify_pin(request):
    """Verify PIN and authenticate user."""
    
    serializer = VerifyPINSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            'error': 'Invalid data',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    phone_number = serializer.validated_data['phone_number']
    pin = serializer.validated_data['pin']
    
    try:
        user = User.objects.get(phone_number=phone_number)
        auth_service = AuthenticationService()
        
        if auth_service.verify_pin(user, pin):
            # Create or get auth token
            token, created = Token.objects.get_or_create(user=user)
            
            # Import here to avoid circular imports
            from users.serializers import UserSerializer
            
            return Response({
                'message': 'Authentication successful',
                'token': token.key,
                'user': UserSerializer(user).data
            })
        else:
            return Response({
                'error': 'Invalid or expired PIN'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
    except User.DoesNotExist:
        return Response({
            'error': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("PIN verification failed: %s", str(e))
        return Response({
            'error': 'Authentication failed. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """Logout user by deleting their token."""
    
    try:
        request.user.auth_token.delete()
        return Response({
            'message': 'Logout successful'
        })
    except Token.DoesNotExist:
        return Response({
            'message': 'Already logged out'
        })
