"""
Fallback schema generation for when drf-spectacular fails.
This provides a basic OpenAPI schema as a backup.
"""
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views.generic import View
from rest_framework.response import Response
from rest_framework.views import APIView
import json


class FallbackSchemaView(APIView):
    """
    Fallback schema view that provides a basic OpenAPI schema
    when drf-spectacular fails to generate one.
    """
    
    def get(self, request):
        """Return a basic OpenAPI schema."""
        
        fallback_schema = {
            "openapi": "3.0.2",
            "info": {
                "title": "CampaignManager API",
                "description": "Political Campaign Management System API",
                "version": "1.0.0"
            },
            "servers": [
                {
                    "url": request.build_absolute_uri('/api/'),
                    "description": "Campaign Manager API Server"
                }
            ],
            "paths": {
                "/api/auth/register/": {
                    "post": {
                        "summary": "Register new user",
                        "description": "Register with phone number and receive SMS PIN",
                        "requestBody": {
                            "required": True,
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "phone_number": {"type": "string", "example": "+1234567890"},
                                            "role": {"type": "string", "enum": ["campaign", "state", "county", "vendor"]}
                                        },
                                        "required": ["phone_number", "role"]
                                    }
                                }
                            }
                        },
                        "responses": {
                            "201": {"description": "User registered successfully"}
                        }
                    }
                },
                "/api/auth/verify-pin/": {
                    "post": {
                        "summary": "Verify PIN and get auth token",
                        "description": "Verify PIN received via SMS and get authentication token",
                        "requestBody": {
                            "required": True,
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "phone_number": {"type": "string", "example": "+1234567890"},
                                            "pin": {"type": "string", "example": "123456"}
                                        },
                                        "required": ["phone_number", "pin"]
                                    }
                                }
                            }
                        },
                        "responses": {
                            "200": {
                                "description": "PIN verified successfully",
                                "content": {
                                    "application/json": {
                                        "schema": {
                                            "type": "object",
                                            "properties": {
                                                "token": {"type": "string"},
                                                "user": {"type": "object"}
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                "/api/users/profile/": {
                    "get": {
                        "summary": "Get user profile",
                        "security": [{"tokenAuth": []}],
                        "responses": {
                            "200": {"description": "User profile retrieved successfully"}
                        }
                    }
                },
                "/api/billing/invoices/": {
                    "get": {
                        "summary": "List invoices",
                        "security": [{"tokenAuth": []}],
                        "responses": {
                            "200": {"description": "List of invoices"}
                        }
                    }
                }
            },
            "components": {
                "securitySchemes": {
                    "tokenAuth": {
                        "type": "apiKey",
                        "in": "header",
                        "name": "Authorization",
                        "description": "Token-based authentication with required prefix \"Token\""
                    }
                }
            }
        }
        
        return Response(fallback_schema)


class SafeSchemaView(APIView):
    """
    A safe schema view that tries drf-spectacular first,
    then falls back to a basic schema if it fails.
    """
    
    def get(self, request):
        """Try to get schema from drf-spectacular, fallback if it fails."""
        
        try:
            # Try to import and use drf-spectacular
            from drf_spectacular.views import SpectacularAPIView
            spectacular_view = SpectacularAPIView()
            spectacular_view.request = request
            return spectacular_view.get(request)
        except Exception as e:
            # Log the error for debugging
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to generate schema with drf-spectacular: {e}")
            
            # Fall back to basic schema
            fallback_view = FallbackSchemaView()
            fallback_view.request = request
            return fallback_view.get(request)


class SafeSwaggerView(APIView):
    """
    A safe Swagger UI view that handles schema generation failures gracefully.
    """
    
    def get(self, request):
        """Serve Swagger UI with safe schema endpoint."""
        
        try:
            from drf_spectacular.views import SpectacularSwaggerView
            swagger_view = SpectacularSwaggerView()
            swagger_view.request = request
            return swagger_view.get(request)
        except Exception as e:
            # Return a simple HTML page with error information
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>API Documentation - Error</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
            </head>
            <body>
                <div class="container mt-5">
                    <div class="alert alert-danger">
                        <h4>API Documentation Temporarily Unavailable</h4>
                        <p>We're experiencing technical difficulties generating the API documentation.</p>
                        <p>Error details: {str(e)}</p>
                        <hr>
                        <p class="mb-0">
                            <a href="/api/schema/" class="btn btn-primary">Try Raw Schema</a>
                            <a href="/" class="btn btn-secondary">Return to Home</a>
                        </p>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <h5>Quick API Reference</h5>
                        </div>
                        <div class="card-body">
                            <h6>Authentication</h6>
                            <ul>
                                <li><code>POST /api/auth/register/</code> - Register with phone number</li>
                                <li><code>POST /api/auth/verify-pin/</code> - Verify PIN and get token</li>
                            </ul>
                            
                            <h6>User Management</h6>
                            <ul>
                                <li><code>GET /api/users/profile/</code> - Get user profile</li>
                            </ul>
                            
                            <h6>Billing</h6>
                            <ul>
                                <li><code>GET /api/billing/invoices/</code> - List invoices</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """
            
            from django.http import HttpResponse
            return HttpResponse(html_content)