from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    # Authentication
    path('register/', views.UserRegistrationView.as_view(), name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('password-reset/', views.password_reset_request, name='password_reset'),
    
    # User profile
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    
    # Account details by role
    path('account/state/', views.StateAccountView.as_view(), name='state_account'),
    path('account/county/', views.CountyAccountView.as_view(), name='county_account'),
    path('account/candidate/', views.CandidateAccountView.as_view(), name='candidate_account'),
    path('account/vendor/', views.VendorAccountView.as_view(), name='vendor_account'),
    
    # Volunteer invites
    path('invites/', views.VolunteerInviteListCreateView.as_view(), name='invite_list'),
    path('invites/<uuid:pk>/', views.VolunteerInviteDetailView.as_view(), name='invite_detail'),
]