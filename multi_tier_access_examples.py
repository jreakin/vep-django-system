"""
Example usage of the Multi-Tier Access Control System.

This file demonstrates how to use the multi-tier access system
in different contexts within the VEP Django System.
"""

from django.http import JsonResponse, HttpResponseForbidden
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from multi_tier_access_system import (
    MultiTierPermission,
    require_multi_tier_access,
    owner_only,
    state_or_above,
    user_can_access_state,
    get_accessible_states
)


# Example 1: Using decorators with function-based views
@api_view(['GET'])
@require_multi_tier_access(required_state='CA')
def california_data(request):
    """
    View that only allows access to users who can access California data.
    This includes:
    - Owners (can access everything)
    - California state party users
    - California county party users  
    - California campaign users
    - Vendors serving California
    """
    return Response({
        'message': 'You have access to California data',
        'user_role': request.user.role,
        'accessible_states': get_accessible_states(request.user)
    })


@api_view(['GET'])
@owner_only
def admin_dashboard(request):
    """
    View restricted to owners only.
    """
    return Response({
        'message': 'Welcome to the admin dashboard',
        'user_role': request.user.role
    })


@api_view(['GET'])
@state_or_above
def state_level_data(request):
    """
    View restricted to state-level users and above.
    This includes owners and state party users, but excludes
    county, campaign, and vendor users.
    """
    return Response({
        'message': 'You have state-level access',
        'user_role': request.user.role
    })


# Example 2: Using permission classes with ViewSets
class CampaignViewSet(viewsets.ModelViewSet):
    """
    Example ViewSet using multi-tier permissions.
    """
    permission_classes = [IsAuthenticated, MultiTierPermission]
    
    def get_queryset(self):
        """
        Filter queryset based on user's access level.
        """
        from users.models import User
        
        user = self.request.user
        accessible_states = get_accessible_states(user)
        
        # Return campaigns only from accessible states
        return User.objects.filter(
            role='campaign',
            campaign_account__state__in=accessible_states
        )
    
    def retrieve(self, request, pk=None):
        """
        Override retrieve to set multi-tier parameters dynamically.
        """
        # Set the required campaign ID for permission checking
        self.multi_tier_params = {'required_campaign_id': pk}
        return super().retrieve(request, pk)


# Example 3: Manual access checking in view logic
@api_view(['GET'])
def campaign_details(request, campaign_id):
    """
    View that manually checks access using utility functions.
    """
    from multi_tier_access_system import user_can_access_campaign
    
    if not user_can_access_campaign(request.user, campaign_id):
        return HttpResponseForbidden("You don't have access to this campaign")
    
    # Proceed with business logic
    from users.models import User
    try:
        campaign = User.objects.get(id=campaign_id, role='campaign')
        return Response({
            'campaign_name': campaign.campaign_account.name,
            'state': campaign.campaign_account.state,
            'office': campaign.campaign_account.office_name
        })
    except User.DoesNotExist:
        return Response({'error': 'Campaign not found'}, status=404)


# Example 4: Template context processor for access checking
def multi_tier_access_context(request):
    """
    Context processor to add access checking functions to templates.
    
    Add this to TEMPLATES['OPTIONS']['context_processors'] in settings.py:
    'path.to.this.file.multi_tier_access_context'
    """
    from multi_tier_access_system import (
        user_can_access_state,
        user_can_access_county,
        get_accessible_states,
        get_accessible_counties
    )
    
    return {
        'user_can_access_state': lambda state: user_can_access_state(request.user, state),
        'user_can_access_county': lambda state, county: user_can_access_county(request.user, state, county),
        'user_accessible_states': get_accessible_states(request.user),
        'user_accessible_counties': lambda state=None: get_accessible_counties(request.user, state),
    }


# Example 5: Middleware for request-level access control
class MultiTierAccessMiddleware:
    """
    Middleware to add multi-tier access information to requests.
    
    Add this to MIDDLEWARE in settings.py:
    'path.to.this.file.MultiTierAccessMiddleware'
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Add access information to request
        if hasattr(request, 'user') and request.user.is_authenticated:
            from multi_tier_access_system import (
                MultiTierAccessManager,
                get_accessible_states
            )
            
            request.user_access_level = MultiTierAccessManager.get_user_access_level(request.user)
            request.user_accessible_states = get_accessible_states(request.user)
        else:
            request.user_access_level = 'none'
            request.user_accessible_states = []
        
        response = self.get_response(request)
        return response


# Example 6: Custom permission for specific business logic
class StatePartyPermission(MultiTierPermission):
    """
    Custom permission that only allows state party users and above.
    """
    
    def has_permission(self, request, view):
        from multi_tier_access_system import MultiTierAccessManager, AccessLevel
        
        if not super().has_permission(request, view):
            return False
        
        user_level = MultiTierAccessManager.get_user_access_level(request.user)
        allowed_levels = [AccessLevel.OWNER, AccessLevel.STATE]
        
        return user_level in allowed_levels


# Example 7: Django form with access validation
from django import forms
from django.core.exceptions import ValidationError

class StateDataForm(forms.Form):
    """
    Form that validates user has access to selected state.
    """
    state = forms.ChoiceField(choices=[])
    
    def __init__(self, *args, user=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = user
        
        if user:
            # Populate state choices based on user access
            accessible_states = get_accessible_states(user)
            state_choices = [(state, state) for state in accessible_states]
            self.fields['state'].choices = state_choices
    
    def clean_state(self):
        state = self.cleaned_data['state']
        
        if self.user and not user_can_access_state(self.user, state):
            raise ValidationError("You don't have access to this state")
        
        return state


# Example 8: Class-based view with multi-tier access
from django.views.generic import ListView
from django.contrib.auth.mixins import LoginRequiredMixin

class CampaignListView(LoginRequiredMixin, ListView):
    """
    Class-based view that filters campaigns based on user access.
    """
    template_name = 'campaigns/list.html'
    context_object_name = 'campaigns'
    
    def get_queryset(self):
        from users.models import User
        
        accessible_states = get_accessible_states(self.request.user)
        return User.objects.filter(
            role='campaign',
            campaign_account__state__in=accessible_states
        ).select_related('campaign_account')
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['accessible_states'] = get_accessible_states(self.request.user)
        context['user_access_level'] = MultiTierAccessManager.get_user_access_level(self.request.user)
        return context


"""
Template Usage Examples:

In your Django templates, you can use the context processor functions:

<!-- Check if user can access a specific state -->
{% if user_can_access_state:'CA' %}
    <a href="{% url 'california-data' %}">View California Data</a>
{% endif %}

<!-- Show accessible states -->
<select name="state">
    {% for state in user_accessible_states %}
        <option value="{{ state }}">{{ state }}</option>
    {% endfor %}
</select>

<!-- Show different content based on access level -->
{% if request.user_access_level == 'owner' %}
    <div class="admin-panel">Owner controls here</div>
{% elif request.user_access_level == 'state' %}
    <div class="state-panel">State controls here</div>
{% endif %}
"""