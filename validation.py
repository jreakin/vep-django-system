"""
Pydantic models for data validation, especially for CSV upload processing.
"""

from pydantic import BaseModel, validator, EmailStr
from typing import Optional, Dict, Any, List
from datetime import date, datetime


class ComprehensiveVoterData(BaseModel):
    """Enhanced Pydantic model for validating comprehensive voter data from CSV uploads."""
    
    # Voter Identification (mapped from CSV aliases)
    voter_vuid: Optional[str] = None  # Maps to ["SOS_VOTERID", "VUIDNO", "VUID", "VOTER REG NUMBER", "VTRID"]
    voter_registration_date: Optional[date] = None  # Maps to ["REGISTRATION_DATE", "EDR", "EDRDAT", "REGISTRATIONDATE", "VOTE_ELIGIBLE_DATE"]
    voter_registration_status: Optional[str] = None  # Maps to ["STATUS", "VOTER STATUS", "VOTER_STATUS"]
    voter_registration_status_reason: Optional[str] = None  # Maps to ["VOTER STATUS REASON", "VOTER_STATUS_REASON"]
    voter_precinct_number: Optional[str] = None  # Maps to ["PRECINCT_CODE", "PCT", "PREC_CODE"]
    voter_precinct_name: Optional[str] = None  # Maps to ["PCTNAME", "PRECINCT", "PRECINCT_NAME"]
    voter_absentee: Optional[bool] = None  # Maps to ["ABSENTEE"]
    voter_precinct_code: Optional[str] = None  # Maps to ["PCTCOD"]
    voter_precinct_split: Optional[str] = None  # Maps to ["PCTSPT"]
    voter_registration_application_source: Optional[str] = None  # Maps to ["APPLICATION SOURCE"]
    voter_registration_permanent_absentee: Optional[bool] = None  # Maps to ["IS PERMANENT ABSENTEE"]
    voter_registration_type: Optional[str] = None  # Maps to ["VOTER TYPE"]
    voter_political_party: Optional[str] = None  # Maps to ["PARTY_AFFILIATION"]
    file_origin: Optional[str] = None  # Maps to ["FILE_ORIGIN"]
    
    # Personal Information
    person_name_first: Optional[str] = None  # Maps to ["FSTNAM", "FIRST_NAME", "FNAME", "FIRSTNAME"]
    person_name_middle: Optional[str] = None  # Maps to ["MIDDLENAME", "MNAME", "MIDDLE_NAME", "MIDNAM"]
    person_name_last: Optional[str] = None  # Maps to ["LAST_NAME", "LASTNAME", "LNAME", "LSTNAM"]
    person_name_prefix: Optional[str] = None  # Maps to ["NAMPFX"]
    person_name_suffix: Optional[str] = None  # Maps to ["SFX", "SUFFIX"]
    person_dob: Optional[date] = None  # Maps to ["DOB", "DATE_OF_BIRTH"]
    person_gender: Optional[str] = None  # Maps to ["GENDER", "SEX"]
    
    # Residence Address components
    residence_standardized: Optional[str] = None  # Maps to ["RESIDENCEADDRESS"]
    residence_part_house_number: Optional[str] = None  # Maps to ["RA_HS_NUM", "HOUSENUMBER", "RHNUM"]
    residence_part_house_direction: Optional[str] = None  # Maps to ["RA_STDIR_CODE", "STRPRE", "RDESIG"]
    residence_part_street_name: Optional[str] = None  # Maps to ["RA_STREET_NAME", "RSTNAME", "STRNAM", "STREETNAME"]
    residence_part_street_type: Optional[str] = None  # Maps to ["STRTYP", "RA_STTYPE", "RSTTYPE"]
    residence_part_street_suffix: Optional[str] = None  # Maps to ["RA_STDIR_CODE_POST", "RSTSFX"]
    residence_part_unit_number: Optional[str] = None  # Maps to ["RA_UNIT_NUM", "UNITNO", "RUNUM", "UNITNUMBER"]
    residence_part_unit_type: Optional[str] = None  # Maps to ["UNITYP", "RA_UTYP_CODE", "RUTYPE", "UNITTYPE"]
    residence_part_city: Optional[str] = None  # Maps to ["RCITY", "RSCITY", "RA_CITY", "RESIDENTIAL_CITY", "ADDRESSCITY"]
    residence_part_state: Optional[str] = None  # Maps to ["RA_STATE", "RSTATE", "RESIDENTIAL_STATE", "ADDRESSSTATE"]
    residence_part_zip5: Optional[str] = None  # Maps to ["RA_ZIP_CODE", "RZIP", "RZIPCD", "RESIDENTIAL_ZIP", "ADDRESSZIP"]
    residence_part_zip4: Optional[str] = None  # Maps to ["RZIP+4", "RESIDENTIAL_ZIP_PLUS4"]
    residence_address1: Optional[str] = None  # Maps to ["RESIDENTIAL_ADDRESS1", "ADDRESS1"]
    residence_address2: Optional[str] = None  # Maps to ["ADDRESS2", "RESIDENTIAL_SECONDARY_ADDR"]
    residence_country: Optional[str] = None  # Maps to ["RESIDENTIAL_COUNTRY"]
    residence_postal_code: Optional[str] = None  # Maps to ["RESIDENTIAL_POSTALCODE"]
    residence_address_id: Optional[str] = None  # Maps to ["ADDRID"]
    residence_effective_date: Optional[date] = None  # Maps to ["REFDAT"]
    
    # Mailing Address components
    mail_address1: Optional[str] = None  # Maps to ["MAILINGADDRESS1", "MLADD1", "MADR1", "MA_ADDR_LINE_1", "MAILING_ADDRESS1"]
    mail_address2: Optional[str] = None  # Maps to ["MAILINGADDRESS2", "MAILING_SECONDARY_ADDRESS", "MADR2", "MLADD2"]
    mail_city: Optional[str] = None  # Maps to ["MLCITY", "MAILINGCITYSTATEZIP", "MAILING_CITY", "MCITY", "MA_CITY"]
    mail_state: Optional[str] = None  # Maps to ["MST", "MA_STATE", "MLSTAT", "MAILING_STATE"]
    mail_zip5: Optional[str] = None  # Maps to ["MAILING_ZIP", "MZIP", "MLZIPCD", "MA_ZIP_CODE"]
    mail_zip4: Optional[str] = None  # Maps to ["MA_ZIP_PLUS", "MZIP+4", "MAILING_ZIP_PLUS4"]
    mail_country: Optional[str] = None  # Maps to ["MAILING_COUNTRY", "MLCTRY"]
    mail_postal_code: Optional[str] = None  # Maps to ["MAILING_POSTAL_CODE"]
    mail_change_date: Optional[date] = None  # Maps to ["MCHGDT"]
    mail_standardized: Optional[str] = None  # Maps to ["MAILINGADDRESS"]
    
    # Contact Information
    contact_phone_unknown1: Optional[str] = None  # Maps to ["PHONENUMBER", "PHONE_NO"]
    
    # District Information
    district_level: Optional[str] = None
    office_type: Optional[str] = None
    voter_county: Optional[str] = None  # Maps to ["COUNTY"]
    
    # Legacy compatibility fields
    voter_id: Optional[str] = None
    name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    party_affiliation: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    social_media: Optional[Dict[str, Any]] = None
    employment: Optional[Dict[str, Any]] = None
    data_source: str = "csv_upload"

    @validator('voter_vuid')
    def validate_voter_vuid(cls, v):
        if v and not str(v).strip():
            return None
        return str(v).strip() if v else v

    @validator('person_name_first', 'person_name_last')
    def validate_names(cls, v):
        return v.strip() if v else v

    @validator('residence_part_state', 'mail_state', 'state')
    def validate_state(cls, v):
        if v and len(v.strip()) == 2:
            return v.upper().strip()
        elif v and len(v.strip()) > 2:
            # Allow longer state names for flexibility
            return v.strip()
        return v

    @validator('residence_part_zip5', 'mail_zip5', 'zip_code')
    def validate_zip_code(cls, v):
        if v:
            # Basic US zip code validation
            v = str(v).strip().replace('-', '')
            if v.isdigit() and len(v) in [5, 9]:
                return v[:5]  # Return just the 5-digit portion
        return v

    @validator('contact_phone_unknown1', 'phone')
    def validate_phone(cls, v):
        if v:
            # Basic phone number cleanup
            import re
            cleaned = re.sub(r'[^\d]', '', str(v))
            if len(cleaned) >= 10:
                return cleaned
        return v

    @validator('latitude')
    def validate_latitude(cls, v):
        if v is not None and not (-90 <= float(v) <= 90):
            raise ValueError('Latitude must be between -90 and 90')
        return v

    @validator('longitude')
    def validate_longitude(cls, v):
        if v is not None and not (-180 <= float(v) <= 180):
            raise ValueError('Longitude must be between -180 and 180')
        return v

    @validator('district_level')
    def validate_district_level(cls, v):
        if v:
            valid_levels = ['federal', 'state', 'county', 'city', 'local', 'special_district']
            if v.lower() not in valid_levels:
                raise ValueError(f'District level must be one of: {valid_levels}')
            return v.lower()
        return v

    def dict(self, **kwargs):
        """Override dict to handle field synchronization."""
        data = super().dict(**kwargs)
        
        # Sync fields for backward compatibility
        if data.get('voter_vuid') and not data.get('voter_id'):
            data['voter_id'] = data['voter_vuid']
        elif data.get('voter_id') and not data.get('voter_vuid'):
            data['voter_vuid'] = data['voter_id']
            
        # Sync name fields
        if data.get('person_name_first') or data.get('person_name_last'):
            data['first_name'] = data.get('person_name_first') or data.get('first_name', '')
            data['last_name'] = data.get('person_name_last') or data.get('last_name', '')
            data['name'] = f"{data.get('person_name_first', '')} {data.get('person_name_last', '')}".strip()
        
        # Sync address fields
        if data.get('residence_part_city') and not data.get('city'):
            data['city'] = data['residence_part_city']
        if data.get('residence_part_state') and not data.get('state'):
            data['state'] = data['residence_part_state']
        if data.get('residence_part_zip5') and not data.get('zip_code'):
            data['zip_code'] = data['residence_part_zip5']
            
        # Sync other fields
        if data.get('person_dob') and not data.get('date_of_birth'):
            data['date_of_birth'] = data['person_dob']
        if data.get('voter_political_party') and not data.get('party_affiliation'):
            data['party_affiliation'] = data['voter_political_party']
        if data.get('contact_phone_unknown1') and not data.get('phone'):
            data['phone'] = data['contact_phone_unknown1']
            
        return data


# Keep the legacy VoterData for backward compatibility
class VoterData(BaseModel):
    """Legacy Pydantic model for validating voter data from CSV uploads."""
    
    voter_id: str
    name: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    address: str
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    party_affiliation: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    social_media: Optional[Dict[str, Any]] = None
    employment: Optional[Dict[str, Any]] = None
    data_source: str = "csv_upload"

    @validator('voter_id')
    def validate_voter_id(cls, v):
        if not v or not str(v).strip():
            raise ValueError('Voter ID cannot be empty')
        return str(v).strip()

    @validator('name')
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()

    @validator('address')
    def validate_address(cls, v):
        if not v or not v.strip():
            raise ValueError('Address cannot be empty')
        return v.strip()

    @validator('state')
    def validate_state(cls, v):
        if v and len(v) != 2:
            raise ValueError('State must be 2-character abbreviation')
        return v.upper() if v else v

    @validator('zip_code')
    def validate_zip_code(cls, v):
        if v:
            # Basic US zip code validation
            v = v.strip().replace('-', '')
            if not v.isdigit() or len(v) not in [5, 9]:
                raise ValueError('Invalid zip code format')
        return v

    @validator('phone')
    def validate_phone(cls, v):
        if v:
            # Basic phone number cleanup
            import re
            cleaned = re.sub(r'[^\d]', '', v)
            if len(cleaned) not in [10, 11]:
                raise ValueError('Phone number must be 10 or 11 digits')
            return cleaned
        return v

    @validator('latitude')
    def validate_latitude(cls, v):
        if v is not None and not (-90 <= v <= 90):
            raise ValueError('Latitude must be between -90 and 90')
        return v

    @validator('longitude')
    def validate_longitude(cls, v):
        if v is not None and not (-180 <= v <= 180):
            raise ValueError('Longitude must be between -180 and 180')
        return v


class ElectionUploadData(BaseModel):
    """Pydantic model for election data uploads."""
    
    voter_id: str
    election_name: str
    election_date: date
    data_type: str = 'voted'
    value: str = 'true'
    
    # Legacy fields for backward compatibility
    voted: bool = False
    vote_method: Optional[str] = None
    vote_date: Optional[date] = None
    precinct: Optional[str] = None

    @validator('voter_id')
    def validate_voter_id(cls, v):
        if not v or not str(v).strip():
            raise ValueError('Voter ID cannot be empty')
        return str(v).strip()

    @validator('election_name')
    def validate_election_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Election name cannot be empty')
        return v.strip()

    @validator('vote_date')
    def validate_vote_date(cls, v, values):
        if v and 'election_date' in values and v > values['election_date']:
            raise ValueError('Vote date cannot be after election date')
        return v

    @validator('data_type')
    def validate_data_type(cls, v):
        valid_types = ['location', 'ballot_type', 'ballot_choice', 'voted']
        if v not in valid_types:
            raise ValueError(f'Data type must be one of: {valid_types}')
        return v


class ElectionMetadata(BaseModel):
    """Model for election metadata during CSV upload."""
    
    name: str
    year: Optional[int] = None
    election_type: Optional[str] = None
    date: Optional[date] = None
    column: str  # CSV column this election data is from
    data_type: str = 'voted'  # What type of data this column contains

    @validator('election_type')
    def validate_election_type(cls, v):
        if v:
            valid_types = ['general', 'primary', 'special', 'referendum']
            if v.lower() not in valid_types:
                raise ValueError(f'Election type must be one of: {valid_types}')
            return v.lower()
        return v


class CSVMappingRequest(BaseModel):
    """Request model for CSV column mapping."""
    
    file_id: str
    mappings: Dict[str, str]  # CSV column -> model field mapping
    preview_data: List[Dict[str, Any]]  # First 30 rows for preview
    total_rows: int
    elections: Optional[List[ElectionMetadata]] = []  # Election metadata for columns

    @validator('mappings')
    def validate_mappings(cls, v):
        # More flexible validation - require at least one identifier field
        identifier_fields = ['voter_vuid', 'voter_id']
        has_identifier = any(field in v.values() for field in identifier_fields)
        if not has_identifier:
            raise ValueError('At least one voter identifier field (voter_vuid or voter_id) must be mapped')
        return v


class ValidationResult(BaseModel):
    """Result of data validation process."""
    
    total_rows: int
    valid_rows: int
    invalid_rows: int
    errors: List[Dict[str, Any]]  # Row index and error details
    warnings: List[Dict[str, Any]]  # Non-fatal issues


class APIResponse(BaseModel):
    """Standard API response format."""
    
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
    errors: Optional[List[str]] = None


class FileUploadResponse(BaseModel):
    """Response for file upload operations."""
    
    file_id: str
    filename: str
    size: int
    columns: List[str]
    preview_data: List[Dict[str, Any]]
    total_rows: int
    suggested_mappings: Dict[str, str]


class PermissionRequest(BaseModel):
    """Request for data access permissions."""
    
    requester_id: str
    account_id: str
    resource_type: str  # voter_data, integration, dashboard
    resource_id: Optional[str] = None
    access_type: str  # read, write, admin
    justification: str

    @validator('access_type')
    def validate_access_type(cls, v):
        valid_types = ['read', 'write', 'admin']
        if v not in valid_types:
            raise ValueError(f'Access type must be one of: {valid_types}')
        return v