"""
Test script to demonstrate the API schema fix works.
"""

def test_safe_spectacular_imports():
    """Test that our safe spectacular imports work."""
    print("Testing safe spectacular imports...")
    
    try:
        from safe_spectacular import extend_schema, spectacular_available
        print(f"✓ Safe spectacular imports work. Spectacular available: {spectacular_available}")
        
        # Test the decorator
        @extend_schema(description="Test endpoint")
        def test_view():
            return "test"
        
        result = test_view()
        print(f"✓ Safe extend_schema decorator works: {result}")
        
    except Exception as e:
        print(f"✗ Safe spectacular imports failed: {e}")
        return False
    
    return True

def test_fallback_schema():
    """Test that our fallback schema generation works."""
    print("\nTesting fallback schema generation...")
    
    try:
        from schema_fallback import FallbackSchemaView
        
        # Create a mock request object
        class MockRequest:
            def build_absolute_uri(self, path):
                return f"http://localhost:8000{path}"
        
        view = FallbackSchemaView()
        view.request = MockRequest()
        
        response = view.get(MockRequest())
        
        if hasattr(response, 'data') and isinstance(response.data, dict):
            schema = response.data
            title = schema.get('info', {}).get('title', 'Unknown')
            paths_count = len(schema.get('paths', {}))
            print(f"✓ Fallback schema generated successfully")
            print(f"  Title: {title}")
            print(f"  API paths: {paths_count}")
            return True
        else:
            print("✗ Fallback schema generation failed - no data")
            return False
            
    except Exception as e:
        print(f"✗ Fallback schema generation failed: {e}")
        return False

def test_url_configuration():
    """Test that our URL configuration logic works."""
    print("\nTesting URL configuration...")
    
    try:
        # Simulate the URL configuration logic
        try:
            # This will fail since drf_spectacular is not installed
            from drf_spectacular.views import SpectacularAPIView
            spectacular_available = True
            print("! drf_spectacular is available (unexpected in this test environment)")
        except ImportError:
            spectacular_available = False
            print("✓ drf_spectacular not available - will use fallback")
        
        if not spectacular_available:
            from schema_fallback import SafeSchemaView
            print("✓ SafeSchemaView imported successfully")
            
        return True
        
    except Exception as e:
        print(f"✗ URL configuration test failed: {e}")
        return False

def main():
    """Run all tests."""
    print("Running API Schema Fix Tests")
    print("=" * 50)
    
    tests = [
        test_safe_spectacular_imports,
        test_fallback_schema,
        test_url_configuration,
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
    
    print("\n" + "=" * 50)
    print(f"Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("✓ All tests passed! The API schema fix should work correctly.")
    else:
        print("✗ Some tests failed. Please check the implementation.")

if __name__ == "__main__":
    main()