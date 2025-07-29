"""
Pydantic models for data validation, especially for CSV upload processing.
"""

from pydantic import BaseModel, validator, EmailStr
from typing import Optional, Dict, Any, List
from datetime import date, datetime


class VoterData(BaseModel):
    """Pydantic model for validating voter data from CSV uploads."""
    
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


class CSVMappingRequest(BaseModel):
    """Request model for CSV column mapping."""
    
    file_id: str
    mappings: Dict[str, str]  # CSV column -> model field mapping
    preview_data: List[Dict[str, Any]]  # First 30 rows for preview
    total_rows: int

    @validator('mappings')
    def validate_mappings(cls, v):
        required_fields = ['voter_id', 'name', 'address']
        for field in required_fields:
            if field not in v.values():
                raise ValueError(f'Required field {field} must be mapped')
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