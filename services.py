"""
File upload and CSV processing services.
"""

import pandas as pd
import uuid
import os
import tempfile
from typing import Dict, List, Any, Optional, Tuple
from django.conf import settings
from django.core.files.uploadedfile import UploadedFile
from validation import VoterData, ValidationResult, FileUploadResponse
import re


class FileUploadService:
    """Service for handling file uploads and CSV processing."""
    
    SUPPORTED_EXTENSIONS = ['.csv', '.xlsx', '.xls']
    MAX_PREVIEW_ROWS = 30
    
    def __init__(self):
        self.upload_path = getattr(settings, 'UPLOAD_PATH', 'uploads/')
        self.max_size = getattr(settings, 'MAX_UPLOAD_SIZE', 104857600)  # 100MB
    
    def process_upload(self, uploaded_file: UploadedFile) -> FileUploadResponse:
        """Process uploaded file and return preview data with suggested mappings."""
        
        # Validate file
        self._validate_file(uploaded_file)
        
        # Save file temporarily
        file_id = str(uuid.uuid4())
        temp_path = self._save_temp_file(uploaded_file, file_id)
        
        try:
            # Read file
            df = self._read_file(temp_path, uploaded_file.name)
            
            # Get preview data
            preview_data = self._get_preview_data(df)
            
            # Suggest column mappings
            suggested_mappings = self._suggest_mappings(df.columns.tolist())
            
            return FileUploadResponse(
                file_id=file_id,
                filename=uploaded_file.name,
                size=uploaded_file.size,
                columns=df.columns.tolist(),
                preview_data=preview_data,
                total_rows=len(df),
                suggested_mappings=suggested_mappings
            )
            
        except Exception as e:
            # Clean up temp file on error
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise e
    
    def validate_with_mappings(self, file_id: str, mappings: Dict[str, str]) -> ValidationResult:
        """Validate CSV data using provided column mappings."""
        
        temp_path = self._get_temp_file_path(file_id)
        if not os.path.exists(temp_path):
            raise FileNotFoundError(f"File {file_id} not found")
        
        try:
            # Import enhanced validation model
            from validation import ComprehensiveVoterData
            
            # Read file
            df = self._read_file(temp_path, "temp.csv")
            
            # Apply mappings - rename columns
            mapped_df = df.rename(columns={v: k for k, v in mappings.items()})
            
            # Validate each row
            errors = []
            valid_count = 0
            warnings = []
            
            for index, row in mapped_df.iterrows():
                try:
                    # Convert row to dict and handle NaN values
                    row_data = row.to_dict()
                    
                    # Clean NaN values
                    for key, value in row_data.items():
                        if pd.isna(value):
                            row_data[key] = None
                        elif isinstance(value, str):
                            row_data[key] = value.strip() if value.strip() else None
                    
                    # Validate with enhanced model
                    validated_data = ComprehensiveVoterData(**row_data)
                    valid_count += 1
                    
                    # Add warnings for missing recommended fields
                    if not validated_data.voter_vuid and not validated_data.voter_id:
                        warnings.append({
                            'row': index + 1,
                            'message': 'No voter identifier found (voter_vuid or voter_id)'
                        })
                    
                except Exception as e:
                    errors.append({
                        'row': index + 1,
                        'errors': [str(e)]
                    })
            
            return ValidationResult(
                total_rows=len(df),
                valid_rows=valid_count,
                invalid_rows=len(errors),
                errors=errors,
                warnings=warnings
            )
            
        except Exception as e:
            raise e
    
    def process_validated_data(self, file_id: str, mappings: Dict[str, str], account_owner_id: str, elections: List[Dict] = None) -> List[Dict[str, Any]]:
        """Process validated data and return list of voter records ready for database insertion."""
        
        temp_path = self._get_temp_file_path(file_id)
        if not os.path.exists(temp_path):
            raise FileNotFoundError(f"File {file_id} not found")
        
        try:
            # Import enhanced validation and models
            from validation import ComprehensiveVoterData
            from voter_data.utils import construct_address_lines
            
            # Read and map data
            df = self._read_file(temp_path, "temp.csv")
            mapped_df = df.rename(columns={v: k for k, v in mappings.items()})
            
            validated_records = []
            election_data_records = []
            
            for index, row in mapped_df.iterrows():
                try:
                    # Convert row to dict and handle NaN values
                    row_data = row.to_dict()
                    
                    # Clean NaN values
                    for key, value in row_data.items():
                        if pd.isna(value):
                            row_data[key] = None
                        elif isinstance(value, str):
                            row_data[key] = value.strip() if value.strip() else None
                    
                    # Extract election data columns before validation
                    election_columns = {}
                    if elections:
                        for election in elections:
                            column = election.get('column')
                            if column in row_data:
                                election_columns[election['name']] = {
                                    'value': row_data.pop(column, ''),
                                    'data_type': election.get('data_type', 'voted'),
                                    'election_meta': election
                                }
                    
                    # Validate with enhanced model
                    validated = ComprehensiveVoterData(**row_data)
                    
                    # Convert to dict for database insertion
                    record = validated.dict()
                    record['account_owner_id'] = account_owner_id
                    record['id'] = str(uuid.uuid4())
                    
                    # Ensure we have a voter identifier
                    if not record.get('voter_vuid') and not record.get('voter_id'):
                        # Generate a temporary ID if none exists
                        record['voter_vuid'] = f"TEMP_{uuid.uuid4().hex[:8]}"
                        record['voter_id'] = record['voter_vuid']
                    
                    validated_records.append(record)
                    
                    # Store election data for later processing
                    for election_name, election_info in election_columns.items():
                        election_data_records.append({
                            'voter_id': record.get('voter_vuid') or record.get('voter_id'),
                            'election_name': election_name,
                            'data_type': election_info['data_type'],
                            'value': str(election_info['value']),
                            'election_meta': election_info['election_meta']
                        })
                    
                except Exception:
                    # Skip invalid rows - they should have been caught in validation step
                    continue
            
            # Clean up temp file
            os.remove(temp_path)
            
            return {
                'voter_records': validated_records,
                'election_data_records': election_data_records
            }
            
        except Exception as e:
            raise e
    
    def _validate_file(self, uploaded_file: UploadedFile) -> None:
        """Validate uploaded file."""
        
        # Check size
        if uploaded_file.size > self.max_size:
            raise ValueError(f"File size exceeds maximum limit of {self.max_size} bytes")
        
        # Check extension
        file_ext = os.path.splitext(uploaded_file.name)[1].lower()
        if file_ext not in self.SUPPORTED_EXTENSIONS:
            raise ValueError(f"Unsupported file type. Supported types: {', '.join(self.SUPPORTED_EXTENSIONS)}")
    
    def _save_temp_file(self, uploaded_file: UploadedFile, file_id: str) -> str:
        """Save uploaded file to temporary location."""
        
        # Create temp directory if it doesn't exist
        temp_dir = tempfile.gettempdir()
        upload_dir = os.path.join(temp_dir, 'campaign_uploads')
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save file
        file_ext = os.path.splitext(uploaded_file.name)[1]
        temp_path = os.path.join(upload_dir, f"{file_id}{file_ext}")
        
        with open(temp_path, 'wb') as f:
            for chunk in uploaded_file.chunks():
                f.write(chunk)
        
        return temp_path
    
    def _get_temp_file_path(self, file_id: str) -> str:
        """Get path to temporary file."""
        temp_dir = tempfile.gettempdir()
        upload_dir = os.path.join(temp_dir, 'campaign_uploads')
        
        # Find file with any supported extension
        for ext in self.SUPPORTED_EXTENSIONS:
            path = os.path.join(upload_dir, f"{file_id}{ext}")
            if os.path.exists(path):
                return path
        
        raise FileNotFoundError(f"Temporary file {file_id} not found")
    
    def _read_file(self, file_path: str, filename: str) -> pd.DataFrame:
        """Read file into pandas DataFrame."""
        
        file_ext = os.path.splitext(filename)[1].lower()
        
        try:
            if file_ext == '.csv':
                # Try different encodings
                for encoding in ['utf-8', 'latin1', 'iso-8859-1']:
                    try:
                        return pd.read_csv(file_path, encoding=encoding)
                    except UnicodeDecodeError:
                        continue
                raise ValueError("Unable to decode CSV file with supported encodings")
            
            elif file_ext in ['.xlsx', '.xls']:
                return pd.read_excel(file_path)
            
            else:
                raise ValueError(f"Unsupported file format: {file_ext}")
                
        except Exception as e:
            raise ValueError(f"Error reading file: {str(e)}")
    
    def _get_preview_data(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Get preview data from DataFrame."""
        
        # Take first N rows for preview
        preview_df = df.head(self.MAX_PREVIEW_ROWS)
        
        # Convert to list of dicts, handling NaN values
        preview_data = []
        for _, row in preview_df.iterrows():
            row_dict = {}
            for col, value in row.items():
                # Handle NaN and convert to string for display
                if pd.isna(value):
                    row_dict[col] = ""
                else:
                    row_dict[col] = str(value)
            preview_data.append(row_dict)
        
        return preview_data
    
    def _suggest_mappings(self, columns: List[str]) -> Dict[str, str]:
        """Suggest column mappings based on column names using comprehensive field mappings."""
        
        # Import field mappings from utils
        from voter_data.utils import get_field_mappings
        
        mapping_patterns = get_field_mappings()
        
        suggestions = {}
        used_columns = set()
        
        # First pass: exact matches (case insensitive)
        for field, aliases in mapping_patterns.items():
            for column in columns:
                if column.lower() in used_columns:
                    continue
                
                # Check for exact match (case insensitive)
                if column.upper() in [alias.upper() for alias in aliases]:
                    suggestions[field] = column
                    used_columns.add(column.lower())
                    break
        
        # Second pass: partial matches for remaining columns
        import re
        for field, aliases in mapping_patterns.items():
            if field in suggestions:
                continue  # Already found exact match
                
            for column in columns:
                if column.lower() in used_columns:
                    continue
                
                # Create regex patterns from aliases
                for alias in aliases:
                    # Clean alias for regex
                    pattern = re.escape(alias.lower()).replace(r'\ ', r'[_\s]?')
                    pattern = pattern.replace(r'\+', r'\+?')  # Make + optional
                    
                    if re.search(pattern, column.lower()):
                        suggestions[field] = column
                        used_columns.add(column.lower())
                        break
                
                if field in suggestions:
                    break
        
        return suggestions


class GeocodingService:
    """Service for geocoding addresses using Nominatim."""
    
    def __init__(self):
        self.nominatim_url = getattr(settings, 'NOMINATIM_URL', 'http://localhost:8080')
    
    def geocode_address(self, address: str) -> Optional[Tuple[float, float]]:
        """Geocode an address and return latitude, longitude."""
        
        # This is a placeholder implementation
        # In a real implementation, you would call the Nominatim API
        
        # For now, return None to indicate geocoding is not available
        return None
    
    def batch_geocode(self, addresses: List[str]) -> List[Optional[Tuple[float, float]]]:
        """Batch geocode multiple addresses."""
        
        results = []
        for address in addresses:
            result = self.geocode_address(address)
            results.append(result)
        
        return results


class DataEnrichmentService:
    """Service for enriching voter data with external APIs."""
    
    def __init__(self):
        self.fullcontact_api_key = getattr(settings, 'FULLCONTACT_API_KEY', '')
        self.spokeo_api_key = getattr(settings, 'SPOKEO_API_KEY', '')
        self.zoominfo_api_key = getattr(settings, 'ZOOMINFO_API_KEY', '')
    
    def enrich_social_media(self, email: str) -> Dict[str, Any]:
        """Enrich with social media data from FullContact."""
        
        # Placeholder implementation
        # In a real implementation, you would call the FullContact API
        
        return {
            'fullcontact_enriched': False,
            'social_profiles': [],
            'error': 'API not configured'
        }
    
    def enrich_employment(self, name: str, email: str) -> Dict[str, Any]:
        """Enrich with employment data from ZoomInfo."""
        
        # Placeholder implementation
        # In a real implementation, you would call the ZoomInfo API
        
        return {
            'zoominfo_enriched': False,
            'employment_data': {},
            'error': 'API not configured'
        }
    
    def enrich_spokeo_data(self, name: str, address: str) -> Dict[str, Any]:
        """Enrich with additional data from Spokeo."""
        
        # Placeholder implementation
        # In a real implementation, you would call the Spokeo API
        
        return {
            'spokeo_enriched': False,
            'additional_data': {},
            'error': 'API not configured'
        }