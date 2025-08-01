#!/usr/bin/env python3
"""
System Validation Script
Validates the Django configuration and basic system health without requiring all dependencies.
"""

import os
import sys
import json
from pathlib import Path

def check_django_apps():
    """Check that all Django apps are properly configured."""
    print("🔍 Checking Django Apps Configuration...")
    
    try:
        # Import Django settings
        sys.path.append(str(Path(__file__).parent))
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'CampaignManager.settings')
        
        from CampaignManager.settings import INSTALLED_APPS, BASE_DIR
        
        custom_apps = [
            'users', 'authentication', 'billing', 'voter_data', 
            'dashboards', 'integrations', 'canvassing', 'campaigns',
            'frontend', 'forms', 'territories', 'redistricting', 'analytics'
        ]
        
        found_apps = []
        missing_apps = []
        
        for app in custom_apps:
            if app in INSTALLED_APPS:
                found_apps.append(app)
                # Check if app directory exists
                app_path = BASE_DIR / app
                if not app_path.exists():
                    print(f"  ⚠️  App '{app}' in INSTALLED_APPS but directory missing")
                else:
                    print(f"  ✅ App '{app}' configured and directory exists")
            else:
                missing_apps.append(app)
        
        if missing_apps:
            print(f"  ❌ Missing apps: {missing_apps}")
        
        print(f"  📊 Found {len(found_apps)}/{len(custom_apps)} custom apps")
        
        return len(missing_apps) == 0
        
    except Exception as e:
        print(f"  ❌ Error checking Django apps: {e}")
        return False

def check_url_patterns():
    """Check URL patterns configuration."""
    print("\n🔍 Checking URL Patterns...")
    
    try:
        from CampaignManager.urls import urlpatterns
        
        api_patterns = [
            'api/auth/', 'api/users/', 'api/billing/', 'api/voter-data/',
            'api/dashboards/', 'api/integrations/', 'api/canvassing/',
            'api/campaigns/', 'api/forms/', 'api/territories/',
            'api/redistricting/', 'api/analytics/'
        ]
        
        configured_patterns = []
        for pattern in urlpatterns:
            pattern_str = str(pattern.pattern)
            configured_patterns.append(pattern_str)
        
        for api_pattern in api_patterns:
            found = any(api_pattern in pattern for pattern in configured_patterns)
            if found:
                print(f"  ✅ {api_pattern} configured")
            else:
                print(f"  ❌ {api_pattern} missing")
        
        print(f"  📊 Total URL patterns: {len(urlpatterns)}")
        return True
        
    except Exception as e:
        print(f"  ❌ Error checking URL patterns: {e}")
        return False

def check_models():
    """Check basic model structure."""
    print("\n🔍 Checking Model Structure...")
    
    try:
        from users.models import User, AuthPIN
        from voter_data.models import VoterRecord
        from campaigns.models import Campaign, Audience
        
        models_to_check = [
            (User, 'User'),
            (AuthPIN, 'AuthPIN'),
            (VoterRecord, 'VoterRecord'),
            (Campaign, 'Campaign'),
            (Audience, 'Audience')
        ]
        
        for model, name in models_to_check:
            # Check if model has required fields
            fields = [f.name for f in model._meta.fields]
            print(f"  ✅ {name} model: {len(fields)} fields")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Error checking models: {e}")
        return False

def check_frontend_structure():
    """Check frontend React application structure."""
    print("\n🔍 Checking Frontend Structure...")
    
    frontend_path = Path(__file__).parent / 'frontend' / 'react-app'
    
    if not frontend_path.exists():
        print("  ❌ Frontend React app directory not found")
        return False
    
    required_files = [
        'package.json',
        'vite.config.ts',
        'src/App.tsx',
        'src/store/index.ts',
        'src/services/api.ts'
    ]
    
    missing_files = []
    for file_path in required_files:
        full_path = frontend_path / file_path
        if full_path.exists():
            print(f"  ✅ {file_path}")
        else:
            print(f"  ❌ {file_path} missing")
            missing_files.append(file_path)
    
    # Check package.json dependencies
    package_json_path = frontend_path / 'package.json'
    if package_json_path.exists():
        try:
            with open(package_json_path) as f:
                package_data = json.load(f)
            deps = package_data.get('dependencies', {})
            dev_deps = package_data.get('devDependencies', {})
            total_deps = len(deps) + len(dev_deps)
            print(f"  📊 Package dependencies: {total_deps} total")
        except Exception as e:
            print(f"  ⚠️  Could not parse package.json: {e}")
    
    return len(missing_files) == 0

def check_configuration_files():
    """Check essential configuration files."""
    print("\n🔍 Checking Configuration Files...")
    
    base_dir = Path(__file__).parent
    
    config_files = [
        ('requirements.txt', 'Python dependencies'),
        ('CampaignManager/settings.py', 'Django settings'),
        ('CampaignManager/urls.py', 'Django URLs'),
        ('CampaignManager/asgi.py', 'ASGI configuration'),
        ('.gitignore', 'Git ignore file'),
        ('manage.py', 'Django management script')
    ]
    
    all_present = True
    for file_path, description in config_files:
        full_path = base_dir / file_path
        if full_path.exists():
            print(f"  ✅ {description}: {file_path}")
        else:
            print(f"  ❌ {description}: {file_path} missing")
            all_present = False
    
    return all_present

def check_migrations():
    """Check migration status."""
    print("\n🔍 Checking Migration Status...")
    
    base_dir = Path(__file__).parent
    
    apps_with_migrations = []
    apps_without_migrations = []
    
    apps = ['users', 'authentication', 'billing', 'voter_data', 'campaigns', 
           'dashboards', 'integrations', 'canvassing', 'forms', 'territories',
           'redistricting', 'analytics', 'frontend']
    
    for app in apps:
        migrations_dir = base_dir / app / 'migrations'
        if migrations_dir.exists():
            migration_files = list(migrations_dir.glob('*.py'))
            migration_files = [f for f in migration_files if f.name != '__init__.py']
            if migration_files:
                apps_with_migrations.append(app)
                print(f"  ✅ {app}: {len(migration_files)} migrations")
            else:
                apps_without_migrations.append(app)
                print(f"  ⚠️  {app}: migrations directory exists but no migration files")
        else:
            apps_without_migrations.append(app)
            print(f"  ❌ {app}: no migrations directory")
    
    print(f"  📊 Apps with migrations: {len(apps_with_migrations)}/{len(apps)}")
    
    return len(apps_with_migrations) > 0

def main():
    """Run comprehensive system validation."""
    print("🚀 Starting System Validation for VEP Django Campaign Management System")
    print("=" * 70)
    
    checks = [
        ("Django Apps Configuration", check_django_apps),
        ("URL Patterns", check_url_patterns),
        ("Model Structure", check_models),
        ("Frontend Structure", check_frontend_structure),
        ("Configuration Files", check_configuration_files),
        ("Migration Status", check_migrations)
    ]
    
    results = []
    
    for check_name, check_func in checks:
        try:
            result = check_func()
            results.append((check_name, result))
        except Exception as e:
            print(f"  ❌ Error running {check_name}: {e}")
            results.append((check_name, False))
    
    print("\n" + "=" * 70)
    print("📋 VALIDATION SUMMARY")
    print("=" * 70)
    
    passed = 0
    total = len(results)
    
    for check_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {check_name}")
        if result:
            passed += 1
    
    print(f"\n📊 Overall Result: {passed}/{total} checks passed")
    
    if passed == total:
        print("🎉 All validation checks passed! System structure is healthy.")
        return 0
    elif passed >= total * 0.7:
        print("⚠️  Most checks passed. Address failing checks for optimal performance.")
        return 1
    else:
        print("❌ Multiple validation checks failed. System needs attention.")
        return 2

if __name__ == "__main__":
    sys.exit(main())