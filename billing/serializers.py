from rest_framework import serializers
from users.models import Invoice, Payment
from decimal import Decimal


class InvoiceSerializer(serializers.ModelSerializer):
    """Serializer for Invoice model."""
    
    user_phone = serializers.CharField(source='user.phone_number', read_only=True)
    user_role = serializers.CharField(source='user.get_role_display', read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'user_phone', 'user_role', 'period_start', 'period_end',
            'billing_cycle', 'amount_due', 'platform_fee', 'service_fees',
            'status', 'due_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model."""
    
    invoice_id = serializers.UUIDField(source='invoice.id', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'invoice_id', 'stripe_payment_intent_id', 'amount',
            'status', 'payment_method', 'failure_reason', 'paid_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CreateInvoiceSerializer(serializers.Serializer):
    """Serializer for creating invoices."""
    
    user_id = serializers.UUIDField()
    billing_cycle = serializers.ChoiceField(choices=['monthly', 'annual'], default='monthly')
    service_fees = serializers.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))


class CreatePaymentSerializer(serializers.Serializer):
    """Serializer for creating payment intents."""
    
    invoice_id = serializers.UUIDField()
    
    def validate_invoice_id(self, value):
        """Validate that invoice exists and is payable."""
        try:
            invoice = Invoice.objects.get(id=value)
            if invoice.status == 'paid':
                raise serializers.ValidationError("Invoice is already paid")
            return value
        except Invoice.DoesNotExist:
            raise serializers.ValidationError("Invoice not found")