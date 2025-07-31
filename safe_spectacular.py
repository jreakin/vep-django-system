"""
Safe decorators that work with or without drf-spectacular.
"""

# Try to import drf-spectacular decorators
try:
    from drf_spectacular.utils import extend_schema, extend_schema_view
    spectacular_available = True
except ImportError:
    spectacular_available = False
    
    # Create no-op decorators when drf-spectacular is not available
    def extend_schema(*args, **kwargs):
        """No-op decorator when drf-spectacular is not available."""
        def decorator(func):
            return func
        return decorator
    
    def extend_schema_view(*args, **kwargs):
        """No-op decorator when drf-spectacular is not available."""
        def decorator(cls):
            return cls
        return decorator

# Export the decorators
__all__ = ['extend_schema', 'extend_schema_view', 'spectacular_available']