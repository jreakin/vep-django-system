from django.shortcuts import render
from django.contrib.auth.decorators import login_required


def home(request):
    """Home page view."""
    return render(request, 'frontend/home.html')


@login_required
def column_mapping(request):
    """Column mapping interface for CSV uploads."""
    return render(request, 'frontend/column_mapping.html')
