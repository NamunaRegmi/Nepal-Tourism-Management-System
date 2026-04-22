#!/usr/bin/env python
"""
Quick verification script for RBAC setup
Run after migrations to verify everything is working correctly
"""

import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from tourism.models import User, Hotel, Destination

def verify():
    print("\n" + "="*50)
    print("  RBAC Setup Verification")
    print("="*50 + "\n")
    
    # Check 1: Hotels have providers
    hotels_without_provider = Hotel.objects.filter(provider__isnull=True).count()
    total_hotels = Hotel.objects.count()
    
    print(f"✓ Total Hotels: {total_hotels}")
    if hotels_without_provider == 0:
        print(f"✓ All hotels have providers assigned")
    else:
        print(f"✗ {hotels_without_provider} hotels missing provider!")
        return False
    
    # Check 2: Providers exist
    provider_count = User.objects.filter(role='provider').count()
    print(f"✓ Total Providers: {provider_count}")
    
    if provider_count == 0:
        print("✗ No providers found! Create at least one provider.")
        return False
    
    # Check 3: Admin exists
    admin_count = User.objects.filter(role='admin').count()
    print(f"✓ Total Admins: {admin_count}")
    
    if admin_count == 0:
        print("⚠ Warning: No admin user found")
    
    # Check 4: Provider hotel distribution
    print("\nProvider Hotel Distribution:")
    for provider in User.objects.filter(role='provider')[:5]:
        count = Hotel.objects.filter(provider=provider).count()
        print(f"  - {provider.username}: {count} hotels")
    
    print("\n" + "="*50)
    print("  ✓ RBAC Setup Verified Successfully!")
    print("="*50 + "\n")
    return True

if __name__ == '__main__':
    success = verify()
    sys.exit(0 if success else 1)
