#!/usr/bin/env python
"""
Test package deletion functionality
"""

import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from tourism.models import Package, User
from django.test import RequestFactory
from tourism.views import PackageDetailView
from rest_framework.test import force_authenticate

def test_package_delete():
    print("\n" + "="*70)
    print("  Testing Package Delete Functionality")
    print("="*70 + "\n")
    
    # Get provider and a package
    provider = User.objects.filter(role='provider').first()
    if not provider:
        print("❌ No provider found!")
        return
    
    package = Package.objects.filter(provider=provider, is_active=True).first()
    if not package:
        print("❌ No active packages found for provider!")
        return
    
    print(f"Provider: {provider.username} (ID: {provider.id})")
    print(f"Package: {package.name} (ID: {package.id})")
    print(f"Package Provider ID: {package.provider_id}")
    print(f"Is Active: {package.is_active}")
    print()
    
    # Create a mock request
    factory = RequestFactory()
    request = factory.delete(f'/api/packages/{package.id}/')
    force_authenticate(request, user=provider)
    
    # Call the delete view
    view = PackageDetailView()
    response = view.delete(request, pk=package.id)
    
    print(f"Response Status: {response.status_code}")
    print(f"Response Data: {response.data}")
    print()
    
    # Check if package is soft-deleted
    package.refresh_from_db()
    print(f"Package Is Active After Delete: {package.is_active}")
    
    if response.status_code == 200 and not package.is_active:
        print("\n✅ Delete functionality working correctly!")
    else:
        print("\n❌ Delete functionality has issues!")
    
    # Restore the package for future tests
    package.is_active = True
    package.save()
    print(f"\n✓ Package restored for future tests")
    
    print("\n" + "="*70)

if __name__ == '__main__':
    test_package_delete()
