from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from drf_spectacular.utils import extend_schema, OpenApiParameter
from .models import StateAccount, CountyAccount, CandidateAccount, VendorAccount, VolunteerInvite
from .serializers import (
    UserSerializer, UserRegistrationSerializer, StateAccountSerializer,
    CountyAccountSerializer, CandidateAccountSerializer, VendorAccountSerializer,
    VolunteerInviteSerializer, PasswordResetRequestSerializer, PasswordResetConfirmSerializer
)

User = get_user_model()


class UserRegistrationView(generics.CreateAPIView):
    """User registration endpoint."""
    
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Create auth token
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key,
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)


@extend_schema(
    request=None,
    responses={200: {'type': 'object', 'properties': {
        'user': UserSerializer,
        'token': {'type': 'string'},
        'message': {'type': 'string'}
    }}}
)
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """User login endpoint."""
    
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response({
            'error': 'Email and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(request, username=email, password=password)
    
    if user:
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key,
            'message': 'Login successful'
        })
    else:
        return Response({
            'error': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)


@extend_schema(
    request=None,
    responses={200: {'type': 'object', 'properties': {
        'message': {'type': 'string'}
    }}}
)
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """User logout endpoint."""
    
    try:
        # Delete the user's token
        request.user.auth_token.delete()
        return Response({
            'message': 'Logout successful'
        })
    except Token.DoesNotExist:
        return Response({
            'message': 'Already logged out'
        })


@extend_schema(
    request=PasswordResetRequestSerializer,
    responses={200: {'type': 'object', 'properties': {
        'message': {'type': 'string'}
    }}}
)
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_request(request):
    """Request password reset."""
    
    serializer = PasswordResetRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    email = serializer.validated_data['email']
    
    try:
        user = User.objects.get(email=email)
        
        # Generate password reset token
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # In a real implementation, send email with reset link
        # For now, just return the token for testing
        
        return Response({
            'message': 'Password reset email sent',
            'token': token,  # Remove this in production
            'uid': uid      # Remove this in production
        })
        
    except User.DoesNotExist:
        # Don't reveal whether user exists for security
        return Response({
            'message': 'Password reset email sent'
        })


class UserProfileView(generics.RetrieveUpdateAPIView):
    """User profile view."""
    
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class StateAccountView(generics.RetrieveUpdateAPIView):
    """State account details view."""
    
    serializer_class = StateAccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        account, created = StateAccount.objects.get_or_create(user=self.request.user)
        return account


class CountyAccountView(generics.RetrieveUpdateAPIView):
    """County account details view."""
    
    serializer_class = CountyAccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        account, created = CountyAccount.objects.get_or_create(user=self.request.user)
        return account


class CandidateAccountView(generics.RetrieveUpdateAPIView):
    """Candidate account details view."""
    
    serializer_class = CandidateAccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        account, created = CandidateAccount.objects.get_or_create(user=self.request.user)
        return account


class VendorAccountView(generics.RetrieveUpdateAPIView):
    """Vendor account details view."""
    
    serializer_class = VendorAccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        account, created = VendorAccount.objects.get_or_create(user=self.request.user)
        return account


class VolunteerInviteListCreateView(generics.ListCreateAPIView):
    """List and create volunteer invites."""
    
    serializer_class = VolunteerInviteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return VolunteerInvite.objects.filter(inviter=self.request.user)

    def perform_create(self, serializer):
        serializer.save(inviter=self.request.user)


class VolunteerInviteDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Volunteer invite detail view."""
    
    serializer_class = VolunteerInviteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return VolunteerInvite.objects.filter(inviter=self.request.user)
