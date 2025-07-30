from rest_framework import serializers
from .models import VoterRecord, Election, ElectionData, EarlyVoteRecord, VoterEngagement


class EnhancedVoterRecordSerializer(serializers.ModelSerializer):
    """Enhanced serializer for VoterRecord model with all comprehensive fields."""
    
    class Meta:
        model = VoterRecord
        fields = [
            # Core fields
            'id', 'created_at', 'last_updated',
            
            # Legacy compatibility fields
            'voter_id', 'name', 'first_name', 'last_name', 'address', 'city', 'state', 'zip_code',
            'email', 'phone', 'date_of_birth', 'party_affiliation', 'social_media', 'employment',
            'data_source', 'latitude', 'longitude',
            
            # Enhanced Voter Identification
            'voter_vuid', 'voter_registration_date', 'voter_registration_status',
            'voter_registration_status_reason', 'voter_precinct_number', 'voter_precinct_name',
            'voter_absentee', 'voter_precinct_code', 'voter_precinct_split',
            'voter_registration_application_source', 'voter_registration_permanent_absentee',
            'voter_registration_type', 'voter_political_party', 'file_origin',
            
            # Enhanced Personal Information
            'person_name_first', 'person_name_middle', 'person_name_last',
            'person_name_prefix', 'person_name_suffix', 'person_dob', 'person_gender',
            
            # Enhanced Residence Address
            'residence_standardized', 'residence_part_house_number', 'residence_part_house_direction',
            'residence_part_street_name', 'residence_part_street_type', 'residence_part_street_suffix',
            'residence_part_unit_number', 'residence_part_unit_type', 'residence_part_city',
            'residence_part_state', 'residence_part_zip5', 'residence_part_zip4',
            'residence_address1', 'residence_address2', 'residence_country',
            'residence_postal_code', 'residence_address_id', 'residence_effective_date',
            
            # Enhanced Mailing Address
            'mail_address1', 'mail_address2', 'mail_city', 'mail_state', 'mail_zip5', 'mail_zip4',
            'mail_country', 'mail_postal_code', 'mail_change_date', 'mail_standardized',
            
            # Enhanced Contact Information
            'contact_phone_unknown1',
            
            # Enhanced District Information
            'district_level', 'office_type', 'voter_county',
            
            # Comprehensive district fields
            'district_city_limits', 'district_county_number', 'district_county_ward',
            'district_state_legislative_lower', 'district_state_legislative_upper',
            'district_federal_congressional', 'district_county_commissioner_precinct',
            'district_city_municipality', 'district_county_constable_precinct',
            'district_county_school_district', 'district_county_sub_school_district',
            'district_county_water_district_01', 'district_county_mass_transit_authority',
            'district_county_water_district_02', 'district_state_board_of_education',
            'district_county_community_college', 'district_city_council_district',
            'district_court_municipal', 'district_court_county', 'district_court_appeallate',
            'district_city_name', 'district_city_school_district', 'district_county_id',
            'district_county_township', 'district_county_village', 'district_county_local_school_district',
            'district_county_library_district', 'district_county_career_center',
            'district_county_education_service_center', 'district_county_exempted_village_school_district',
            'district_state_juristidction', 'district_state_district_combo', 'district_state_upper',
            'district_state_lower', 'district_state_court_of_appeals', 'district_state_multijurisdictional_judge',
            'district_county_name', 'district_county_supervisory', 'district_county_school',
            'district_county_sanitary', 'district_county_technical_college',
            'district_county_representational_school', 'district_state', 'district_county_district_attorney',
            'district_state_circuit_court', 'district_county_first_class_school', 'district_city_incorporation',
            
            # Derived fields
            'residential_address', 'mailing_address', 'is_verified'
        ]
        read_only_fields = ['id', 'last_updated', 'created_at']

    def validate(self, data):
        """Validate district and office type combination."""
        district_level = data.get('district_level')
        office_type = data.get('office_type')
        
        if district_level and office_type:
            from .utils import validate_office_type
            if not validate_office_type(district_level, office_type):
                raise serializers.ValidationError(
                    f"Office type '{office_type}' is not valid for district level '{district_level}'"
                )
        
        return data


class VoterRecordSerializer(serializers.ModelSerializer):
    """Legacy serializer for VoterRecord model (backward compatibility)."""
    
    class Meta:
        model = VoterRecord
        fields = ['id', 'voter_id', 'name', 'first_name', 'last_name', 'address', 
                 'city', 'state', 'zip_code', 'latitude', 'longitude', 'email', 
                 'phone', 'date_of_birth', 'party_affiliation', 'social_media', 
                 'employment', 'data_source', 'last_updated', 'created_at']
        read_only_fields = ['id', 'last_updated', 'created_at']


class ElectionSerializer(serializers.ModelSerializer):
    """Serializer for Election model."""
    
    class Meta:
        model = Election
        fields = ['id', 'name', 'election_date', 'election_type', 'state', 
                 'jurisdiction', 'created_at']
        read_only_fields = ['id', 'created_at']


class ElectionDataSerializer(serializers.ModelSerializer):
    """Enhanced serializer for ElectionData model."""
    
    voter = VoterRecordSerializer(read_only=True)
    election = ElectionSerializer(read_only=True)
    
    class Meta:
        model = ElectionData
        fields = ['id', 'voter', 'election', 'data_type', 'value', 
                 'voted', 'vote_method', 'vote_date', 'precinct', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_data_type(self, value):
        """Validate data_type field."""
        valid_types = ['location', 'ballot_type', 'ballot_choice', 'voted']
        if value not in valid_types:
            raise serializers.ValidationError(f'Data type must be one of: {valid_types}')
        return value


class EarlyVoteRecordSerializer(serializers.ModelSerializer):
    """Serializer for EarlyVoteRecord model."""
    
    voter = VoterRecordSerializer(read_only=True)
    election = ElectionSerializer(read_only=True)
    
    class Meta:
        model = EarlyVoteRecord
        fields = ['id', 'voter', 'election', 'requested_date', 'sent_date', 
                 'received_date', 'ballot_status', 'return_method', 'created_at']
        read_only_fields = ['id', 'created_at']


class VoterEngagementSerializer(serializers.ModelSerializer):
    """Serializer for VoterEngagement model."""
    
    voter = VoterRecordSerializer(read_only=True)
    
    class Meta:
        model = VoterEngagement
        fields = ['id', 'voter', 'engagement_type', 'campaign_id', 'notes', 
                 'response_data', 'engagement_date']
        read_only_fields = ['id', 'engagement_date']


class FileUploadSerializer(serializers.Serializer):
    """Serializer for file upload."""
    
    file = serializers.FileField()
    data_type = serializers.ChoiceField(
        choices=[('voter_data', 'Voter Data'), ('election_data', 'Election Data')],
        default='voter_data'
    )


class ColumnMappingSerializer(serializers.Serializer):
    """Enhanced serializer for column mapping confirmation with election metadata."""
    
    file_id = serializers.CharField()
    mappings = serializers.DictField(child=serializers.CharField())
    data_type = serializers.ChoiceField(
        choices=[('voter_data', 'Voter Data'), ('election_data', 'Election Data')],
        default='voter_data'
    )
    elections = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list,
        help_text="List of election metadata objects for CSV columns"
    )


class ElectionMetadataSerializer(serializers.Serializer):
    """Serializer for election metadata during CSV upload."""
    
    name = serializers.CharField()
    year = serializers.IntegerField(required=False, allow_null=True)
    election_type = serializers.ChoiceField(
        choices=[('general', 'General'), ('primary', 'Primary'), ('special', 'Special'), ('referendum', 'Referendum')],
        required=False,
        allow_null=True
    )
    date = serializers.DateField(required=False, allow_null=True)
    column = serializers.CharField(help_text="CSV column this election data is from")
    data_type = serializers.ChoiceField(
        choices=[('location', 'Voting Location'), ('ballot_type', 'Ballot Type'), ('ballot_choice', 'Ballot Choice'), ('voted', 'Voted (Boolean)')],
        default='voted'
    )


class AddressVerificationSerializer(serializers.Serializer):
    """Serializer for address verification requests."""
    
    voter_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        help_text="List of voter IDs for batch verification"
    )
    auto_verify = serializers.BooleanField(
        default=False,
        help_text="Whether to automatically verify addresses"
    )


class DistrictOfficeTypeSerializer(serializers.Serializer):
    """Serializer for district office type validation."""
    
    district_level = serializers.ChoiceField(
        choices=[('federal', 'Federal'), ('state', 'State'), ('county', 'County'), ('city', 'City'), ('local', 'Local'), ('special_district', 'Special District')]
    )
    office_type = serializers.CharField(required=False)