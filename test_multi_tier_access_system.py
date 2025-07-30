"""
Tests for the Multi-Tier Access Control System.

This test module validates the hierarchical access control logic
for the VEP Django System.
"""

import pytest
from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied
from unittest.mock import Mock

from multi_tier_access_system import (
    MultiTierAccessManager,
    MultiTierPermission,
    AccessLevel,
    require_multi_tier_access,
    owner_only,
    state_or_above,
    user_can_access_state,
    user_can_access_county,
    user_can_access_campaign,
    user_can_access_vendor,
    get_accessible_states,
    get_accessible_counties
)
from users.models import (
    OwnerAccount, StateAccount, CountyAccount, 
    CampaignAccount, VendorAccount
)

User = get_user_model()


class MultiTierAccessSystemTest(TestCase):
    """Test suite for multi-tier access control system."""
    
    def setUp(self):
        """Set up test data with different user types."""
        # Create Owner user
        self.owner_user = User.objects.create(
            phone_number='+1111111111',
            role='owner',
            is_active=True,
            is_verified=True
        )
        self.owner_account = OwnerAccount.objects.create(
            user=self.owner_user,
            company_name='VEP Systems',
            contact_name='Admin User'
        )
        
        # Create State user for California
        self.state_user_ca = User.objects.create(
            phone_number='+1222222222',
            role='state',
            is_active=True,
            is_verified=True
        )
        self.state_account_ca = StateAccount.objects.create(
            user=self.state_user_ca,
            name='California Democratic Party',
            state='CA'
        )
        
        # Create State user for Texas
        self.state_user_tx = User.objects.create(
            phone_number='+1333333333',
            role='state',
            is_active=True,
            is_verified=True
        )
        self.state_account_tx = StateAccount.objects.create(
            user=self.state_user_tx,
            name='Texas Democratic Party',
            state='TX'
        )
        
        # Create County user for Los Angeles, CA
        self.county_user_la = User.objects.create(
            phone_number='+1444444444',
            role='county',
            is_active=True,
            is_verified=True
        )
        self.county_account_la = CountyAccount.objects.create(
            user=self.county_user_la,
            name='Los Angeles County Democrats',
            state='CA',
            county='Los Angeles'
        )
        
        # Create County user for Harris, TX
        self.county_user_harris = User.objects.create(
            phone_number='+1555555555',
            role='county',
            is_active=True,
            is_verified=True
        )
        self.county_account_harris = CountyAccount.objects.create(
            user=self.county_user_harris,
            name='Harris County Democrats',
            state='TX',
            county='Harris'
        )
        
        # Create Campaign user in California
        self.campaign_user_ca = User.objects.create(
            phone_number='+1666666666',
            role='campaign',
            is_active=True,
            is_verified=True
        )
        self.campaign_account_ca = CampaignAccount.objects.create(
            user=self.campaign_user_ca,
            name='Smith for Senate',
            office_type='federal',
            office_name='U.S. Senate',
            state='CA'
        )
        
        # Create Campaign user in Texas
        self.campaign_user_tx = User.objects.create(
            phone_number='+1777777777',
            role='campaign',
            is_active=True,
            is_verified=True
        )
        self.campaign_account_tx = CampaignAccount.objects.create(
            user=self.campaign_user_tx,
            name='Jones for Governor',
            office_type='state',
            office_name='Governor',
            state='TX'
        )
        
        # Create Vendor user serving CA and TX
        self.vendor_user = User.objects.create(
            phone_number='+1888888888',
            role='vendor',
            is_active=True,
            is_verified=True
        )
        self.vendor_account = VendorAccount.objects.create(
            user=self.vendor_user,
            company_name='Political Tech Solutions',
            contact_name='Vendor Contact',
            business_type='Technology',
            states_served=['CA', 'TX']
        )
        
        # Create Vendor user serving only NY
        self.vendor_user_ny = User.objects.create(
            phone_number='+1999999999',
            role='vendor',
            is_active=True,
            is_verified=True
        )
        self.vendor_account_ny = VendorAccount.objects.create(
            user=self.vendor_user_ny,
            company_name='NY Campaign Services',
            contact_name='NY Vendor',
            business_type='Consulting',
            states_served=['NY']
        )
        
        self.factory = RequestFactory()


class TestMultiTierAccessManager(MultiTierAccessSystemTest):
    """Test the core access manager logic."""
    
    def test_get_user_access_level(self):
        """Test access level determination for different user types."""
        self.assertEqual(
            MultiTierAccessManager.get_user_access_level(self.owner_user),
            AccessLevel.OWNER
        )
        self.assertEqual(
            MultiTierAccessManager.get_user_access_level(self.state_user_ca),
            AccessLevel.STATE
        )
        self.assertEqual(
            MultiTierAccessManager.get_user_access_level(self.county_user_la),
            AccessLevel.COUNTY
        )
        self.assertEqual(
            MultiTierAccessManager.get_user_access_level(self.campaign_user_ca),
            AccessLevel.CAMPAIGN
        )
        self.assertEqual(
            MultiTierAccessManager.get_user_access_level(self.vendor_user),
            AccessLevel.VENDOR
        )
        
    def test_unauthenticated_user_access_level(self):
        """Test access level for unauthenticated users."""
        unauthenticated_user = User()  # Not saved, not authenticated
        self.assertEqual(
            MultiTierAccessManager.get_user_access_level(unauthenticated_user),
            AccessLevel.NONE
        )
        
    def test_can_access_state_data_owner(self):
        """Test owner can access any state data."""
        self.assertTrue(
            MultiTierAccessManager.can_access_state_data(self.owner_user, 'CA')
        )
        self.assertTrue(
            MultiTierAccessManager.can_access_state_data(self.owner_user, 'TX')
        )
        self.assertTrue(
            MultiTierAccessManager.can_access_state_data(self.owner_user, 'NY')
        )
        
    def test_can_access_state_data_state_user(self):
        """Test state user can only access their own state."""
        # CA state user
        self.assertTrue(
            MultiTierAccessManager.can_access_state_data(self.state_user_ca, 'CA')
        )
        self.assertFalse(
            MultiTierAccessManager.can_access_state_data(self.state_user_ca, 'TX')
        )
        
        # TX state user  
        self.assertTrue(
            MultiTierAccessManager.can_access_state_data(self.state_user_tx, 'TX')
        )
        self.assertFalse(
            MultiTierAccessManager.can_access_state_data(self.state_user_tx, 'CA')
        )
        
    def test_can_access_state_data_county_user(self):
        """Test county user can access their state data."""
        self.assertTrue(
            MultiTierAccessManager.can_access_state_data(self.county_user_la, 'CA')
        )
        self.assertFalse(
            MultiTierAccessManager.can_access_state_data(self.county_user_la, 'TX')
        )
        
    def test_can_access_state_data_campaign_user(self):
        """Test campaign user can access their state data."""
        self.assertTrue(
            MultiTierAccessManager.can_access_state_data(self.campaign_user_ca, 'CA')
        )
        self.assertFalse(
            MultiTierAccessManager.can_access_state_data(self.campaign_user_ca, 'TX')
        )
        
    def test_can_access_state_data_vendor_user(self):
        """Test vendor user can access states they serve."""
        # Vendor serving CA and TX
        self.assertTrue(
            MultiTierAccessManager.can_access_state_data(self.vendor_user, 'CA')
        )
        self.assertTrue(
            MultiTierAccessManager.can_access_state_data(self.vendor_user, 'TX')
        )
        self.assertFalse(
            MultiTierAccessManager.can_access_state_data(self.vendor_user, 'NY')
        )
        
        # Vendor serving only NY
        self.assertTrue(
            MultiTierAccessManager.can_access_state_data(self.vendor_user_ny, 'NY')
        )
        self.assertFalse(
            MultiTierAccessManager.can_access_state_data(self.vendor_user_ny, 'CA')
        )
        
    def test_can_access_county_data_owner(self):
        """Test owner can access any county data."""
        self.assertTrue(
            MultiTierAccessManager.can_access_county_data(
                self.owner_user, 'CA', 'Los Angeles'
            )
        )
        self.assertTrue(
            MultiTierAccessManager.can_access_county_data(
                self.owner_user, 'TX', 'Harris'
            )
        )
        
    def test_can_access_county_data_state_user(self):
        """Test state user can access counties in their state."""
        # CA state user can access CA counties
        self.assertTrue(
            MultiTierAccessManager.can_access_county_data(
                self.state_user_ca, 'CA', 'Los Angeles'
            )
        )
        self.assertTrue(
            MultiTierAccessManager.can_access_county_data(
                self.state_user_ca, 'CA', 'Orange'
            )
        )
        
        # CA state user cannot access TX counties
        self.assertFalse(
            MultiTierAccessManager.can_access_county_data(
                self.state_user_ca, 'TX', 'Harris'
            )
        )
        
    def test_can_access_county_data_county_user(self):
        """Test county user can only access their own county."""
        # LA county user can access LA county
        self.assertTrue(
            MultiTierAccessManager.can_access_county_data(
                self.county_user_la, 'CA', 'Los Angeles'
            )
        )
        
        # LA county user cannot access other counties
        self.assertFalse(
            MultiTierAccessManager.can_access_county_data(
                self.county_user_la, 'CA', 'Orange'
            )
        )
        self.assertFalse(
            MultiTierAccessManager.can_access_county_data(
                self.county_user_la, 'TX', 'Harris'
            )
        )
        
    def test_can_access_campaign_data_owner(self):
        """Test owner can access any campaign data."""
        self.assertTrue(
            MultiTierAccessManager.can_access_campaign_data(
                self.owner_user, self.campaign_user_ca.id
            )
        )
        self.assertTrue(
            MultiTierAccessManager.can_access_campaign_data(
                self.owner_user, self.campaign_user_tx.id
            )
        )
        
    def test_can_access_campaign_data_self(self):
        """Test users can access their own campaign data."""
        self.assertTrue(
            MultiTierAccessManager.can_access_campaign_data(
                self.campaign_user_ca, self.campaign_user_ca.id
            )
        )
        self.assertTrue(
            MultiTierAccessManager.can_access_campaign_data(
                self.campaign_user_tx, self.campaign_user_tx.id
            )
        )
        
    def test_can_access_campaign_data_cross_access(self):
        """Test campaign users cannot access other campaigns directly."""
        self.assertFalse(
            MultiTierAccessManager.can_access_campaign_data(
                self.campaign_user_ca, self.campaign_user_tx.id
            )
        )
        
    def test_can_access_campaign_data_state_user(self):
        """Test state user can access campaigns in their state."""
        self.assertTrue(
            MultiTierAccessManager.can_access_campaign_data(
                self.state_user_ca, self.campaign_user_ca.id
            )
        )
        self.assertFalse(
            MultiTierAccessManager.can_access_campaign_data(
                self.state_user_ca, self.campaign_user_tx.id
            )
        )
        
    def test_can_access_campaign_data_vendor_user(self):
        """Test vendor user can access campaigns in states they serve."""
        self.assertTrue(
            MultiTierAccessManager.can_access_campaign_data(
                self.vendor_user, self.campaign_user_ca.id
            )
        )
        self.assertTrue(
            MultiTierAccessManager.can_access_campaign_data(
                self.vendor_user, self.campaign_user_tx.id
            )
        )
        
        # Vendor serving only NY cannot access CA/TX campaigns
        self.assertFalse(
            MultiTierAccessManager.can_access_campaign_data(
                self.vendor_user_ny, self.campaign_user_ca.id
            )
        )
        
    def test_can_access_vendor_data_owner(self):
        """Test owner can access any vendor data."""
        self.assertTrue(
            MultiTierAccessManager.can_access_vendor_data(
                self.owner_user, self.vendor_user.id
            )
        )
        self.assertTrue(
            MultiTierAccessManager.can_access_vendor_data(
                self.owner_user, self.vendor_user_ny.id
            )
        )
        
    def test_can_access_vendor_data_self(self):
        """Test vendors can access their own data."""
        self.assertTrue(
            MultiTierAccessManager.can_access_vendor_data(
                self.vendor_user, self.vendor_user.id
            )
        )
        
    def test_can_access_vendor_data_state_access(self):
        """Test state users can access vendors serving their state."""
        self.assertTrue(
            MultiTierAccessManager.can_access_vendor_data(
                self.state_user_ca, self.vendor_user.id  # Vendor serves CA
            )
        )
        self.assertFalse(
            MultiTierAccessManager.can_access_vendor_data(
                self.state_user_ca, self.vendor_user_ny.id  # Vendor serves only NY
            )
        )


class TestMultiTierPermissionClass(MultiTierAccessSystemTest):
    """Test the DRF permission class."""
    
    def test_permission_unauthenticated(self):
        """Test permission denies unauthenticated users."""
        request = self.factory.get('/')
        request.user = None
        
        permission = MultiTierPermission()
        view = Mock()
        
        self.assertFalse(permission.has_permission(request, view))
        
    def test_permission_authenticated_no_params(self):
        """Test permission allows authenticated users when no params set."""
        request = self.factory.get('/')
        request.user = self.campaign_user_ca
        
        permission = MultiTierPermission()
        view = Mock()
        view.multi_tier_params = {}
        
        self.assertTrue(permission.has_permission(request, view))
        
    def test_permission_state_requirement(self):
        """Test permission with state requirement."""
        request = self.factory.get('/')
        request.user = self.state_user_ca
        
        permission = MultiTierPermission()
        view = Mock()
        view.multi_tier_params = {'required_state': 'CA'}
        
        # CA state user can access CA data
        self.assertTrue(permission.has_permission(request, view))
        
        # Change requirement to TX
        view.multi_tier_params = {'required_state': 'TX'}
        self.assertFalse(permission.has_permission(request, view))
        
    def test_permission_campaign_requirement(self):
        """Test permission with campaign requirement."""
        request = self.factory.get('/')
        request.user = self.campaign_user_ca
        
        permission = MultiTierPermission()
        view = Mock()
        view.multi_tier_params = {'required_campaign_id': str(self.campaign_user_ca.id)}
        
        # Campaign user can access their own data
        self.assertTrue(permission.has_permission(request, view))
        
        # Cannot access different campaign
        view.multi_tier_params = {'required_campaign_id': str(self.campaign_user_tx.id)}
        self.assertFalse(permission.has_permission(request, view))


class TestAccessDecorators(MultiTierAccessSystemTest):
    """Test the access control decorators."""
    
    def test_require_multi_tier_access_decorator(self):
        """Test the require_multi_tier_access decorator."""
        
        @require_multi_tier_access(required_state='CA')
        def test_view(request):
            return "Success"
            
        # Create mock request with CA state user
        request = self.factory.get('/')
        request.user = self.state_user_ca
        
        # Should succeed
        result = test_view(request)
        self.assertEqual(result, "Success")
        
        # Create mock request with TX state user
        request.user = self.state_user_tx
        
        # Should fail
        with self.assertRaises(PermissionDenied):
            test_view(request)
            
    def test_owner_only_decorator(self):
        """Test the owner_only decorator."""
        
        @owner_only
        def admin_view(request):
            return "Admin Success"
            
        # Owner should succeed
        request = self.factory.get('/')
        request.user = self.owner_user
        result = admin_view(request)
        self.assertEqual(result, "Admin Success")
        
        # Non-owner should fail
        request.user = self.state_user_ca
        with self.assertRaises(PermissionDenied):
            admin_view(request)
            
    def test_state_or_above_decorator(self):
        """Test the state_or_above decorator."""
        
        @state_or_above
        def state_view(request):
            return "State Success"
            
        request = self.factory.get('/')
        
        # Owner should succeed
        request.user = self.owner_user
        result = state_view(request)
        self.assertEqual(result, "State Success")
        
        # State user should succeed
        request.user = self.state_user_ca
        result = state_view(request)
        self.assertEqual(result, "State Success")
        
        # Campaign user should fail (below state level)
        request.user = self.campaign_user_ca
        with self.assertRaises(PermissionDenied):
            state_view(request)


class TestUtilityFunctions(MultiTierAccessSystemTest):
    """Test utility functions for template and other usage."""
    
    def test_user_can_access_state(self):
        """Test template-friendly state access function."""
        self.assertTrue(user_can_access_state(self.owner_user, 'CA'))
        self.assertTrue(user_can_access_state(self.state_user_ca, 'CA'))
        self.assertFalse(user_can_access_state(self.state_user_ca, 'TX'))
        
    def test_user_can_access_county(self):
        """Test template-friendly county access function."""
        self.assertTrue(user_can_access_county(self.owner_user, 'CA', 'Los Angeles'))
        self.assertTrue(user_can_access_county(self.county_user_la, 'CA', 'Los Angeles'))
        self.assertFalse(user_can_access_county(self.county_user_la, 'TX', 'Harris'))
        
    def test_user_can_access_campaign(self):
        """Test template-friendly campaign access function."""
        self.assertTrue(user_can_access_campaign(self.owner_user, self.campaign_user_ca.id))
        self.assertTrue(user_can_access_campaign(self.campaign_user_ca, self.campaign_user_ca.id))
        self.assertFalse(user_can_access_campaign(self.campaign_user_ca, self.campaign_user_tx.id))
        
    def test_user_can_access_vendor(self):
        """Test template-friendly vendor access function."""
        self.assertTrue(user_can_access_vendor(self.owner_user, self.vendor_user.id))
        self.assertTrue(user_can_access_vendor(self.vendor_user, self.vendor_user.id))
        self.assertTrue(user_can_access_vendor(self.state_user_ca, self.vendor_user.id))
        self.assertFalse(user_can_access_vendor(self.state_user_ca, self.vendor_user_ny.id))
        
    def test_get_accessible_states(self):
        """Test getting list of accessible states for different users."""
        # Owner can access all states
        owner_states = get_accessible_states(self.owner_user)
        self.assertIn('CA', owner_states)
        self.assertIn('TX', owner_states)
        
        # State user can access only their state
        ca_states = get_accessible_states(self.state_user_ca)
        self.assertEqual(ca_states, ['CA'])
        
        # Vendor can access states they serve
        vendor_states = get_accessible_states(self.vendor_user)
        self.assertEqual(set(vendor_states), {'CA', 'TX'})
        
        vendor_ny_states = get_accessible_states(self.vendor_user_ny)
        self.assertEqual(vendor_ny_states, ['NY'])
        
    def test_get_accessible_counties(self):
        """Test getting list of accessible counties for different users."""
        # Owner can access all counties in a state
        owner_counties = get_accessible_counties(self.owner_user, 'CA')
        self.assertIn('Los Angeles', owner_counties)
        
        # State user can access all counties in their state
        ca_counties = get_accessible_counties(self.state_user_ca, 'CA')
        self.assertIn('Los Angeles', ca_counties)
        
        # County user can access only their county
        la_counties = get_accessible_counties(self.county_user_la, 'CA')
        self.assertEqual(la_counties, ['Los Angeles'])
        
        # County user cannot access counties in other states
        la_tx_counties = get_accessible_counties(self.county_user_la, 'TX')
        self.assertEqual(la_tx_counties, [])


class TestEdgeCases(MultiTierAccessSystemTest):
    """Test edge cases and error conditions."""
    
    def test_invalid_campaign_id(self):
        """Test access check with invalid campaign ID."""
        import uuid
        invalid_id = uuid.uuid4()
        
        # Should return False for invalid campaign ID
        self.assertFalse(
            MultiTierAccessManager.can_access_campaign_data(
                self.state_user_ca, invalid_id
            )
        )
        
    def test_invalid_vendor_id(self):
        """Test access check with invalid vendor ID."""
        import uuid
        invalid_id = uuid.uuid4()
        
        # Should return False for invalid vendor ID
        self.assertFalse(
            MultiTierAccessManager.can_access_vendor_data(
                self.state_user_ca, invalid_id
            )
        )
        
    def test_user_without_account_relations(self):
        """Test access checks for users without proper account relations."""
        # Create user without associated account
        orphan_user = User.objects.create(
            phone_number='+1000000000',
            role='state',
            is_active=True,
            is_verified=True
        )
        
        # Should handle gracefully
        self.assertFalse(
            MultiTierAccessManager.can_access_state_data(orphan_user, 'CA')
        )
        
        self.assertEqual(
            get_accessible_states(orphan_user), []
        )
        
    def test_unauthenticated_decorator_access(self):
        """Test decorator behavior with unauthenticated users."""
        
        @require_multi_tier_access(required_state='CA')
        def test_view(request):
            return "Success"
            
        request = self.factory.get('/')
        request.user = None
        
        with self.assertRaises(PermissionDenied):
            test_view(request)
            
        # Test with user that has is_authenticated = False
        unauth_user = User()
        request.user = unauth_user
        
        with self.assertRaises(PermissionDenied):
            test_view(request)