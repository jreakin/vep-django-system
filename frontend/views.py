from django.shortcuts import render


def home(request):
    """Home page view."""
    return render(request, 'frontend/home.html')


def column_mapping(request):
    """Column mapping interface for CSV uploads."""
    return render(request, 'frontend/column_mapping.html')
