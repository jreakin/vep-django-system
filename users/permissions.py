from rest_framework import permissions


class Role:
    OWNER = 'owner'
    STATE = 'state'
    COUNTY = 'county'
    CAMPAIGN = 'campaign'
    VENDOR = 'vendor'

class IsOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners to access owner-specific resources.
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == Role.OWNER


class IsState(permissions.BasePermission):
    """
    Custom permission to only allow state parties to access state-specific resources.
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'state'


class IsCounty(permissions.BasePermission):
    """
    Custom permission to only allow county parties to access county-specific resources.
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'county'


class IsCampaign(permissions.BasePermission):
    """
    Custom permission to only allow campaigns to access campaign-specific resources.
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'campaign'


class IsVendor(permissions.BasePermission):
    """
    Custom permission to only allow vendors to access vendor-specific resources.
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'vendor'