from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class VoterRecord(models.Model):
    """Core voter data record."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    voter_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=200)
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    address = models.TextField()
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=2, blank=True)
    zip_code = models.CharField(max_length=10, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    party_affiliation = models.CharField(max_length=50, blank=True)
    social_media = models.JSONField(default=dict, blank=True)  # FullContact, social handles
    employment = models.JSONField(default=dict, blank=True)   # ZoomInfo, employment data
    data_source = models.CharField(max_length=100)
    account_owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_voters')
    last_updated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['voter_id']),
            models.Index(fields=['state', 'zip_code']),
            models.Index(fields=['account_owner']),
        ]

    def __str__(self):
        return f"{self.name} ({self.voter_id})"


class Election(models.Model):
    """Election metadata."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    election_date = models.DateField()
    election_type = models.CharField(max_length=50)  # primary, general, special
    state = models.CharField(max_length=2)
    jurisdiction = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.election_date}"


class ElectionData(models.Model):
    """Voter-specific election participation data."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    voter = models.ForeignKey(VoterRecord, on_delete=models.CASCADE, related_name='election_data')
    election = models.ForeignKey(Election, on_delete=models.CASCADE, related_name='voter_data')
    voted = models.BooleanField(default=False)
    vote_method = models.CharField(max_length=50, blank=True)  # in-person, absentee, early
    vote_date = models.DateField(null=True, blank=True)
    precinct = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['voter', 'election']

    def __str__(self):
        return f"{self.voter.name} - {self.election.name}"


class EarlyVoteRecord(models.Model):
    """Early voting specific data."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    voter = models.ForeignKey(VoterRecord, on_delete=models.CASCADE, related_name='early_votes')
    election = models.ForeignKey(Election, on_delete=models.CASCADE, related_name='early_votes')
    requested_date = models.DateField(null=True, blank=True)
    sent_date = models.DateField(null=True, blank=True)
    received_date = models.DateField(null=True, blank=True)
    ballot_status = models.CharField(max_length=50, blank=True)
    return_method = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['voter', 'election']

    def __str__(self):
        return f"{self.voter.name} - Early Vote {self.election.name}"


class VoterEngagement(models.Model):
    """Track interactions and engagement with voters."""
    
    ENGAGEMENT_TYPE_CHOICES = [
        ('phone_call', 'Phone Call'),
        ('door_knock', 'Door Knock'),
        ('text_message', 'Text Message'),
        ('email', 'Email'),
        ('direct_mail', 'Direct Mail'),
        ('social_media', 'Social Media'),
        ('event', 'Event'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    voter = models.ForeignKey(VoterRecord, on_delete=models.CASCADE, related_name='engagements')
    engagement_type = models.CharField(max_length=50, choices=ENGAGEMENT_TYPE_CHOICES)
    campaign_id = models.UUIDField(null=True, blank=True)
    engaged_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='voter_engagements')
    notes = models.TextField(blank=True)
    response_data = models.JSONField(default=dict, blank=True)  # survey responses, etc.
    engagement_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['voter', 'engagement_date']),
            models.Index(fields=['campaign_id']),
        ]

    def __str__(self):
        return f"{self.voter.name} - {self.get_engagement_type_display()}"
