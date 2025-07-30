from django.conf import settings
from django.utils import timezone
from twilio.rest import Client
from users.models import User, AuthPIN
import logging

logger = logging.getLogger(__name__)


class SMSService:
    """Service for sending SMS messages via Twilio."""
    
    def __init__(self):
        self.client = None
        if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
            self.client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    
    def send_pin(self, phone_number, pin):
        """Send PIN via SMS."""
        if not self.client:
            logger.warning("Twilio not configured, PIN would be sent to %s: %s", phone_number, pin)
            return True
        
        try:
            message = self.client.messages.create(
                body=f"Your Campaign Manager verification code is: {pin}. Valid for 10 minutes.",
                from_=settings.TWILIO_PHONE_NUMBER,
                to=phone_number
            )
            logger.info("SMS sent successfully to %s, SID: %s", phone_number, message.sid)
            return True
        except Exception as e:
            logger.error("Failed to send SMS to %s: %s", phone_number, str(e))
            return False


class AuthenticationService:
    """Service for phone-based authentication with PIN."""
    
    def __init__(self):
        self.sms_service = SMSService()
    
    def create_pin_for_user(self, user):
        """Create a new PIN for user authentication."""
        # Invalidate any existing unused PINs
        AuthPIN.objects.filter(user=user, is_used=False).update(is_used=True)
        
        # Create new PIN
        auth_pin = AuthPIN.objects.create(user=user)
        
        # Send PIN via SMS
        success = self.sms_service.send_pin(user.phone_number, auth_pin.pin)
        
        if not success:
            auth_pin.delete()
            return None
        
        return auth_pin
    
    def verify_pin(self, user, pin):
        """Verify PIN for user authentication."""
        try:
            auth_pin = AuthPIN.objects.filter(
                user=user,
                pin=pin,
                is_used=False
            ).first()
            
            if not auth_pin:
                return False
            
            # Increment attempts
            auth_pin.attempts += 1
            auth_pin.save()
            
            if not auth_pin.is_valid():
                return False
            
            # Mark PIN as used
            auth_pin.is_used = True
            auth_pin.save()
            
            # Mark user as verified if first time
            if not user.is_verified:
                user.is_verified = True
                user.save()
            
            return True
            
        except Exception as e:
            logger.error("PIN verification failed for user %s: %s", user.phone_number, str(e))
            return False
    
    def can_request_pin(self, phone_number):
        """Check if user can request a new PIN (rate limiting)."""
        # Check rate limiting - max 5 PINs per hour
        one_hour_ago = timezone.now() - timezone.timedelta(hours=1)
        
        try:
            user = User.objects.get(phone_number=phone_number)
            recent_pins = AuthPIN.objects.filter(
                user=user,
                created_at__gte=one_hour_ago
            ).count()
            
            return recent_pins < settings.SMS_RATE_LIMIT_PER_HOUR
        except User.DoesNotExist:
            # For new users, always allow PIN request
            return True
    
    def register_user(self, phone_number, role):
        """Register a new user with phone number."""
        try:
            # Check if user already exists
            if User.objects.filter(phone_number=phone_number).exists():
                raise ValueError("User with this phone number already exists")
            
            # Create user
            user = User.objects.create(
                phone_number=phone_number,
                role=role,
                is_active=True
            )
            
            return user
            
        except Exception as e:
            logger.error("User registration failed for %s: %s", phone_number, str(e))
            raise