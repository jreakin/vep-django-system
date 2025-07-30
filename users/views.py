from rest_framework import generics, permissions
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import (
    OwnerAccount, StateAccount, CountyAccount, CampaignAccount, 
    VendorAccount, VolunteerInvite
)
from .serializers import (
    UserSerializer, OwnerAccountSerializer, StateAccountSerializer,
    CountyAccountSerializer, CampaignAccountSerializer, VendorAccountSerializer,
    VolunteerInviteSerializer
)

User = get_user_model()


class UserProfileView(generics.RetrieveUpdateAPIView):
    """User profile view."""
    
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class OwnerAccountView(generics.RetrieveUpdateAPIView):
    """Owner account details view."""
    
    serializer_class = OwnerAccountSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_object(self):
        account, created = OwnerAccount.objects.get_or_create(user=self.request.user)
        return account


class StateAccountView(generics.RetrieveUpdateAPIView):
    """State account details view."""
    
    serializer_class = StateAccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        if self.request.user.role != 'state':
            raise permissions.PermissionDenied("Only state parties can access this resource")
        account, created = StateAccount.objects.get_or_create(user=self.request.user)
        return account


class CountyAccountView(generics.RetrieveUpdateAPIView):
    """County account details view."""
    
    serializer_class = CountyAccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        if self.request.user.role != 'county':
            raise permissions.PermissionDenied("Only county parties can access this resource")
        account, created = CountyAccount.objects.get_or_create(user=self.request.user)
        return account


class CampaignAccountView(generics.RetrieveUpdateAPIView):
    """Campaign account details view."""
    
    serializer_class = CampaignAccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        if self.request.user.role != 'campaign':
            raise permissions.PermissionDenied("Only campaigns can access this resource")
        account, created = CampaignAccount.objects.get_or_create(user=self.request.user)
        return account


class VendorAccountView(generics.RetrieveUpdateAPIView):
    """Vendor account details view."""
    
    serializer_class = VendorAccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        if self.request.user.role != 'vendor':
            raise permissions.PermissionDenied("Only vendors can access this resource")
        account, created = VendorAccount.objects.get_or_create(user=self.request.user)
        return account


class AccountListView(generics.ListAPIView):
    """List all accounts - Owner only."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        # This won't be used since we override list method
        return UserSerializer
    
    def list(self, request, *args, **kwargs):
        if request.user.role != 'owner':
            raise permissions.PermissionDenied("Only owners can access this resource")
        
        # Get all users with their account details
        users = User.objects.all().order_by('-created_at')
        paginator = self.pagination_class()
        paginated_users = paginator.paginate_queryset(users, request)
        accounts_data = []
        
        for user in paginated_users:
            user_data = UserSerializer(user).data
            account_data = None
            
            # Get account details based on role
            if user.role == 'owner' and hasattr(user, 'owner_account'):
                account_data = OwnerAccountSerializer(user.owner_account).data
            elif user.role == 'state' and hasattr(user, 'state_account'):
                account_data = StateAccountSerializer(user.state_account).data
            elif user.role == 'county' and hasattr(user, 'county_account'):
                account_data = CountyAccountSerializer(user.county_account).data
            elif user.role == 'campaign' and hasattr(user, 'campaign_account'):
                account_data = CampaignAccountSerializer(user.campaign_account).data
            elif user.role == 'vendor' and hasattr(user, 'vendor_account'):
                account_data = VendorAccountSerializer(user.vendor_account).data
            
            accounts_data.append({
                'user': user_data,
                'account': account_data
            })
        
        return Response(accounts_data)


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
