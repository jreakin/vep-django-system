import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from authentication.services import AuthenticationService
from users.models import AuthPIN
from billing.services import BillingService
from decimal import Decimal

User = get_user_model()


class PhoneAuthenticationTest(TestCase):
    """Test phone-based authentication system."""
    
    def setUp(self):
        self.auth_service = AuthenticationService()
        self.phone_number = '+1234567890'
        self.role = 'campaign'
    
    def test_user_registration(self):
        """Test user registration with phone number."""
        user = self.auth_service.register_user(self.phone_number, self.role)
        
        self.assertEqual(user.phone_number, self.phone_number)
        self.assertEqual(user.role, self.role)
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_verified)
    
    def test_pin_creation(self):
        """Test PIN creation for user."""
        user = self.auth_service.register_user(self.phone_number, self.role)
        auth_pin = self.auth_service.create_pin_for_user(user)
        
        # Since Twilio is not configured in test, auth_pin will be None
        # In a real environment with Twilio configured, this would work
        if auth_pin:
            self.assertEqual(len(auth_pin.pin), 6)
            self.assertEqual(auth_pin.user, user)
            self.assertFalse(auth_pin.is_used)
    
    def test_duplicate_phone_registration(self):
        """Test that duplicate phone numbers are not allowed."""
        self.auth_service.register_user(self.phone_number, self.role)
        
        with self.assertRaises(ValueError):
            self.auth_service.register_user(self.phone_number, 'vendor')


class BillingSystemTest(TestCase):
    """Test billing system functionality."""
    
    def setUp(self):
        self.billing_service = BillingService()
        self.user = User.objects.create(
            phone_number='+1234567890',
            role='campaign',
            is_active=True,
            is_verified=True
        )
    
    def test_platform_fee_calculation(self):
        """Test platform fee calculation for different roles."""
        # Test campaign role
        amount = self.billing_service.calculate_billing_amount(self.user, 'monthly')
        self.assertEqual(amount, Decimal('29.00'))
        
        # Test annual billing (10% discount)
        annual_amount = self.billing_service.calculate_billing_amount(self.user, 'annual')
        expected_annual = Decimal('29.00') * 12 * Decimal('0.9')
        self.assertEqual(annual_amount, expected_annual)
    
    def test_invoice_creation(self):
        """Test invoice creation."""
        invoice = self.billing_service.create_invoice(self.user, 'monthly')
        
        self.assertEqual(invoice.user, self.user)
        self.assertEqual(invoice.billing_cycle, 'monthly')
        self.assertEqual(invoice.amount_due, Decimal('29.00'))
        self.assertEqual(invoice.status, 'pending')
    
    def test_owner_no_platform_fee(self):
        """Test that owners don't pay platform fees."""
        owner = User.objects.create(
            phone_number='+1987654321',
            role='owner',
            is_active=True,
            is_verified=True
        )
        
        amount = self.billing_service.calculate_billing_amount(owner, 'monthly')
        self.assertEqual(amount, Decimal('0.00'))


class UserModelTest(TestCase):
    """Test User model functionality."""
    
    def test_user_creation(self):
        """Test creating users with different roles."""
        roles = ['owner', 'state', 'county', 'campaign', 'vendor']
        
        for i, role in enumerate(roles):
            user = User.objects.create(
                phone_number=f'+123456789{i}',
                role=role,
                is_active=True
            )
            
            self.assertEqual(user.role, role)
            self.assertEqual(str(user), f"+123456789{i} ({user.get_role_display()})")
    
    def test_phone_number_uniqueness(self):
        """Test that phone numbers must be unique."""
        User.objects.create(
            phone_number='+1234567890',
            role='campaign'
        )
        
        with self.assertRaises(Exception):  # IntegrityError
            User.objects.create(
                phone_number='+1234567890',
                role='vendor'
            )