"""
Multi-Tier Access Control System for VEP Django System

This module implements a hierarchical access control system that respects
the political organization structure:

Hierarchy:
- Owner: Full system access
- State: Access to counties and campaigns within their state
- County: Access to campaigns within their county  
- Campaign: Access to their own data
- Vendor: Access based on states served and services offered

The system provides both permission classes for DRF views and decorators
for function-based access control.
"""

from functools import wraps
from django.core.exceptions import PermissionDenied
from django.http import Http404
from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied as DRFPermissionDenied
class Role:
    """Constants for user roles."""
    VENDOR = 'vendor'
    # Add other roles here if needed


class AccessLevel:
    """Constants for different access levels in the hierarchy."""
    OWNER = 'owner'
    STATE = 'state'
    COUNTY = 'county'
    CAMPAIGN = 'campaign'
    VENDOR = 'vendor'
    NONE = 'none'


class MultiTierAccessManager:
    """
    Core manager for multi-tier access control logic.
    
    This class contains the business logic for determining access
    permissions across the hierarchical organization structure.
    """
    
    @staticmethod
    def get_user_access_level(user):
        """
        Determine the access level for a given user.
        
        Args:
            user: Django User instance
            
        Returns:
            str: Access level constant from AccessLevel
        """
        if not user:
            return AccessLevel.NONE
            
        # Check if user has is_authenticated method and is authenticated
        if hasattr(user, 'is_authenticated'):
            if not user.is_authenticated:
                return AccessLevel.NONE
        else:
            # If no is_authenticated method, assume not authenticated
            return AccessLevel.NONE
            
        # Get the role, defaulting to NONE if not set
        return getattr(user, 'role', AccessLevel.NONE) or AccessLevel.NONE
    
    @staticmethod
    def can_access_state_data(user, target_state):
        """
        Check if user can access data for a specific state.
        
        Args:
            user: Django User instance
            target_state: State abbreviation (e.g., 'CA', 'TX')
            
        Returns:
            bool: True if access is allowed
        """
        access_level = MultiTierAccessManager.get_user_access_level(user)
        
        # Owners can access everything
        if access_level == AccessLevel.OWNER:
            return True
            
        # State users can access their own state
        if access_level == AccessLevel.STATE:
            if hasattr(user, 'state_account') and user.state_account.state == target_state:
                return True
                
        # County users can access their own state
        if access_level == AccessLevel.COUNTY:
            if hasattr(user, 'county_account') and user.county_account.state == target_state:
                return True
                
        # Campaign users can access their own state
        if access_level == AccessLevel.CAMPAIGN:
            if hasattr(user, 'campaign_account') and user.campaign_account.state == target_state:
                return True
                
        # Vendor users can access states they serve
        if access_level == AccessLevel.VENDOR:
            if hasattr(user, 'vendor_account') and target_state in user.vendor_account.states_served:
                return True
                
        return False
    
    @staticmethod
    def can_access_county_data(user, target_state, target_county):
        """
        Check if user can access data for a specific county.
        
        Args:
            user: Django User instance
            target_state: State abbreviation
            target_county: County name
            
        Returns:
            bool: True if access is allowed
        """
        access_level = MultiTierAccessManager.get_user_access_level(user)
        
        # Owners can access everything
        if access_level == AccessLevel.OWNER:
            return True
            
        # State users can access counties in their state
        if access_level == AccessLevel.STATE:
            if hasattr(user, 'state_account') and user.state_account.state == target_state:
                return True
                
        # County users can access their own county
        if access_level == AccessLevel.COUNTY:
            if (hasattr(user, 'county_account') and 
                user.county_account.state == target_state and 
                user.county_account.county == target_county):
                return True
                
        # Campaign users can access their county (if county-level campaign)
        if access_level == AccessLevel.CAMPAIGN:
            if (hasattr(user, 'campaign_account') and 
                user.campaign_account.state == target_state and
                user.campaign_account.office_type == 'county'):
                # For county campaigns, we need to check if they're in the target county
                if hasattr(user.campaign_account, 'district_id'):
                    campaign_county = MultiTierAccessManager.get_county_from_district_id(user.campaign_account.district_id)
                    if campaign_county == target_county:
                        return True
                
        # Vendor users can access counties in states they serve
        if access_level == AccessLevel.VENDOR:
            if hasattr(user, 'vendor_account') and target_state in user.vendor_account.states_served:
                return True
                
        return False
    
    @staticmethod
    def can_access_campaign_data(user, campaign_user_id):
        """
        Check if user can access data for a specific campaign.
        
        Args:
            user: Django User instance
            campaign_user_id: UUID of the campaign user whose data is being accessed
            
        Returns:
            bool: True if access is allowed
        """
        access_level = MultiTierAccessManager.get_user_access_level(user)
        
        # Owners can access everything
        if access_level == AccessLevel.OWNER:
            return True
            
        # Users can always access their own data
        if str(user.id) == str(campaign_user_id):
            return True
            
        # Get the target campaign account
        from users.models import User
        try:
            target_campaign_user = User.objects.get(id=campaign_user_id, role=Role.CAMPAIGN)
            target_campaign = target_campaign_user.campaign_account
        except (User.DoesNotExist, AttributeError):
            return False
            
        # State users can access campaigns in their state
        if access_level == AccessLevel.STATE:
            if (hasattr(user, 'state_account') and 
                user.state_account.state == target_campaign.state):
                return True
                
        # County users can access campaigns in their county
        if access_level == AccessLevel.COUNTY:
            if (hasattr(user, 'county_account') and 
                user.county_account.state == target_campaign.state):
                if user.county_account.county == target_campaign.county:
                    return True
                
        # Vendor users can access campaigns in states they serve
        if access_level == AccessLevel.VENDOR:
            if (hasattr(user, 'vendor_account') and 
                target_campaign.state in user.vendor_account.states_served):
                return True
                
        return False
    
    @staticmethod
    def can_access_vendor_data(user, vendor_user_id):
        """
        Check if user can access data for a specific vendor.
        
        Args:
            user: Django User instance
            vendor_user_id: UUID of the vendor user whose data is being accessed
            
        Returns:
            bool: True if access is allowed
        """
        access_level = MultiTierAccessManager.get_user_access_level(user)
        
        # Owners can access everything
        if access_level == AccessLevel.OWNER:
            return True
            
        # Users can always access their own data
        if str(user.id) == str(vendor_user_id):
            return True
            
        # Get the target vendor account
        from users.models import User
        try:
            target_vendor_user = User.objects.get(id=vendor_user_id, role=Role.VENDOR)
            target_vendor = target_vendor_user.vendor_account
        except (User.DoesNotExist, AttributeError):
            return False
            
        # State users can access vendors that serve their state
        if access_level == AccessLevel.STATE:
            if (hasattr(user, 'state_account') and 
                user.state_account.state in target_vendor.states_served):
                return True
                
        # County users can access vendors that serve their state
        if access_level == AccessLevel.COUNTY:
            if (hasattr(user, 'county_account') and 
                user.county_account.state in target_vendor.states_served):
                return True
                
        # Campaign users can access vendors that serve their state
        if access_level == AccessLevel.CAMPAIGN:
            if (hasattr(user, 'campaign_account') and 
                user.campaign_account.state in target_vendor.states_served):
                return True
                
        return False


class MultiTierPermission(permissions.BasePermission):
    """
    DRF Permission class for multi-tier access control.
    
    This permission class can be used with DRF viewsets and views
    to enforce hierarchical access control.
    """
    
    def has_permission(self, request, view):
        """
        Check if the user has permission to access the view.
        
        Args:
            request: DRF request object
            view: DRF view object
            
        Returns:
            bool: True if access is allowed
        """
        user = request.user
        
        if not user or not user.is_authenticated:
            return False
            
        # Extract access parameters from view or request
        access_params = getattr(view, 'multi_tier_params', {})
        
        # If no specific parameters are set, allow access for authenticated users
        if not access_params:
            return True
            
        # Check specific access requirements
        if 'required_state' in access_params:
            return MultiTierAccessManager.can_access_state_data(
                user, access_params['required_state']
            )
            
        if 'required_county' in access_params:
            return MultiTierAccessManager.can_access_county_data(
                user, 
                access_params.get('required_state'),
                access_params['required_county']
            )
            
        if 'required_campaign_id' in access_params:
            return MultiTierAccessManager.can_access_campaign_data(
                user, access_params['required_campaign_id']
            )
            
        if 'required_vendor_id' in access_params:
            return MultiTierAccessManager.can_access_vendor_data(
                user, access_params['required_vendor_id']
            )
            
        return True
    
    def has_object_permission(self, request, view, obj):
        """
        Check if the user has permission to access a specific object.
        
        Args:
            request: DRF request object
            view: DRF view object
            obj: Model instance being accessed
            
        Returns:
            bool: True if access is allowed
        """
        user = request.user
        
        if not user or not user.is_authenticated:
            return False
            
        # Handle different object types
        if hasattr(obj, 'role') and obj.role == Role.CAMPAIGN:
            return MultiTierAccessManager.can_access_campaign_data(user, obj.id)
            
        if hasattr(obj, 'role') and obj.role == Role.VENDOR:
            return MultiTierAccessManager.can_access_vendor_data(user, obj.id)
            
        if hasattr(obj, 'state'):
            # State-based object access
            return MultiTierAccessManager.can_access_state_data(user, obj.state)
            
        if hasattr(obj, 'user'):
            # Object owned by a user
            if obj.user.role == Role.CAMPAIGN:
                return MultiTierAccessManager.can_access_campaign_data(user, obj.user.id)
            elif obj.user.role == Role.VENDOR:
                return MultiTierAccessManager.can_access_vendor_data(user, obj.user.id)
                
        # Default to allowing access for owners
        return MultiTierAccessManager.get_user_access_level(user) == AccessLevel.OWNER


# Decorators for function-based access control

def require_multi_tier_access(required_level=None, required_state=None, 
                             required_county=None, required_campaign_id=None,
                             required_vendor_id=None):
    """
    Decorator to enforce multi-tier access control on functions/views.
    
    Args:
        required_level: Minimum access level required
        required_state: Specific state access required
        required_county: Specific county access required  
        required_campaign_id: Specific campaign access required
        required_vendor_id: Specific vendor access required
        
    Usage:
        @require_multi_tier_access(required_state='CA')
        def my_view(request):
            # Only users with CA state access can call this
            pass
    """
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            user = getattr(request, 'user', None)
            
            if not user or not user.is_authenticated:
                raise PermissionDenied("Authentication required")
                
            # Check required level
            if required_level:
                user_level = MultiTierAccessManager.get_user_access_level(user)
                level_hierarchy = [AccessLevel.OWNER, AccessLevel.STATE, 
                                 AccessLevel.COUNTY, AccessLevel.CAMPAIGN, AccessLevel.VENDOR]
                
                if (level_hierarchy.index(user_level) > 
                    level_hierarchy.index(required_level)):
                    raise PermissionDenied(f"Requires {required_level} level access")
                    
            # Check state access
            if required_state and not MultiTierAccessManager.can_access_state_data(user, required_state):
                raise PermissionDenied(f"No access to state {required_state}")
                
            # Check county access
            if required_county and not MultiTierAccessManager.can_access_county_data(
                user, required_state, required_county):
                raise PermissionDenied(f"No access to county {required_county}")
                
            # Check campaign access
            if required_campaign_id and not MultiTierAccessManager.can_access_campaign_data(
                user, required_campaign_id):
                raise PermissionDenied(f"No access to campaign {required_campaign_id}")
                
            # Check vendor access
            if required_vendor_id and not MultiTierAccessManager.can_access_vendor_data(
                user, required_vendor_id):
                raise PermissionDenied(f"No access to vendor {required_vendor_id}")
                
            return func(request, *args, **kwargs)
        return wrapper
    return decorator


def owner_only(func):
    """
    Decorator to restrict access to owners only.
    
    Usage:
        @owner_only
        def admin_function(request):
            # Only owners can call this
            pass
    """
    return require_multi_tier_access(required_level=AccessLevel.OWNER)(func)


def state_or_above(func):
    """
    Decorator to restrict access to state level and above.
    
    Usage:
        @state_or_above  
        def state_function(request):
            # State, and owners can call this
            pass
    """
    return require_multi_tier_access(required_level=AccessLevel.STATE)(func)


# Utility functions for checking access in templates and other contexts

def user_can_access_state(user, state):
    """Template-friendly function to check state access."""
    return MultiTierAccessManager.can_access_state_data(user, state)


def user_can_access_county(user, state, county):
    """Template-friendly function to check county access."""
    return MultiTierAccessManager.can_access_county_data(user, state, county)


def user_can_access_campaign(user, campaign_id):
    """Template-friendly function to check campaign access."""
    return MultiTierAccessManager.can_access_campaign_data(user, campaign_id)


def user_can_access_vendor(user, vendor_id):
    """Template-friendly function to check vendor access."""
    return MultiTierAccessManager.can_access_vendor_data(user, vendor_id)


def get_accessible_states(user):
    """
    Get list of states accessible to a user.
    
    Args:
        user: Django User instance
        
    Returns:
        list: List of state abbreviations the user can access
    """
    access_level = MultiTierAccessManager.get_user_access_level(user)
    
    if access_level == AccessLevel.OWNER:
        # Owners can access all states - cache the result to improve performance
        from django.core.cache import cache
        cache_key = f"accessible_states_owner"
        states = cache.get(cache_key)
        if states is None:
            states = set()
            states.update(StateAccount.objects.values_list('state', flat=True))
            states.update(CountyAccount.objects.values_list('state', flat=True))
            states.update(CampaignAccount.objects.values_list('state', flat=True))
            cache.set(cache_key, list(states), timeout=3600)  # Cache for 1 hour
        return list(states)
        
    elif access_level == AccessLevel.STATE:
        if hasattr(user, 'state_account'):
            return [user.state_account.state]
            
    elif access_level == AccessLevel.COUNTY:
        if hasattr(user, 'county_account'):
            return [user.county_account.state]
            
    elif access_level == AccessLevel.CAMPAIGN:
        if hasattr(user, 'campaign_account'):
            return [user.campaign_account.state]
            
    elif access_level == AccessLevel.VENDOR:
        if hasattr(user, 'vendor_account'):
            return user.vendor_account.states_served
            
    return []


def get_accessible_counties(user, state=None):
    """
    Get list of counties accessible to a user in a specific state.
    
    Args:
        user: Django User instance
        state: State abbreviation to filter by
        
    Returns:
        list: List of county names the user can access
    """
    access_level = MultiTierAccessManager.get_user_access_level(user)
    
    if access_level == AccessLevel.OWNER:
        # Owners can access all counties
        from users.models import CountyAccount
        query = CountyAccount.objects.all()
        if state:
            query = query.filter(state=state)
        return list(query.values_list('county', flat=True))
        
    elif access_level == AccessLevel.STATE:
        if hasattr(user, 'state_account'):
            if not state or user.state_account.state == state:
                from users.models import CountyAccount
                return list(CountyAccount.objects.filter(
                    state=user.state_account.state
                ).values_list('county', flat=True))
                
    elif access_level == AccessLevel.COUNTY:
        if hasattr(user, 'county_account'):
            if not state or user.county_account.state == state:
                return [user.county_account.county]
                
    elif access_level in [AccessLevel.CAMPAIGN, AccessLevel.VENDOR]:
        # Campaigns and vendors can access counties in their accessible states
        accessible_states = get_accessible_states(user)
        if not state or state in accessible_states:
            from users.models import CountyAccount
            query = CountyAccount.objects.filter(state__in=accessible_states)
            if state:
                query = query.filter(state=state)
            return list(query.values_list('county', flat=True))
            
    return []