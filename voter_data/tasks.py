from celery import shared_task
from geopy.geocoders import Nominatim
from django.core.exceptions import ValidationError
from .models import VoterRecord
from .utils import construct_address_lines
import logging

logger = logging.getLogger(__name__)


@shared_task
def verify_address(voter_id):
    """
    Verify address for a voter record using geopy and Nominatim.
    Updates the voter record with geocoded coordinates and verification status.
    """
    try:
        voter = VoterRecord.objects.get(id=voter_id)
    except VoterRecord.DoesNotExist:
        logger.error(f"Voter with ID {voter_id} not found")
        return False

    # Initialize geocoder
    geolocator = Nominatim(user_agent="campaign_management")
    
    # Get address to verify - prefer mailing address, fallback to residential
    address_to_verify = voter.mailing_address or voter.residential_address
    
    # If neither constructed address exists, try to construct from components
    if not address_to_verify:
        residence_full, mailing_full = construct_address_lines(voter)
        address_to_verify = mailing_full or residence_full
        
        # Update the voter record with constructed addresses
        voter.residential_address = residence_full
        voter.mailing_address = mailing_full
        voter.save()

    if not address_to_verify:
        logger.warning(f"No address available for voter {voter_id}")
        return False

    try:
        # Geocode the address
        location = geolocator.geocode(address_to_verify)
        
        if location:
            # Update coordinates
            voter.latitude = location.latitude
            voter.longitude = location.longitude
            
            # Validate county match if available
            if voter.voter_county and hasattr(location, 'raw'):
                geocoded_county = location.raw.get('display_name', '').lower()
                voter_county = voter.voter_county.lower()
                
                # Simple county validation - check if voter county is in geocoded address
                if voter_county not in geocoded_county:
                    logger.warning(f"County mismatch for voter {voter_id}: {voter_county} vs {geocoded_county}")
                    # Don't raise exception, just log warning
            
            # Mark as verified
            voter.is_verified = True
            voter.save()
            
            logger.info(f"Successfully verified address for voter {voter_id}")
            return True
        else:
            logger.warning(f"Could not geocode address for voter {voter_id}: {address_to_verify}")
            return False
            
    except Exception as e:
        logger.error(f"Error verifying address for voter {voter_id}: {str(e)}")
        return False


@shared_task
def batch_verify_addresses(voter_ids):
    """
    Batch verify addresses for multiple voters.
    Returns count of successful verifications.
    """
    success_count = 0
    total_count = len(voter_ids)
    
    logger.info(f"Starting batch address verification for {total_count} voters")
    
    for voter_id in voter_ids:
        try:
            if verify_address(voter_id):
                success_count += 1
        except Exception as e:
            logger.error(f"Failed to verify address for voter {voter_id}: {str(e)}")
            continue
    
    logger.info(f"Batch verification completed: {success_count}/{total_count} successful")
    return success_count


@shared_task
def update_address_from_components(voter_id):
    """
    Update full address fields from address components for a voter.
    """
    try:
        voter = VoterRecord.objects.get(id=voter_id)
        
        # Construct addresses from components
        residence_full, mailing_full = construct_address_lines(voter)
        
        # Update fields
        voter.residential_address = residence_full
        voter.mailing_address = mailing_full
        voter.save()
        
        logger.info(f"Updated addresses for voter {voter_id}")
        return True
        
    except VoterRecord.DoesNotExist:
        logger.error(f"Voter with ID {voter_id} not found")
        return False
    except Exception as e:
        logger.error(f"Error updating addresses for voter {voter_id}: {str(e)}")
        return False


@shared_task
def batch_update_addresses_from_components(voter_ids):
    """
    Batch update addresses from components for multiple voters.
    """
    success_count = 0
    total_count = len(voter_ids)
    
    logger.info(f"Starting batch address update for {total_count} voters")
    
    for voter_id in voter_ids:
        try:
            if update_address_from_components(voter_id):
                success_count += 1
        except Exception as e:
            logger.error(f"Failed to update addresses for voter {voter_id}: {str(e)}")
            continue
    
    logger.info(f"Batch address update completed: {success_count}/{total_count} successful")
    return success_count