from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_phone, name='register-phone'),
    path('send-pin/', views.send_pin, name='send-pin'),
    path('verify-pin/', views.verify_pin, name='verify-pin'),
    path('logout/', views.logout_view, name='logout'),
]