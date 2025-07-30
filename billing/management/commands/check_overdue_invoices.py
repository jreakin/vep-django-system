from django.core.management.base import BaseCommand
from django.utils import timezone
from billing.services import BillingService
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Update overdue invoice status and notify about overdue payments'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Checking for overdue invoices...'))
        
        billing_service = BillingService()
        
        try:
            overdue_invoices = billing_service.get_overdue_invoices()
            count = overdue_invoices.count()
            
            if count > 0:
                self.stdout.write(
                    self.style.WARNING(f'Found {count} overdue invoices')
                )
                
                for invoice in overdue_invoices:
                    self.stdout.write(
                        f'  - Invoice {invoice.id}: {invoice.user.phone_number} - ${invoice.amount_due}'
                    )
                    
                # In a real implementation, you could send notifications here
                
            else:
                self.stdout.write(
                    self.style.SUCCESS('No overdue invoices found')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Failed to check overdue invoices: {str(e)}')
            )
            logger.error('Overdue invoice check failed: %s', str(e))
            raise