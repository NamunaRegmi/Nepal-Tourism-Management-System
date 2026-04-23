#!/usr/bin/env python
"""
Test script to verify admin API endpoints work correctly
"""
import os
import sys
import django
import requests
import json

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from tourism.models import User
from rest_framework_simplejwt.tokens import RefreshToken

def test_admin_api():
    print("=" * 60)
    print("ADMIN API ENDPOINT TEST")
    print("=" * 60)
    
    # Get admin user
    try:
        admin = User.objects.get(username='admin', role='admin')
        print(f"\n✓ Found admin user: {admin.username} ({admin.email})")
    except User.DoesNotExist:
        print("\n✗ Admin user not found!")
        return
    
    # Generate JWT token
    refresh = RefreshToken.for_user(admin)
    access_token = str(refresh.access_token)
    
    print(f"✓ Generated JWT token")
    print(f"  Token (first 50 chars): {access_token[:50]}...")
    
    # Test API endpoints
    base_url = "http://127.0.0.1:8000/api"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    print("\n" + "=" * 60)
    print("TESTING API ENDPOINTS")
    print("=" * 60)
    
    # Test 1: Admin Stats
    print("\n1. Testing /admin/stats/")
    try:
        response = requests.get(f"{base_url}/admin/stats/", headers=headers)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Success!")
            print(f"   Data: {json.dumps(data, indent=2)}")
        else:
            print(f"   ✗ Failed: {response.text}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    # Test 2: Admin Users
    print("\n2. Testing /admin/users/")
    try:
        response = requests.get(f"{base_url}/admin/users/", headers=headers)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Success! Found {len(data)} users")
        else:
            print(f"   ✗ Failed: {response.text}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    # Test 3: Admin Providers
    print("\n3. Testing /admin/providers/")
    try:
        response = requests.get(f"{base_url}/admin/providers/", headers=headers)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Success! Found {len(data)} providers")
        else:
            print(f"   ✗ Failed: {response.text}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    # Test 4: Bookings
    print("\n4. Testing /bookings/")
    try:
        response = requests.get(f"{base_url}/bookings/", headers=headers)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Success! Found {len(data)} bookings")
        else:
            print(f"   ✗ Failed: {response.text}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    # Test 5: Admin Packages
    print("\n5. Testing /admin/packages/")
    try:
        response = requests.get(f"{base_url}/admin/packages/", headers=headers)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Success! Found {len(data)} packages")
        else:
            print(f"   ✗ Failed: {response.text}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    # Test 6: Profile
    print("\n6. Testing /auth/profile/")
    try:
        response = requests.get(f"{base_url}/auth/profile/", headers=headers)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Success!")
            print(f"   User: {data.get('username')} - Role: {data.get('role')}")
        else:
            print(f"   ✗ Failed: {response.text}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    print("\n" + "=" * 60)
    print("LOGIN CREDENTIALS FOR FRONTEND")
    print("=" * 60)
    print("\nUse these credentials to login:")
    print(f"  Email: {admin.email}")
    print(f"  Password: admin123")
    print("\nOR use the token directly:")
    print(f"  Access Token: {access_token}")
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)

if __name__ == '__main__':
    test_admin_api()
