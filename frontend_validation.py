#!/usr/bin/env python3
"""
Frontend Structure Validation
Validates the React frontend structure and identifies potential issues.
"""

import os
import json
import re
from pathlib import Path

def check_package_json():
    """Check package.json structure and dependencies."""
    print("🔍 Checking package.json Configuration...")
    
    package_path = Path(__file__).parent / 'frontend' / 'react-app' / 'package.json'
    
    if not package_path.exists():
        print("  ❌ package.json not found")
        return False
    
    try:
        with open(package_path) as f:
            package_data = json.load(f)
        
        # Check required scripts
        scripts = package_data.get('scripts', {})
        required_scripts = ['dev', 'build', 'lint', 'preview']
        
        for script in required_scripts:
            if script in scripts:
                print(f"  ✅ Script '{script}': {scripts[script]}")
            else:
                print(f"  ❌ Missing script: {script}")
        
        # Check critical dependencies
        deps = package_data.get('dependencies', {})
        critical_deps = [
            'react', 'react-dom', 'react-router-dom', 
            '@reduxjs/toolkit', 'react-redux', 'axios',
            '@mui/material', 'tailwindcss'
        ]
        
        missing_deps = []
        for dep in critical_deps:
            if dep in deps:
                print(f"  ✅ Dependency '{dep}': {deps[dep]}")
            else:
                print(f"  ❌ Missing dependency: {dep}")
                missing_deps.append(dep)
        
        # Check for duplicate dependencies
        dev_deps = package_data.get('devDependencies', {})
        duplicates = set(deps.keys()) & set(dev_deps.keys())
        if duplicates:
            print(f"  ⚠️  Duplicate dependencies: {list(duplicates)}")
        
        print(f"  📊 Total dependencies: {len(deps)} runtime, {len(dev_deps)} dev")
        
        return len(missing_deps) == 0
        
    except Exception as e:
        print(f"  ❌ Error reading package.json: {e}")
        return False

def check_typescript_config():
    """Check TypeScript configuration files."""
    print("\n🔍 Checking TypeScript Configuration...")
    
    frontend_path = Path(__file__).parent / 'frontend' / 'react-app'
    
    ts_configs = [
        'tsconfig.json',
        'tsconfig.app.json', 
        'tsconfig.node.json'
    ]
    
    all_present = True
    for config_file in ts_configs:
        config_path = frontend_path / config_file
        if config_path.exists():
            print(f"  ✅ {config_file}")
            
            # Basic validation of tsconfig
            try:
                with open(config_path) as f:
                    content = f.read()
                    # Check for common required settings
                    if 'jsx' in content and 'moduleResolution' in content:
                        print(f"    ✅ Basic TypeScript settings configured")
                    else:
                        print(f"    ⚠️  Basic TypeScript settings may be incomplete")
            except Exception as e:
                print(f"    ⚠️  Could not validate {config_file}: {e}")
        else:
            print(f"  ❌ {config_file} missing")
            all_present = False
    
    return all_present

def check_vite_config():
    """Check Vite configuration."""
    print("\n🔍 Checking Vite Configuration...")
    
    vite_config_path = Path(__file__).parent / 'frontend' / 'react-app' / 'vite.config.ts'
    
    if not vite_config_path.exists():
        print("  ❌ vite.config.ts not found")
        return False
    
    try:
        with open(vite_config_path) as f:
            content = f.read()
        
        # Check for essential configurations
        checks = [
            ('React plugin', '@vitejs/plugin-react'),
            ('Proxy configuration', 'proxy'),
            ('Server port', 'port'),
            ('API proxy target', 'localhost:8000')
        ]
        
        all_configured = True
        for check_name, pattern in checks:
            if pattern in content:
                print(f"  ✅ {check_name} configured")
            else:
                print(f"  ❌ {check_name} missing or misconfigured")
                all_configured = False
        
        return all_configured
        
    except Exception as e:
        print(f"  ❌ Error reading vite.config.ts: {e}")
        return False

def check_app_tsx():
    """Check App.tsx for common issues."""
    print("\n🔍 Checking App.tsx Structure...")
    
    app_tsx_path = Path(__file__).parent / 'frontend' / 'react-app' / 'src' / 'App.tsx'
    
    if not app_tsx_path.exists():
        print("  ❌ App.tsx not found")
        return False
    
    try:
        with open(app_tsx_path) as f:
            content = f.read()
        
        # Check for duplicate imports
        imports = re.findall(r'^import.*from [\'"]([^\'"]+)[\'"]', content, re.MULTILINE)
        duplicate_imports = {}
        for imp in imports:
            duplicate_imports[imp] = duplicate_imports.get(imp, 0) + 1
        
        duplicates = {k: v for k, v in duplicate_imports.items() if v > 1}
        if duplicates:
            print(f"  ⚠️  Duplicate imports found: {duplicates}")
        else:
            print("  ✅ No duplicate imports")
        
        # Check for essential imports
        essential_imports = [
            'react-router-dom',
            'react-redux',
            '@mui/material',
            './store'
        ]
        
        missing_imports = []
        for imp in essential_imports:
            if imp not in content:
                missing_imports.append(imp)
            else:
                print(f"  ✅ {imp} imported")
        
        if missing_imports:
            print(f"  ❌ Missing imports: {missing_imports}")
        
        # Check for duplicate route definitions
        routes = re.findall(r'<Route.*path=[\'"]([^\'"]+)[\'"]', content)
        route_counts = {}
        for route in routes:
            route_counts[route] = route_counts.get(route, 0) + 1
        
        duplicate_routes = {k: v for k, v in route_counts.items() if v > 1}
        if duplicate_routes:
            print(f"  ⚠️  Duplicate routes found: {duplicate_routes}")
        else:
            print("  ✅ No duplicate routes")
        
        return len(missing_imports) == 0 and len(duplicate_routes) == 0
        
    except Exception as e:
        print(f"  ❌ Error reading App.tsx: {e}")
        return False

def check_services():
    """Check service files structure."""
    print("\n🔍 Checking Service Files...")
    
    services_path = Path(__file__).parent / 'frontend' / 'react-app' / 'src' / 'services'
    
    if not services_path.exists():
        print("  ❌ Services directory not found")
        return False
    
    expected_services = [
        'api.ts',
        'auth.ts',
        'voterData.ts',
        'campaign.ts',
        'dashboard.ts'
    ]
    
    missing_services = []
    for service in expected_services:
        service_path = services_path / service
        if service_path.exists():
            print(f"  ✅ {service}")
            
            # Check for basic API configuration
            if service == 'api.ts':
                try:
                    with open(service_path) as f:
                        content = f.read()
                    if 'axios.create' in content and 'baseURL' in content:
                        print("    ✅ Axios configuration found")
                    if 'interceptors' in content:
                        print("    ✅ Request/response interceptors configured")
                except Exception:
                    pass
        else:
            print(f"  ❌ {service} missing")
            missing_services.append(service)
    
    return len(missing_services) == 0

def check_store():
    """Check Redux store configuration."""
    print("\n🔍 Checking Redux Store...")
    
    store_path = Path(__file__).parent / 'frontend' / 'react-app' / 'src' / 'store'
    
    if not store_path.exists():
        print("  ❌ Store directory not found")
        return False
    
    store_files = ['index.ts', 'authSlice.ts']
    
    missing_files = []
    for file in store_files:
        file_path = store_path / file
        if file_path.exists():
            print(f"  ✅ {file}")
            
            # Check store configuration
            if file == 'index.ts':
                try:
                    with open(file_path) as f:
                        content = f.read()
                    if 'configureStore' in content and 'RootState' in content:
                        print("    ✅ Store properly configured")
                except Exception:
                    pass
                    
            # Check auth slice
            if file == 'authSlice.ts':
                try:
                    with open(file_path) as f:
                        content = f.read()
                    if 'createSlice' in content and 'loginSuccess' in content:
                        print("    ✅ Auth slice properly configured")
                except Exception:
                    pass
        else:
            print(f"  ❌ {file} missing")
            missing_files.append(file)
    
    return len(missing_files) == 0

def check_css_config():
    """Check CSS and styling configuration."""
    print("\n🔍 Checking CSS Configuration...")
    
    frontend_path = Path(__file__).parent / 'frontend' / 'react-app'
    
    css_files = [
        'tailwind.config.js',
        'postcss.config.cjs',
        'src/index.css'
    ]
    
    missing_files = []
    for file in css_files:
        file_path = frontend_path / file
        if file_path.exists():
            print(f"  ✅ {file}")
        else:
            print(f"  ❌ {file} missing")
            missing_files.append(file)
    
    return len(missing_files) == 0

def main():
    """Run frontend validation."""
    print("🎨 Starting Frontend Validation for VEP Campaign Management System")
    print("=" * 70)
    
    checks = [
        ("Package.json Configuration", check_package_json),
        ("TypeScript Configuration", check_typescript_config),
        ("Vite Configuration", check_vite_config),
        ("App.tsx Structure", check_app_tsx),
        ("Service Files", check_services),
        ("Redux Store", check_store),
        ("CSS Configuration", check_css_config)
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
    print("📋 FRONTEND VALIDATION SUMMARY")
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
        print("🎉 All frontend validation checks passed!")
        return 0
    elif passed >= total * 0.7:
        print("⚠️  Most frontend checks passed. Address failing checks for optimal performance.")
        return 1
    else:
        print("❌ Multiple frontend validation checks failed. System needs attention.")
        return 2

if __name__ == "__main__":
    import sys
    sys.exit(main())