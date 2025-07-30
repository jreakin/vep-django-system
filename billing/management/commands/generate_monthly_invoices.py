from django.core.management.base import BaseCommand
from django.utils import timezone
from billing.services import BillingService
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Generate monthly invoices for all active users'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without actually creating invoices',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting monthly invoice generation...'))
        
        billing_service = BillingService()
        
        if options['dry_run']:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No invoices will be created'))
            # In a real implementation, you'd add logic to show what would be created
            return
        
        try:
            invoices_created = billing_service.generate_monthly_invoices()
            self.stdout.write(
                self.style.SUCCESS(f'Successfully generated {invoices_created} monthly invoices')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Failed to generate monthly invoices: {str(e)}')
            )
            logger.error('Monthly invoice generation failed: %s', str(e))
            raise