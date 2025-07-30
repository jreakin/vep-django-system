from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone
from datetime import timedelta
import uuid
import random
import secrets


class UserManager(BaseUserManager):
    """Custom user manager for phone-based authentication."""
    
    def create_user(self, phone_number, role, **extra_fields):
        """Create and return a regular user with phone number."""
        if not phone_number:
            raise ValueError('The Phone Number field must be set')
        if not role:
            raise ValueError('The Role field must be set')
        
        extra_fields.setdefault('is_active', True)
        user = self.model(phone_number=phone_number, role=role, **extra_fields)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, phone_number, role='owner', **extra_fields):
        """Create and return a superuser with phone number."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_verified', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(phone_number, role, **extra_fields)


class User(AbstractUser):
    """Custom user model with phone-based authentication."""
    
    ROLE_CHOICES = [
        ('owner', 'Owner'),
        ('state', 'State Party'),
        ('county', 'County Party'),
        ('campaign', 'Campaign'),
        ('vendor', 'Vendor'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    phone_number = models.CharField(max_length=20, unique=True)
    email = models.EmailField(blank=True, null=True)  # Optional for some users
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Remove default username requirement
    username = None
    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = ['role']
    
    objects = UserManager()

    def __str__(self):
        return f"{self.phone_number} ({self.get_role_display()})"


class AuthPIN(models.Model):
    """PIN-based authentication model."""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='auth_pins')
    pin = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        if not self.pin:
            self.pin = f"{secrets.randbelow(1000000):06}"
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=10)  # PIN expires in 10 minutes
        super().save(*args, **kwargs)
    
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    def is_valid(self):
        return not self.is_used and not self.is_expired() and self.attempts < 3
    
    def __str__(self):
        return f"PIN for {self.user.phone_number} - {self.pin}"


class OwnerAccount(models.Model):
    """Owner-level account details with full system access."""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='owner_account')
    company_name = models.CharField(max_length=100)
    contact_name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Owner: {self.company_name} - {self.contact_name}"


class StateAccount(models.Model):
    """State party account details."""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='state_account')
    name = models.CharField(max_length=100)
    state = models.CharField(max_length=2)  # State abbreviation
    sos_reference_id = models.CharField(max_length=50, blank=True)  # Secretary of State reference
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.state}"


class CountyAccount(models.Model):
    """County party account details."""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='county_account')
    name = models.CharField(max_length=100)
    state = models.CharField(max_length=2)
    county = models.CharField(max_length=100)
    sos_reference_id = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.county}, {self.state}"


class CampaignAccount(models.Model):
    """Campaign account details."""
    
    OFFICE_TYPE_CHOICES = [
        ('federal', 'Federal'),
        ('state', 'State'),
        ('county', 'County'),
        ('local', 'Local'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='campaign_account')
    name = models.CharField(max_length=100)
    office_type = models.CharField(max_length=20, choices=OFFICE_TYPE_CHOICES)
    office_name = models.CharField(max_length=100)
    district_ids = models.JSONField(default=list, blank=True)
    state = models.CharField(max_length=2)
    party_affiliation = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.office_name}"


class VendorAccount(models.Model):
    """Vendor account details."""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='vendor_account')
    company_name = models.CharField(max_length=100)
    contact_name = models.CharField(max_length=100)
    business_type = models.CharField(max_length=100)
    states_served = models.JSONField(default=list, blank=True)
    services_offered = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.company_name} - {self.contact_name}"


class Invoice(models.Model):
    """Billing invoice model."""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ]
    
    BILLING_CYCLE_CHOICES = [
        ('monthly', 'Monthly'),
        ('annual', 'Annual'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='invoices')
    period_start = models.DateField()
    period_end = models.DateField()
    billing_cycle = models.CharField(max_length=10, choices=BILLING_CYCLE_CHOICES)
    amount_due = models.DecimalField(max_digits=10, decimal_places=2)
    platform_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    service_fees = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    due_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Invoice {self.id} - {self.user.phone_number} - ${self.amount_due}"


class Payment(models.Model):
    """Payment tracking model."""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('succeeded', 'Succeeded'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    stripe_payment_intent_id = models.CharField(max_length=255, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=100, blank=True)
    failure_reason = models.TextField(blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment {self.id} - {self.amount} - {self.status}"


class VolunteerInvite(models.Model):
    """Volunteer invitation management."""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('expired', 'Expired'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField()
    campaign_id = models.UUIDField()
    inviter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_invites')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    invited_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField()

    def __str__(self):
        return f"Invite to {self.email} - {self.status}"
