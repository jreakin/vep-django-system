from django.urls import path
from . import views

app_name = 'frontend'

urlpatterns = [
    path('', views.home, name='home'),
    path('upload/', views.column_mapping, name='column_mapping'),
]