from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid


class User(AbstractUser):
    """Custom user model with role-based authentication."""
    
    ROLE_CHOICES = [
        ('state', 'State'),
        ('county', 'County'),
        ('candidate', 'Candidate'),
        ('vendor', 'Vendor'),
        ('volunteer', 'Volunteer'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    email = models.EmailField(unique=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'role']

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"


class StateAccount(models.Model):
    """State-level account details."""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='state_account')
    name = models.CharField(max_length=100)
    state = models.CharField(max_length=2)  # State abbreviation
    sos_reference_id = models.CharField(max_length=50, blank=True)  # Secretary of State reference
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.state}"


class CountyAccount(models.Model):
    """County-level account details."""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='county_account')
    name = models.CharField(max_length=100)
    state = models.CharField(max_length=2)
    county = models.CharField(max_length=100)
    sos_reference_id = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.county}, {self.state}"


class CandidateAccount(models.Model):
    """Candidate account details."""
    
    OFFICE_TYPE_CHOICES = [
        ('federal', 'Federal'),
        ('state', 'State'),
        ('county', 'County'),
        ('local', 'Local'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='candidate_account')
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
