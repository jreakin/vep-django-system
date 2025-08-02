#!/usr/bin/env python3
"""
System verification script to test that all core systems are working.
Run this after starting the development API server.
"""

import requests
import json
import sys

def test_endpoint(endpoint, name):
    """Test a single API endpoint"""
    try:
        url = f"http://localhost:8000{endpoint}"
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                count = len(data)
            elif isinstance(data, dict):
                count = data.get('count', len(data.get('results', [])))
            else:
                count = 1
            
            print(f"✅ {name}: {count} items loaded")
            return True
        else:
            print(f"❌ {name}: HTTP {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ {name}: Connection failed (is the API server running?)")
        return False
    except Exception as e:
        print(f"❌ {name}: Error - {str(e)}")
        return False

def main():
    """Run system verification tests"""
    print("VEP Django System - System Verification")
    print("=====================================")
    print()
    
    # Test endpoints
    tests = [
        ("/api/status/", "API Server Status"),
        ("/api/redistricting/plans/", "Redistricting System"),
        ("/api/voter-data/voters/", "Voter Data System"),
        ("/api/canvassing/walklists/", "Canvassing Walk Lists"),
        ("/api/canvassing/questionnaires/", "Canvassing Questionnaires"),
        ("/api/canvassing/sessions/", "Canvassing Sessions"),
        ("/api/users/accounts/", "User Management"),
        ("/api/campaigns/", "Campaigns System"),
        ("/api/audiences/", "Campaign Audiences"),
        ("/api/territories/", "Territories System"),
    ]
    
    passed = 0
    total = len(tests)
    
    for endpoint, name in tests:
        if test_endpoint(endpoint, name):
            passed += 1
    
    print()
    print(f"Results: {passed}/{total} systems working")
    
    if passed == total:
        print("🎉 All systems are operational!")
        print()
        print("Next steps:")
        print("1. Start the React frontend: cd frontend/react-app && npm run dev")
        print("2. Visit http://localhost:5173")
        print("3. Navigate to different sections to test functionality")
        print("4. All systems should now load data instead of showing errors")
        return 0
    else:
        print("⚠️  Some systems are not working. Check the API server.")
        return 1

if __name__ == "__main__":
    sys.exit(main())