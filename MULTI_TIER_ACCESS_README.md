# Multi-Tier Access Control System

A comprehensive hierarchical access control system for the VEP Django System that respects political organization structures and geographic boundaries.

## Overview

The Multi-Tier Access Control System implements a sophisticated permission framework that understands the hierarchical nature of political organizations:

```
Owner ──→ Full system access
  ↓
State ──→ Counties & campaigns in their state  
  ↓
County ─→ Campaigns in their county
  ↓
Campaign → Their own data only
  ↓
Vendor ──→ States they serve
```

## Key Features

- **Hierarchical Permissions**: Role-based access that respects organizational hierarchy
- **Geographic Boundaries**: State and county-level access control
- **Vendor Services**: Access based on states served and services offered  
- **DRF Integration**: Permission classes for Django REST Framework
- **Template Support**: Utility functions for template-based access checking
- **Decorator Support**: Function decorators for view-level access control

## Files

- `multi_tier_access_system.py` - Core access control system
- `test_multi_tier_access_system.py` - Comprehensive test suite (35 tests)
- `multi_tier_access_examples.py` - Usage examples and patterns

## Quick Start

### 1. Basic Usage with Decorators

```python
from multi_tier_access_system import require_multi_tier_access, owner_only

@require_multi_tier_access(required_state='CA')
def california_data(request):
    # Only users with CA access can call this
    return JsonResponse({'message': 'CA data'})

@owner_only  
def admin_function(request):
    # Only owners can call this
    return JsonResponse({'message': 'Admin panel'})
```

### 2. DRF ViewSet Integration

```python
from multi_tier_access_system import MultiTierPermission

class CampaignViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, MultiTierPermission]
    
    def get_queryset(self):
        accessible_states = get_accessible_states(self.request.user)
        return Campaign.objects.filter(state__in=accessible_states)
```

### 3. Template Usage

```html
{% if user_can_access_state:'CA' %}
    <a href="{% url 'california-data' %}">View CA Data</a>
{% endif %}

<select name="state">
    {% for state in user_accessible_states %}
        <option value="{{ state }}">{{ state }}</option>
    {% endfor %}
</select>
```

### 4. Manual Access Checking

```python
from multi_tier_access_system import user_can_access_campaign

def campaign_view(request, campaign_id):
    if not user_can_access_campaign(request.user, campaign_id):
        return HttpResponseForbidden("Access denied")
    
    # Proceed with business logic
    ...
```

## Access Control Rules

### Owner Level
- ✅ Access to all states, counties, campaigns, and vendors
- ✅ Full administrative privileges
- ✅ Can create and manage all account types

### State Level  
- ✅ Access to their own state data
- ✅ Access to all counties within their state
- ✅ Access to all campaigns within their state
- ✅ Access to vendors serving their state
- ❌ Cannot access other states

### County Level
- ✅ Access to their own county data
- ✅ Access to their state data  
- ✅ Access to campaigns within their county
- ✅ Access to vendors serving their state
- ❌ Cannot access other counties or states

### Campaign Level
- ✅ Access to their own campaign data
- ✅ Access to their state data (read-only)
- ✅ Access to vendors serving their state
- ❌ Cannot access other campaigns
- ❌ Cannot access county-specific data

### Vendor Level
- ✅ Access to states they serve
- ✅ Access to counties in states they serve
- ✅ Access to campaigns in states they serve
- ✅ Access to their own vendor data
- ❌ Cannot access states they don't serve

## API Reference

### Core Classes

#### `MultiTierAccessManager`
Central manager for access control logic.

**Methods:**
- `get_user_access_level(user)` - Get user's access level
- `can_access_state_data(user, state)` - Check state access
- `can_access_county_data(user, state, county)` - Check county access  
- `can_access_campaign_data(user, campaign_id)` - Check campaign access
- `can_access_vendor_data(user, vendor_id)` - Check vendor access

#### `MultiTierPermission`
DRF permission class for ViewSets and API views.

**Usage:**
```python
class MyViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, MultiTierPermission]
    
    # Set access parameters
    multi_tier_params = {'required_state': 'CA'}
```

### Decorators

#### `@require_multi_tier_access(...)`
Function decorator for access control.

**Parameters:**
- `required_level` - Minimum access level required
- `required_state` - Specific state access required
- `required_county` - Specific county access required
- `required_campaign_id` - Specific campaign access required  
- `required_vendor_id` - Specific vendor access required

#### `@owner_only`
Restrict access to owners only.

#### `@state_or_above`  
Restrict access to state level and above.

### Utility Functions

#### Template Functions
- `user_can_access_state(user, state)`
- `user_can_access_county(user, state, county)`
- `user_can_access_campaign(user, campaign_id)`
- `user_can_access_vendor(user, vendor_id)`

#### Query Helpers
- `get_accessible_states(user)` - Get list of accessible states
- `get_accessible_counties(user, state=None)` - Get list of accessible counties

## Testing

The system includes comprehensive tests covering:

- ✅ All access control scenarios
- ✅ Edge cases and error conditions  
- ✅ Integration with Django auth
- ✅ Permission class behavior
- ✅ Decorator functionality
- ✅ Utility function accuracy

Run tests with:
```bash
python manage.py test test_multi_tier_access_system
```

## Integration with Existing System

The multi-tier access system:

- ✅ **Extends** the existing permission system without breaking changes
- ✅ **Compatible** with existing role-based permissions
- ✅ **Integrates** seamlessly with Django's authentication
- ✅ **Preserves** all existing functionality
- ✅ **Adds** sophisticated hierarchical access control

## Example Scenarios

### Scenario 1: State Party User
A California state party user can:
- ✅ View all California counties
- ✅ Access all California campaigns  
- ✅ Manage vendors serving California
- ❌ Access Texas or other state data

### Scenario 2: County Party User
A Los Angeles county user can:
- ✅ View Los Angeles county data
- ✅ Access campaigns in Los Angeles county
- ✅ View California state-level data
- ❌ Access Orange County data
- ❌ Access other states

### Scenario 3: Campaign User
A Texas gubernatorial campaign can:
- ✅ Access their own campaign data
- ✅ View Texas state data (read-only)
- ✅ Contact vendors serving Texas
- ❌ Access other campaigns
- ❌ Access county-specific data

### Scenario 4: Vendor User
A vendor serving CA, TX, and NY can:
- ✅ Access campaigns in CA, TX, and NY
- ✅ View state and county data for served states
- ✅ Manage their own vendor profile
- ❌ Access states they don't serve

## Performance Considerations

The system is designed for efficiency:

- **Lazy Evaluation**: Access checks only performed when needed
- **Database Optimization**: Minimal queries for access determination
- **Caching Ready**: Access levels can be cached for performance
- **Scalable Design**: Handles large numbers of users and entities

## Security Features

- **Principle of Least Privilege**: Users get minimum necessary access
- **Defense in Depth**: Multiple layers of access control
- **Audit Trail Ready**: All access decisions are deterministic and loggable
- **No Privilege Escalation**: Users cannot gain access beyond their role

## Future Enhancements

Potential future improvements:
- **District-level Access**: More granular geographic permissions
- **Time-based Access**: Temporary or scheduled access controls
- **Service-based Permissions**: Vendor access based on specific services
- **Dynamic Hierarchies**: Support for changing organizational structures

## Conclusion

The Multi-Tier Access Control System provides a robust, scalable, and secure foundation for managing access in political campaign management systems. It respects organizational hierarchies while maintaining flexibility and ease of use.