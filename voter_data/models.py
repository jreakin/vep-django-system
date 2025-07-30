from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class VoterRecord(models.Model):
    """Enhanced voter data record with comprehensive field mapping support."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Legacy fields (keeping for backward compatibility)
    voter_id = models.CharField(max_length=50, unique=True, blank=True)  # maps to voter_vuid
    name = models.CharField(max_length=200, blank=True)  # computed from person names
    first_name = models.CharField(max_length=100, blank=True)  # maps to person_name_first
    last_name = models.CharField(max_length=100, blank=True)  # maps to person_name_last
    address = models.TextField(blank=True)  # maps to residential_address
    city = models.CharField(max_length=100, blank=True)  # maps to residence_part_city
    state = models.CharField(max_length=2, blank=True)  # maps to residence_part_state
    zip_code = models.CharField(max_length=10, blank=True)  # maps to residence_part_zip5
    email = models.EmailField(blank=True)  # contact field
    phone = models.CharField(max_length=20, blank=True)  # maps to contact_phone_unknown1
    date_of_birth = models.DateField(null=True, blank=True)  # maps to person_dob
    party_affiliation = models.CharField(max_length=50, blank=True)  # maps to voter_political_party
    social_media = models.JSONField(default=dict, blank=True)  # FullContact, social handles
    employment = models.JSONField(default=dict, blank=True)   # ZoomInfo, employment data
    data_source = models.CharField(max_length=100, default='csv_upload')
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    
    # Enhanced Voter Identification fields
    voter_vuid = models.CharField(max_length=50, blank=True, help_text="Primary voter unique identifier")
    voter_registration_date = models.DateField(null=True, blank=True)
    voter_registration_status = models.CharField(max_length=50, blank=True)
    voter_registration_status_reason = models.CharField(max_length=100, blank=True)
    voter_precinct_number = models.CharField(max_length=10, blank=True)
    voter_precinct_name = models.CharField(max_length=100, blank=True)
    voter_absentee = models.BooleanField(default=False)
    voter_precinct_code = models.CharField(max_length=10, blank=True)
    voter_precinct_split = models.CharField(max_length=10, blank=True)
    voter_registration_application_source = models.CharField(max_length=100, blank=True)
    voter_registration_permanent_absentee = models.BooleanField(default=False)
    voter_registration_type = models.CharField(max_length=50, blank=True)
    voter_political_party = models.CharField(max_length=50, blank=True)
    file_origin = models.CharField(max_length=50, blank=True)
    
    # Enhanced Personal Information fields
    person_name_first = models.CharField(max_length=50, blank=True)
    person_name_middle = models.CharField(max_length=50, blank=True)
    person_name_last = models.CharField(max_length=50, blank=True)
    person_name_prefix = models.CharField(max_length=10, blank=True)
    person_name_suffix = models.CharField(max_length=10, blank=True)
    person_dob = models.DateField(null=True, blank=True)
    person_gender = models.CharField(max_length=10, blank=True)
    
    # Enhanced Residence Address fields
    residence_standardized = models.TextField(blank=True)
    residence_part_house_number = models.CharField(max_length=10, blank=True)
    residence_part_house_direction = models.CharField(max_length=5, blank=True)
    residence_part_street_name = models.CharField(max_length=50, blank=True)
    residence_part_street_type = models.CharField(max_length=10, blank=True)
    residence_part_street_suffix = models.CharField(max_length=20, blank=True)
    residence_part_unit_number = models.CharField(max_length=10, blank=True)
    residence_part_unit_type = models.CharField(max_length=10, blank=True)
    residence_part_city = models.CharField(max_length=50, blank=True)
    residence_part_state = models.CharField(max_length=2, blank=True)
    residence_part_zip5 = models.CharField(max_length=5, blank=True)
    residence_part_zip4 = models.CharField(max_length=4, blank=True)
    residence_address1 = models.CharField(max_length=100, blank=True)
    residence_address2 = models.CharField(max_length=100, blank=True)
    residence_country = models.CharField(max_length=50, blank=True)
    residence_postal_code = models.CharField(max_length=10, blank=True)
    residence_address_id = models.CharField(max_length=50, blank=True)
    residence_effective_date = models.DateField(null=True, blank=True)
    
    # Enhanced Mailing Address fields
    mail_address1 = models.CharField(max_length=100, blank=True)
    mail_address2 = models.CharField(max_length=100, blank=True)
    mail_city = models.CharField(max_length=50, blank=True)
    mail_state = models.CharField(max_length=2, blank=True)
    mail_zip5 = models.CharField(max_length=5, blank=True)
    mail_zip4 = models.CharField(max_length=4, blank=True)
    mail_country = models.CharField(max_length=50, blank=True)
    mail_postal_code = models.CharField(max_length=10, blank=True)
    mail_change_date = models.DateField(null=True, blank=True)
    mail_standardized = models.TextField(blank=True)
    
    # Enhanced Contact Information fields
    contact_phone_unknown1 = models.CharField(max_length=20, blank=True)
    
    # Enhanced District Information fields
    DISTRICT_LEVEL_CHOICES = [
        ('federal', 'Federal'),
        ('state', 'State'),
        ('county', 'County'),
        ('city', 'City'),
        ('local', 'Local'),
        ('special_district', 'Special District'),
    ]
    
    district_level = models.CharField(max_length=20, choices=DISTRICT_LEVEL_CHOICES, blank=True)
    office_type = models.CharField(max_length=100, blank=True)
    
    # Comprehensive district fields
    district_city_limits = models.CharField(max_length=50, blank=True)
    district_county_number = models.CharField(max_length=10, blank=True)
    district_county_ward = models.CharField(max_length=10, blank=True)
    district_state_legislative_lower = models.CharField(max_length=10, blank=True)
    district_state_legislative_upper = models.CharField(max_length=10, blank=True)
    district_federal_congressional = models.CharField(max_length=10, blank=True)
    district_county_commissioner_precinct = models.CharField(max_length=10, blank=True)
    district_city_municipality = models.CharField(max_length=50, blank=True)
    district_county_constable_precinct = models.CharField(max_length=10, blank=True)
    district_county_school_district = models.CharField(max_length=10, blank=True)
    district_county_sub_school_district = models.CharField(max_length=10, blank=True)
    district_county_water_district_01 = models.CharField(max_length=10, blank=True)
    district_county_mass_transit_authority = models.CharField(max_length=10, blank=True)
    district_county_water_district_02 = models.CharField(max_length=10, blank=True)
    district_state_board_of_education = models.CharField(max_length=10, blank=True)
    district_county_community_college = models.CharField(max_length=10, blank=True)
    district_city_council_district = models.CharField(max_length=10, blank=True)
    district_court_municipal = models.CharField(max_length=10, blank=True)
    district_court_county = models.CharField(max_length=10, blank=True)
    district_court_appeallate = models.CharField(max_length=10, blank=True)
    district_city_name = models.CharField(max_length=50, blank=True)
    district_city_school_district = models.CharField(max_length=10, blank=True)
    district_county_id = models.CharField(max_length=10, blank=True)
    district_county_township = models.CharField(max_length=50, blank=True)
    district_county_village = models.CharField(max_length=50, blank=True)
    district_county_local_school_district = models.CharField(max_length=10, blank=True)
    district_county_library_district = models.CharField(max_length=10, blank=True)
    district_county_career_center = models.CharField(max_length=10, blank=True)
    district_county_education_service_center = models.CharField(max_length=10, blank=True)
    district_county_exempted_village_school_district = models.CharField(max_length=10, blank=True)
    district_state_juristidction = models.CharField(max_length=50, blank=True)
    district_state_district_combo = models.CharField(max_length=50, blank=True)
    district_state_upper = models.CharField(max_length=10, blank=True)
    district_state_lower = models.CharField(max_length=10, blank=True)
    district_state_court_of_appeals = models.CharField(max_length=10, blank=True)
    district_state_multijurisdictional_judge = models.CharField(max_length=50, blank=True)
    district_county_name = models.CharField(max_length=50, blank=True)
    district_county_supervisory = models.CharField(max_length=50, blank=True)
    district_county_school = models.CharField(max_length=50, blank=True)
    district_county_sanitary = models.CharField(max_length=50, blank=True)
    district_county_technical_college = models.CharField(max_length=50, blank=True)
    district_county_representational_school = models.CharField(max_length=50, blank=True)
    district_state = models.CharField(max_length=50, blank=True)
    district_county_district_attorney = models.CharField(max_length=50, blank=True)
    district_state_circuit_court = models.CharField(max_length=50, blank=True)
    district_county_first_class_school = models.CharField(max_length=50, blank=True)
    district_city_incorporation = models.CharField(max_length=50, blank=True)
    voter_county = models.CharField(max_length=50, blank=True)
    
    # Derived/computed fields
    residential_address = models.TextField(blank=True, help_text="Full residential address")
    mailing_address = models.TextField(blank=True, help_text="Full mailing address")
    is_verified = models.BooleanField(default=False, help_text="Address verification status")
    
    # System fields
    account_owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_voters')
    last_updated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['voter_id']),
            models.Index(fields=['voter_vuid']),
            models.Index(fields=['state', 'zip_code']),
            models.Index(fields=['residence_part_state', 'residence_part_zip5']),
            models.Index(fields=['account_owner']),
            models.Index(fields=['district_level', 'office_type']),
        ]

    def save(self, *args, **kwargs):
        """Override save to sync between legacy and new fields."""
        # Sync legacy fields with new fields
        if self.voter_vuid and not self.voter_id:
            self.voter_id = self.voter_vuid
        elif self.voter_id and not self.voter_vuid:
            self.voter_vuid = self.voter_id
            
        # Sync name fields
        if self.person_name_first or self.person_name_last:
            self.first_name = self.person_name_first or self.first_name
            self.last_name = self.person_name_last or self.last_name
            self.name = f"{self.person_name_first or ''} {self.person_name_last or ''}".strip()
        elif self.first_name or self.last_name:
            self.person_name_first = self.first_name or self.person_name_first
            self.person_name_last = self.last_name or self.person_name_last
            
        # Sync address fields
        if self.residence_part_city and not self.city:
            self.city = self.residence_part_city
        elif self.city and not self.residence_part_city:
            self.residence_part_city = self.city
            
        if self.residence_part_state and not self.state:
            self.state = self.residence_part_state
        elif self.state and not self.residence_part_state:
            self.residence_part_state = self.state
            
        if self.residence_part_zip5 and not self.zip_code:
            self.zip_code = self.residence_part_zip5
        elif self.zip_code and not self.residence_part_zip5:
            self.residence_part_zip5 = self.zip_code
            
        # Sync other fields
        if self.person_dob and not self.date_of_birth:
            self.date_of_birth = self.person_dob
        elif self.date_of_birth and not self.person_dob:
            self.person_dob = self.date_of_birth
            
        if self.voter_political_party and not self.party_affiliation:
            self.party_affiliation = self.voter_political_party
        elif self.party_affiliation and not self.voter_political_party:
            self.voter_political_party = self.party_affiliation
            
        if self.contact_phone_unknown1 and not self.phone:
            self.phone = self.contact_phone_unknown1
        elif self.phone and not self.contact_phone_unknown1:
            self.contact_phone_unknown1 = self.phone
            
        if self.residential_address and not self.address:
            self.address = self.residential_address
        elif self.address and not self.residential_address:
            self.residential_address = self.address
            
        super().save(*args, **kwargs)

    def __str__(self):
        name = self.name or f"{self.person_name_first or ''} {self.person_name_last or ''}".strip()
        if not name:
            name = "Unknown"
        return f"{name} ({self.voter_vuid or self.voter_id or 'No ID'})"


class Election(models.Model):
    """Election metadata with enhanced support for generic election data."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    election_type = models.CharField(max_length=50, choices=[
        ('general', 'General'), 
        ('primary', 'Primary'), 
        ('special', 'Special'), 
        ('referendum', 'Referendum')
    ], blank=True)
    year = models.PositiveIntegerField(blank=True, null=True)
    date = models.DateField(blank=True, null=True)
    
    # Legacy fields for backward compatibility
    election_date = models.DateField(null=True, blank=True)
    state = models.CharField(max_length=2, blank=True)
    jurisdiction = models.CharField(max_length=100, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        """Override save to sync between legacy and new fields."""
        # Sync date fields
        if self.date and not self.election_date:
            self.election_date = self.date
        elif self.election_date and not self.date:
            self.date = self.election_date
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - {self.date or self.election_date or self.year or 'TBD'}"


class ElectionData(models.Model):
    """Generic election data linked to voters with flexible data types."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    voter = models.ForeignKey(VoterRecord, on_delete=models.CASCADE, related_name='election_data')
    election = models.ForeignKey(Election, on_delete=models.CASCADE, related_name='voter_data')
    data_type = models.CharField(max_length=50, choices=[
        ('location', 'Voting Location'), 
        ('ballot_type', 'Ballot Type'), 
        ('ballot_choice', 'Ballot Choice'), 
        ('voted', 'Voted (Boolean)')
    ], default='voted')
    value = models.TextField(default='')
    
    # Legacy fields for backward compatibility
    voted = models.BooleanField(default=False)
    vote_method = models.CharField(max_length=50, blank=True)  # in-person, absentee, early
    vote_date = models.DateField(null=True, blank=True)
    precinct = models.CharField(max_length=50, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['voter', 'election', 'data_type']

    def save(self, *args, **kwargs):
        """Override save to sync between legacy and new fields."""
        # If using new data_type system
        if self.data_type == 'voted' and self.value:
            self.voted = self.value.lower() in ['true', '1', 'yes', 'y']
        elif self.voted and not self.value:
            self.value = str(self.voted)
            
        super().save(*args, **kwargs)

    def __str__(self):
        voter_name = f"{self.voter.person_name_first} {self.voter.person_name_last}".strip()
        if not voter_name:
            voter_name = self.voter.voter_vuid or self.voter.voter_id or "Unknown"
        return f"{voter_name} - {self.election.name} ({self.data_type})"


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
