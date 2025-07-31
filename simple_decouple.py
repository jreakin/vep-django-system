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
            truthy_values = {'true', '1', 'yes', 'on'}
            falsy_values = {'false', '0', 'no', 'off'}
            value_lower = str(value).strip().lower()
            if value_lower in truthy_values:
                return True
            elif value_lower in falsy_values:
                return False
            raise ValueError(f"Invalid boolean value: {value}")
        elif cast == int:
            return int(value)
        elif cast == float:
            return float(value)
    return value