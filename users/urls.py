from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    # User profile
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    
    # Account management (Owner can view all)
    path('accounts/', views.AccountListView.as_view(), name='account_list'),
    
    # Account details by role
    path('account/owner/', views.OwnerAccountView.as_view(), name='owner_account'),
    path('account/state/', views.StateAccountView.as_view(), name='state_account'),
    path('account/county/', views.CountyAccountView.as_view(), name='county_account'),
    path('account/campaign/', views.CampaignAccountView.as_view(), name='campaign_account'),
    path('account/vendor/', views.VendorAccountView.as_view(), name='vendor_account'),
    
    # Volunteer invites
    path('invites/', views.VolunteerInviteListCreateView.as_view(), name='invite_list'),
    path('invites/<uuid:pk>/', views.VolunteerInviteDetailView.as_view(), name='invite_detail'),
]