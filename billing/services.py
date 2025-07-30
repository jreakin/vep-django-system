from django.conf import settings
from django.utils import timezone
import stripe
from decimal import Decimal
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta
from users.models import User, Invoice, Payment
import logging

logger = logging.getLogger(__name__)

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


class BillingService:
    """Service for handling billing operations."""
    
    PLATFORM_FEES = {
        'owner': Decimal('0.00'),     # Owners don't pay platform fees
        'state': Decimal('99.00'),    # Monthly fee for state parties
        'county': Decimal('49.00'),   # Monthly fee for county parties
        'campaign': Decimal('29.00'), # Monthly fee for campaigns
        'vendor': Decimal('79.00'),   # Monthly fee for vendors
    }
    
    def calculate_billing_amount(self, user, billing_cycle='monthly', service_fees=Decimal('0.00')):
        """Calculate total billing amount for a user."""
        platform_fee = self.PLATFORM_FEES.get(user.role, Decimal('0.00'))
        
        if billing_cycle == 'annual':
            # 10% discount for annual billing
            platform_fee = platform_fee * 12 * Decimal('0.9')
        
        return platform_fee + service_fees
    
    def create_invoice(self, user, billing_cycle='monthly', service_fees=Decimal('0.00')):
        """Create an invoice for a user."""
        try:
            # Calculate billing period
            today = date.today()
            if billing_cycle == 'monthly':
                period_start = today.replace(day=1)
                period_end = (period_start + relativedelta(months=1)) - timedelta(days=1)
                due_date = period_end + timedelta(days=15)  # 15 days after period end
            else:  # annual
                period_start = today.replace(month=1, day=1)
                period_end = date(today.year, 12, 31)
                due_date = period_end + timedelta(days=30)  # 30 days after period end
            
            # Calculate amounts
            platform_fee = self.PLATFORM_FEES.get(user.role, Decimal('0.00'))
            if billing_cycle == 'annual':
                platform_fee = platform_fee * 12 * Decimal('0.9')  # 10% discount
            
            total_amount = platform_fee + service_fees
            
            # Create invoice
            invoice = Invoice.objects.create(
                user=user,
                period_start=period_start,
                period_end=period_end,
                billing_cycle=billing_cycle,
                amount_due=total_amount,
                platform_fee=platform_fee,
                service_fees=service_fees,
                due_date=due_date
            )
            
            logger.info("Invoice created: %s for user %s", invoice.id, user.phone_number)
            return invoice
            
        except Exception as e:
            logger.error("Invoice creation failed for user %s: %s", user.phone_number, str(e))
            raise
    
    def create_payment_intent(self, invoice):
        """Create Stripe PaymentIntent for an invoice."""
        try:
            # Convert amount to cents for Stripe
            amount_cents = int(invoice.amount_due * 100)
            
            payment_intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency='usd',
                metadata={
                    'invoice_id': str(invoice.id),
                    'user_id': str(invoice.user.id),
                    'billing_cycle': invoice.billing_cycle,
                }
            )
            
            # Create payment record
            payment = Payment.objects.create(
                invoice=invoice,
                stripe_payment_intent_id=payment_intent.id,
                amount=invoice.amount_due,
                status='pending'
            )
            
            logger.info("Payment intent created: %s for invoice %s", payment_intent.id, invoice.id)
            return payment_intent, payment
            
        except Exception as e:
            logger.error("Payment intent creation failed for invoice %s: %s", invoice.id, str(e))
            raise
    
    def handle_payment_webhook(self, event):
        """Handle Stripe webhook events for payment status updates."""
        try:
            if event['type'] == 'payment_intent.succeeded':
                payment_intent = event['data']['object']
                payment_intent_id = payment_intent['id']
                
                # Update payment status
                payment = Payment.objects.get(stripe_payment_intent_id=payment_intent_id)
                payment.status = 'succeeded'
                payment.payment_method = payment_intent.get('payment_method_types', ['unknown'])[0]
                payment.paid_at = timezone.now()
                payment.save()
                
                # Update invoice status
                invoice = payment.invoice
                invoice.status = 'paid'
                invoice.save()
                
                logger.info("Payment succeeded: %s for invoice %s", payment_intent_id, invoice.id)
                
            elif event['type'] == 'payment_intent.payment_failed':
                payment_intent = event['data']['object']
                payment_intent_id = payment_intent['id']
                
                # Update payment status
                payment = Payment.objects.get(stripe_payment_intent_id=payment_intent_id)
                payment.status = 'failed'
                payment.failure_reason = payment_intent.get('last_payment_error', {}).get('message', 'Unknown error')
                payment.save()
                
                logger.info("Payment failed: %s for invoice %s", payment_intent_id, payment.invoice.id)
                
        except Payment.DoesNotExist:
            logger.error("Payment not found for payment_intent: %s", payment_intent_id)
        except Exception as e:
            logger.error("Webhook handling failed: %s", str(e))
            raise
    
    def get_user_invoices(self, user):
        """Get all invoices for a user."""
        return Invoice.objects.filter(user=user).order_by('-created_at')
    
    def get_all_invoices_for_owner(self):
        """Get all invoices in the system (for Owner role only)."""
        return Invoice.objects.all().order_by('-created_at')
    
    def get_overdue_invoices(self):
        """Get all overdue invoices."""
        today = date.today()
        overdue_invoices = Invoice.objects.filter(
            due_date__lt=today,
            status='pending'
        )
        
        # Update status to overdue
        overdue_invoices.update(status='overdue')
        
        return overdue_invoices
    
    def generate_monthly_invoices(self):
        """Generate monthly invoices for all active users."""
        active_users = User.objects.filter(is_active=True, is_verified=True)
        invoices_created = 0
        
        for user in active_users:
            try:
                # Check if user already has an invoice for current month
                today = date.today()
                current_month_start = today.replace(day=1)
                
                existing_invoice = Invoice.objects.filter(
                    user=user,
                    period_start=current_month_start,
                    billing_cycle='monthly'
                ).exists()
                
                if not existing_invoice:
                    self.create_invoice(user, billing_cycle='monthly')
                    invoices_created += 1
                    
            except Exception as e:
                logger.error("Failed to create monthly invoice for user %s: %s", user.phone_number, str(e))
        
        logger.info("Generated %d monthly invoices", invoices_created)
        return invoices_created