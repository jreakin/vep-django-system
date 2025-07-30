from django.urls import path
from . import views

urlpatterns = [
    path('invoices/', views.InvoiceListView.as_view(), name='invoice-list'),
    path('invoices/create/', views.CreateInvoiceView.as_view(), name='create-invoice'),
    path('invoices/overdue/', views.overdue_invoices, name='overdue-invoices'),
    path('payments/create/', views.CreatePaymentView.as_view(), name='create-payment'),
    path('payments/status/<uuid:invoice_id>/', views.PaymentStatusView.as_view(), name='payment-status'),
    path('webhooks/stripe/', views.stripe_webhook, name='stripe-webhook'),
]