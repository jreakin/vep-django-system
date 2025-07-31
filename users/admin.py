from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.http import HttpResponseRedirect
from impersonate.admin import UserAdminImpersonateMixin
from .models import (
    User, AuthPIN, OwnerAccount, StateAccount, CountyAccount, 
    CampaignAccount, VendorAccount, Invoice, Payment, VolunteerInvite
)


@admin.register(User)
class UserAdmin(UserAdminImpersonateMixin, BaseUserAdmin):
    """Custom user admin interface with impersonation."""
    
    list_display = ['phone_number', 'role', 'is_verified', 'is_active', 'impersonate_link', 'created_at']
    list_filter = ['role', 'is_verified', 'is_active', 'created_at']
    search_fields = ['phone_number', 'email']
    ordering = ['-created_at']
    
    fieldsets = (
        (None, {'fields': ('phone_number', 'email', 'role')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'is_verified')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
        ('Impersonation', {'fields': ('can_be_impersonated',)}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('phone_number', 'role', 'is_active'),
        }),
    )
    
    def impersonate_link(self, obj):
        """Add impersonation link to user list."""
        if obj.pk and obj.is_active:
            url = reverse('impersonate-start', args=[obj.pk])
            return format_html('<a href="{}" class="button">Impersonate</a>', url)
        return "N/A"
    impersonate_link.short_description = 'Impersonate'
    impersonate_link.allow_tags = True
    
    def can_be_impersonated(self, obj):
        """Show if user can be impersonated."""
        return obj.is_active and not obj.is_superuser
    can_be_impersonated.boolean = True
    can_be_impersonated.short_description = 'Can be impersonated'


@admin.register(AuthPIN)
class AuthPINAdmin(admin.ModelAdmin):
    """Admin interface for AuthPIN."""
    
    list_display = ['user', 'pin', 'created_at', 'expires_at', 'is_used', 'attempts']
    list_filter = ['is_used', 'created_at', 'expires_at']
    search_fields = ['user__phone_number', 'pin']
    readonly_fields = ['pin', 'created_at', 'expires_at']
    ordering = ['-created_at']


@admin.register(OwnerAccount)
class OwnerAccountAdmin(admin.ModelAdmin):
    """Admin interface for OwnerAccount."""
    
    list_display = ['user', 'company_name', 'contact_name', 'created_at']
    search_fields = ['company_name', 'contact_name', 'user__phone_number']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(StateAccount)
class StateAccountAdmin(admin.ModelAdmin):
    """Admin interface for StateAccount."""
    
    list_display = ['user', 'name', 'state', 'created_at']
    list_filter = ['state', 'created_at']
    search_fields = ['name', 'user__phone_number', 'sos_reference_id']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(CountyAccount)
class CountyAccountAdmin(admin.ModelAdmin):
    """Admin interface for CountyAccount."""
    
    list_display = ['user', 'name', 'county', 'state', 'created_at']
    list_filter = ['state', 'created_at']
    search_fields = ['name', 'county', 'user__phone_number', 'sos_reference_id']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(CampaignAccount)
class CampaignAccountAdmin(admin.ModelAdmin):
    """Admin interface for CampaignAccount."""
    
    list_display = ['user', 'name', 'office_type', 'office_name', 'state', 'created_at']
    list_filter = ['office_type', 'state', 'created_at']
    search_fields = ['name', 'office_name', 'user__phone_number', 'party_affiliation']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(VendorAccount)
class VendorAccountAdmin(admin.ModelAdmin):
    """Admin interface for VendorAccount."""
    
    list_display = ['user', 'company_name', 'contact_name', 'business_type', 'created_at']
    list_filter = ['business_type', 'created_at']
    search_fields = ['company_name', 'contact_name', 'user__phone_number', 'business_type']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    """Admin interface for Invoice."""
    
    list_display = ['id', 'user_info', 'billing_cycle', 'amount_due', 'status', 'due_date', 'created_at']
    list_filter = ['status', 'billing_cycle', 'created_at', 'due_date']
    search_fields = ['user__phone_number', 'id']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    def user_info(self, obj):
        return f"{obj.user.phone_number} ({obj.user.get_role_display()})"
    user_info.short_description = 'User'


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """Admin interface for Payment."""
    
    list_display = ['id', 'invoice_id', 'amount', 'status', 'payment_method', 'paid_at', 'created_at']
    list_filter = ['status', 'payment_method', 'created_at', 'paid_at']
    search_fields = ['invoice__user__phone_number', 'stripe_payment_intent_id', 'id']
    readonly_fields = ['id', 'stripe_payment_intent_id', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    def invoice_id(self, obj):
        return obj.invoice.id
    invoice_id.short_description = 'Invoice ID'


@admin.register(VolunteerInvite)
class VolunteerInviteAdmin(admin.ModelAdmin):
    """Admin interface for VolunteerInvite."""
    
    list_display = ['email', 'inviter', 'status', 'invited_at', 'expires_at']
    list_filter = ['status', 'invited_at', 'expires_at']
    search_fields = ['email', 'inviter__phone_number']
    readonly_fields = ['id', 'invited_at', 'responded_at']
    ordering = ['-invited_at']
