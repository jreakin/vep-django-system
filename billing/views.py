from django.shortcuts import render

from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.conf import settings
from drf_spectacular.utils import extend_schema
from users.models import Invoice, Payment
from .serializers import (
    InvoiceSerializer, PaymentSerializer, CreateInvoiceSerializer, CreatePaymentSerializer
)
from .services import BillingService
import stripe
import json
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


class OwnerPermission(permissions.BasePermission):
    """Permission for owner-only operations."""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'owner'


class InvoiceListView(generics.ListAPIView):
    """List invoices - all for owners, own for others."""
    
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'owner':
            return Invoice.objects.all().order_by('-created_at')
        else:
            return Invoice.objects.filter(user=self.request.user).order_by('-created_at')


class CreateInvoiceView(generics.CreateAPIView):
    """Create invoice - owner only."""
    
    serializer_class = CreateInvoiceSerializer
    permission_classes = [OwnerPermission]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user_id = serializer.validated_data['user_id']
        billing_cycle = serializer.validated_data['billing_cycle']
        service_fees = serializer.validated_data['service_fees']
        
        try:
            user = User.objects.get(id=user_id)
            billing_service = BillingService()
            invoice = billing_service.create_invoice(user, billing_cycle, service_fees)
            
            return Response({
                'message': 'Invoice created successfully',
                'invoice': InvoiceSerializer(invoice).data
            }, status=status.HTTP_201_CREATED)
            
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error("Invoice creation failed: %s", str(e))
            return Response({
                'error': 'Failed to create invoice'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CreatePaymentView(generics.CreateAPIView):
    """Create payment intent for invoice."""
    
    serializer_class = CreatePaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        invoice_id = serializer.validated_data['invoice_id']
        
        try:
            invoice = Invoice.objects.get(id=invoice_id)
            
            # Check if user can pay this invoice
            if request.user.role != 'owner' and invoice.user != request.user:
                return Response({
                    'error': 'Permission denied'
                }, status=status.HTTP_403_FORBIDDEN)
            
            billing_service = BillingService()
            payment_intent, payment = billing_service.create_payment_intent(invoice)
            
            return Response({
                'client_secret': payment_intent.client_secret,
                'payment': PaymentSerializer(payment).data
            }, status=status.HTTP_201_CREATED)
            
        except Invoice.DoesNotExist:
            return Response({
                'error': 'Invoice not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error("Payment creation failed: %s", str(e))
            return Response({
                'error': 'Failed to create payment'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PaymentStatusView(generics.RetrieveAPIView):
    """Get payment status for an invoice."""
    
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        invoice_id = self.kwargs['invoice_id']
        
        try:
            invoice = Invoice.objects.get(id=invoice_id)
            
            # Check permissions
            if self.request.user.role != 'owner' and invoice.user != self.request.user:
                raise permissions.PermissionDenied("Permission denied")
            
            # Get latest payment for this invoice
            return Payment.objects.filter(invoice=invoice).order_by('-created_at').first()
            
        except Invoice.DoesNotExist:
            raise Invoice.DoesNotExist("Invoice not found")


@method_decorator(csrf_exempt, name='dispatch')
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def stripe_webhook(request):
    """Handle Stripe webhook events."""
    
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    endpoint_secret = settings.STRIPE_WEBHOOK_SECRET
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError:
        logger.error("Invalid payload in Stripe webhook")
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError:
        logger.error("Invalid signature in Stripe webhook")
        return HttpResponse(status=400)
    
    try:
        billing_service = BillingService()
        billing_service.handle_payment_webhook(event)
        
        return HttpResponse(status=200)
        
    except Exception as e:
        logger.error("Webhook processing failed: %s", str(e))
        return HttpResponse(status=500)


@extend_schema(
    responses={200: {'type': 'object', 'properties': {
        'overdue_count': {'type': 'integer'},
        'overdue_invoices': {'type': 'array', 'items': InvoiceSerializer}
    }}}
)
@api_view(['GET'])
@permission_classes([OwnerPermission])
def overdue_invoices(request):
    """Get overdue invoices - owner only."""
    
    try:
        billing_service = BillingService()
        overdue = billing_service.get_overdue_invoices()
        
        return Response({
            'overdue_count': overdue.count(),
            'overdue_invoices': InvoiceSerializer(overdue, many=True).data
        })
        
    except Exception as e:
        logger.error("Failed to get overdue invoices: %s", str(e))
        return Response({
            'error': 'Failed to retrieve overdue invoices'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
