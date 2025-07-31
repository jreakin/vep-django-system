"""
Simple replacement for python-decouple to avoid dependency issues
"""
import os

def config(key, default=None, cast=None):
    """Simple config function that mimics python-decouple behavior"""
    value = os.environ.get(key, default)
    if cast and value is not None:
        if cast == bool:
            if isinstance(value, bool):
                return value
            return str(value).lower() in ('true', '1', 'yes', 'on')
        elif cast == int:
            return int(value)
        elif cast == float:
            return float(value)
    return value