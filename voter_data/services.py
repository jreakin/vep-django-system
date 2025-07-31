"""
Voter data deduplication and bulk management services.
"""
import pandas as pd
import hashlib
from typing import List, Dict, Tuple, Optional
from django.db import transaction
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import VoterRecord
from dashboards.models import FileUpload, Notification, AuditLog
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


class VoterDeduplicationService:
    """Service for deduplicating voter records and managing bulk uploads."""
    
    def __init__(self):
        self.dedup_fields = [
            'voter_vuid', 'voter_id', 'person_name_first', 'person_name_last',
            'person_dob', 'residence_part_house_number', 'residence_part_street_name',
            'residence_part_city', 'residence_part_state', 'residence_part_zip5'
        ]
    
    def generate_dedup_key(self, voter_data: Dict) -> str:
        """Generate a deduplication key for a voter record."""
        # Create a normalized representation of key fields
        key_parts = []
        
        for field in self.dedup_fields:
            value = voter_data.get(field, '').strip().lower()
            key_parts.append(value)
        
        # Create hash of concatenated normalized values
        key_string = '|'.join(key_parts)
        return hashlib.md5(key_string.encode()).hexdigest()
    
    def process_csv_upload(self, file_upload: FileUpload, user: User) -> Dict:
        """Process a CSV file upload with deduplication."""
        try:
            # Validate file size (e.g., max 10 MB)
            max_file_size = 10 * 1024 * 1024  # 10 MB
            if file_upload.file_path.size > max_file_size:
                raise ValueError("Uploaded file exceeds the maximum allowed size of 10 MB.")
            
            # Read CSV file in chunks
            chunks = pd.read_csv(file_upload.file_path, chunksize=1000)
            file_upload.records_total = sum(1 for _ in pd.read_csv(file_upload.file_path, chunksize=1000))
            file_upload.status = 'processing'
            file_upload.save()
            
            # Process records in batches
            batch_size = 1000
            results = {
                'total': len(df),
                'processed': 0,
                'created': 0,
                'updated': 0,
                'duplicates': 0,
                'errors': 0,
                'error_details': []
            }
            
            for start_idx in range(0, len(df), batch_size):
                end_idx = min(start_idx + batch_size, len(df))
                batch_df = df.iloc[start_idx:end_idx]
                
                batch_results = self._process_batch(batch_df, user, file_upload)
                
                # Update results
                for key in ['processed', 'created', 'updated', 'duplicates', 'errors']:
                    results[key] += batch_results[key]
                results['error_details'].extend(batch_results['error_details'])
                
                # Update progress
                progress = int((end_idx / len(df)) * 100)
                file_upload.progress_percent = progress
                file_upload.records_processed = end_idx
                file_upload.save()
            
            # Update final results
            file_upload.status = 'completed'
            file_upload.records_created = results['created']
            file_upload.records_updated = results['updated']
            file_upload.records_duplicates = results['duplicates']
            file_upload.records_errors = results['errors']
            file_upload.processing_log = results['error_details']
            file_upload.completed_at = timezone.now()
            file_upload.save()
            
            # Create completion notification
            self._create_completion_notification(user, file_upload, results)
            
            return results
            
        except Exception as e:
            logger.error(f"Error processing file upload {file_upload.id}: {str(e)}")
            file_upload.status = 'failed'
            file_upload.error_message = str(e)
            file_upload.save()
            
            # Create error notification
            Notification.objects.create(
                recipient=user,
                title="File Upload Failed",
                message=f"Upload of {file_upload.original_filename} failed: {str(e)}",
                notification_type='error'
            )
            
            raise
    
    def _process_batch(self, batch_df: pd.DataFrame, user: User, file_upload: FileUpload) -> Dict:
        """Process a batch of voter records."""
        results = {
            'processed': 0,
            'created': 0,
            'updated': 0,
            'duplicates': 0,
            'errors': 0,
            'error_details': []
        }
        
        with transaction.atomic():
            for idx, row in batch_df.iterrows():
                try:
                    voter_data = self._map_csv_row(row)
                    dedup_key = self.generate_dedup_key(voter_data)
                    
                    # Check for existing record
                    existing_voter = self._find_existing_voter(dedup_key, voter_data, user)
                    
                    if existing_voter:
                        if self._should_update_record(existing_voter, voter_data):
                            self._update_voter_record(existing_voter, voter_data)
                            results['updated'] += 1
                        else:
                            results['duplicates'] += 1
                    else:
                        self._create_voter_record(voter_data, dedup_key, user)
                        results['created'] += 1
                    
                    results['processed'] += 1
                    
                except Exception as e:
                    logger.error(f"Error processing row {idx}: {str(e)}")
                    results['errors'] += 1
                    results['error_details'].append({
                        'row': idx,
                        'error': str(e),
                        'data': row.to_dict()
                    })
        
        return results
    
    def _map_csv_row(self, row: pd.Series) -> Dict:
        """Map CSV row to voter data dictionary."""
        # Handle common CSV column name variations
        column_mapping = {
            'voter_id': ['voter_id', 'vuid', 'voter_vuid', 'id'],
            'person_name_first': ['first_name', 'person_name_first', 'fname', 'first'],
            'person_name_last': ['last_name', 'person_name_last', 'lname', 'last'],
            'person_dob': ['dob', 'date_of_birth', 'birth_date', 'person_dob'],
            'residence_part_street_name': ['street', 'street_name', 'address', 'residence_part_street_name'],
            'residence_part_city': ['city', 'residence_part_city', 'residence_city'],
            'residence_part_state': ['state', 'residence_part_state', 'residence_state'],
            'residence_part_zip5': ['zip', 'zipcode', 'zip_code', 'residence_part_zip5'],
            'contact_phone_unknown1': ['phone', 'phone_number', 'contact_phone'],
            'email': ['email', 'email_address'],
            'voter_political_party': ['party', 'political_party', 'party_affiliation'],
        }
        
        voter_data = {}
        row_dict = row.to_dict()
        
        # Normalize column names (lowercase, strip spaces)
        normalized_columns = {k.lower().strip(): v for k, v in row_dict.items()}
        
        for field, possible_columns in column_mapping.items():
            for col in possible_columns:
                if col.lower() in normalized_columns:
                    value = normalized_columns[col.lower()]
                    if pd.notna(value):  # Skip NaN values
                        voter_data[field] = str(value).strip()
                    break
        
        return voter_data
    
    def _find_existing_voter(self, dedup_key: str, voter_data: Dict, user: User) -> Optional[VoterRecord]:
        """Find existing voter record using deduplication logic."""
        # First try exact dedup key match
        existing = VoterRecord.objects.filter(
            dedup_key=dedup_key,
            account_owner=user
        ).first()
        
        if existing:
            return existing
        
        # Fall back to voter ID match
        voter_id = voter_data.get('voter_id') or voter_data.get('voter_vuid')
        if voter_id:
            existing = VoterRecord.objects.filter(
                voter_vuid=voter_id,
                account_owner=user
            ).first()
            if existing:
                return existing
        
        return None
    
    def _should_update_record(self, existing: VoterRecord, new_data: Dict) -> bool:
        """Determine if existing record should be updated with new data."""
        # Update if new data has more complete information
        for field, value in new_data.items():
            if value and not getattr(existing, field, None):
                return True
        
        # Update if new data is more recent (for now, always update)
        return True
    
    def _create_voter_record(self, voter_data: Dict, dedup_key: str, user: User) -> VoterRecord:
        """Create a new voter record."""
        voter_data['dedup_key'] = dedup_key
        voter_data['account_owner'] = user
        
        voter = VoterRecord.objects.create(**voter_data)
        
        # Log creation
        AuditLog.objects.create(
            user=user,
            action='create',
            content_object=voter,
            changes={'created': voter_data}
        )
        
        return voter
    
    def _update_voter_record(self, voter: VoterRecord, new_data: Dict) -> VoterRecord:
        """Update an existing voter record."""
        changes = {}
        
        for field, value in new_data.items():
            if hasattr(voter, field):
                old_value = getattr(voter, field)
                if old_value != value:
                    changes[field] = {'old': old_value, 'new': value}
                    setattr(voter, field, value)
        
        if changes:
            voter.save()
            
            # Log update
            AuditLog.objects.create(
                user=voter.account_owner,
                action='update',
                content_object=voter,
                changes=changes
            )
        
        return voter
    
    def _create_completion_notification(self, user: User, file_upload: FileUpload, results: Dict):
        """Create notification when upload processing is complete."""
        message = (
            f"Upload of {file_upload.original_filename} completed:\n"
            f"• {results['created']} new records created\n"
            f"• {results['updated']} records updated\n"
            f"• {results['duplicates']} duplicates skipped\n"
            f"• {results['errors']} errors"
        )
        
        notification_type = 'success' if results['errors'] == 0 else 'warning'
        
        Notification.objects.create(
            recipient=user,
            title="File Upload Complete",
            message=message,
            notification_type=notification_type,
            content_object=file_upload
        )
    
    def deduplicate_existing_records(self, user: User, campaign_id: Optional[str] = None) -> Dict:
        """Deduplicate existing voter records for a user."""
        queryset = VoterRecord.objects.filter(account_owner=user)
        
        if campaign_id:
            # If filtering by campaign, add that logic here
            pass
        
        # Group by dedup key and find duplicates
        duplicate_groups = {}
        processed = 0
        merged = 0
        
        for voter in queryset.iterator():
            if not voter.dedup_key:
                voter.dedup_key = self.generate_dedup_key(voter.__dict__)
                voter.save()
            
            key = voter.dedup_key
            if key not in duplicate_groups:
                duplicate_groups[key] = []
            duplicate_groups[key].append(voter)
            processed += 1
        
        # Merge duplicate groups
        with transaction.atomic():
            for group in duplicate_groups.values():
                if len(group) > 1:
                    canonical = self._select_canonical_record(group)
                    for duplicate in group:
                        if duplicate.id != canonical.id:
                            self._merge_voter_records(canonical, duplicate)
                            merged += 1
        
        return {
            'processed': processed,
            'merged': merged,
            'groups': len([g for g in duplicate_groups.values() if len(g) > 1])
        }
    
    def _select_canonical_record(self, duplicates: List[VoterRecord]) -> VoterRecord:
        """Select the canonical record from a group of duplicates."""
        # Prefer record with most complete data
        best = duplicates[0]
        best_score = self._completeness_score(best)
        
        for duplicate in duplicates[1:]:
            score = self._completeness_score(duplicate)
            if score > best_score:
                best = duplicate
                best_score = score
        
        return best
    
    def _completeness_score(self, voter: VoterRecord) -> int:
        """Calculate completeness score for a voter record."""
        score = 0
        important_fields = [
            'voter_vuid', 'person_name_first', 'person_name_last',
            'person_dob', 'contact_phone_unknown1', 'email',
            'residence_part_street_name', 'residence_part_city',
            'residence_part_state', 'residence_part_zip5'
        ]
        
        for field in important_fields:
            if getattr(voter, field, None):
                score += 1
        
        return score
    
    def _merge_voter_records(self, canonical: VoterRecord, duplicate: VoterRecord):
        """Merge a duplicate record into the canonical record."""
        changes = {}
        
        # Update canonical with any missing data from duplicate
        for field in self.dedup_fields:
            canonical_value = getattr(canonical, field, None)
            duplicate_value = getattr(duplicate, field, None)
            
            if duplicate_value and not canonical_value:
                changes[field] = {'old': canonical_value, 'new': duplicate_value}
                setattr(canonical, field, duplicate_value)
        
        if changes:
            canonical.save()
        
        # Mark duplicate and link to canonical
        duplicate.is_duplicate = True
        duplicate.canonical_record = canonical
        duplicate.save()
        
        # Log merge
        AuditLog.objects.create(
            user=canonical.account_owner,
            action='update',
            content_object=canonical,
            changes={'merged_from': str(duplicate.id), 'changes': changes}
        )