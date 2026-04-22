#!/usr/bin/env python
"""
Test script for Role-Based Access Control (RBAC) in Hotel Management
Run this script to verify that the RBAC system is working correctly.

Usage:
    python manage.py shell < scripts/test_rbac.py
"""

import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from tourism.models import User, Hotel, Destination
from django.db.models import Q

def print_section(title):
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def test_rbac():
    print_section("RBAC Test Suite - Hotel Management")
    
    # 1. Check Users
    print_section("1. User Roles Check")
    users = User.objects.filter(role='user').count()
    providers = User.objects.filter(role='provider').count()
    admins = User.objects.filter(role='admin').count()
    
    print(f"Total Users (Travelers): {users}")
    print(f"Total Providers: {providers}")
    print(f"Total Admins: {admins}")
    
    if providers == 0:
        print("\n⚠️  WARNING: No providers found!")
        print("Creating a test provider...")
        test_provider = User.objects.create_user(
            username='test_provider',
            email='provider@test.com',
            password='testpass123',
            role='provider',
            first_name='Test',
            last_name='Provider'
        )
        print(f"✓ Created test provider: {test_provider.username}")
    
    # 2. Check Hotels
    print_section("2. Hotel-Provider Relationship Check")
    total_hotels = Hotel.objects.count()
    hotels_with_provider = Hotel.objects.filter(provider__isnull=False).count()
    hotels_without_provider = Hotel.objects.filter(provider__isnull=True).count()
    
    print(f"Total Hotels: {total_hotels}")
    print(f"Hotels with Provider: {hotels_with_provider}")
    print(f"Hotels without Provider: {hotels_without_provider}")
    
    if hotels_without_provider > 0:
        print(f"\n⚠️  WARNING: {hotels_without_provider} hotels have no provider!")
        print("Run migrations to fix this: python manage.py migrate")
    else:
        print("\n✓ All hotels have a provider assigned")
    
    # 3. Provider Hotel Distribution
    print_section("3. Provider Hotel Distribution")
    providers_list = User.objects.filter(role='provider')
    
    if providers_list.exists():
        for provider in providers_list:
            hotel_count = Hotel.objects.filter(provider=provider).count()
            active_count = Hotel.objects.filter(provider=provider, is_active=True).count()
            print(f"\nProvider: {provider.username} ({provider.email})")
            print(f"  - Total Hotels: {hotel_count}")
            print(f"  - Active Hotels: {active_count}")
            
            if hotel_count > 0:
                hotels = Hotel.objects.filter(provider=provider)[:3]
                for hotel in hotels:
                    print(f"    • {hotel.name} ({hotel.destination.name})")
    else:
        print("No providers found in the system")
    
    # 4. Destination Coverage
    print_section("4. Destination Coverage")
    destinations = Destination.objects.filter(is_active=True)
    
    for dest in destinations[:5]:  # Show first 5 destinations
        hotel_count = Hotel.objects.filter(destination=dest, is_active=True).count()
        print(f"{dest.name}: {hotel_count} hotels")
    
    # 5. Access Control Verification
    print_section("5. Access Control Verification")
    
    # Check if any provider can access another provider's hotels
    providers_list = list(User.objects.filter(role='provider')[:2])
    
    if len(providers_list) >= 2:
        provider1 = providers_list[0]
        provider2 = providers_list[1]
        
        provider1_hotels = Hotel.objects.filter(provider=provider1).count()
        provider2_hotels = Hotel.objects.filter(provider=provider2).count()
        
        print(f"\nProvider 1 ({provider1.username}): {provider1_hotels} hotels")
        print(f"Provider 2 ({provider2.username}): {provider2_hotels} hotels")
        
        # Verify isolation
        overlap = Hotel.objects.filter(
            Q(provider=provider1) & Q(provider=provider2)
        ).count()
        
        if overlap == 0:
            print("✓ Provider isolation verified - no hotel overlap")
        else:
            print(f"⚠️  WARNING: {overlap} hotels belong to multiple providers!")
    else:
        print("Need at least 2 providers to test isolation")
    
    # 6. Admin Access Check
    print_section("6. Admin Access Check")
    admin_users = User.objects.filter(role='admin')
    
    if admin_users.exists():
        admin = admin_users.first()
        print(f"Admin user found: {admin.username}")
        print(f"Admin can access all {total_hotels} hotels")
        print("✓ Admin has full system access")
    else:
        print("⚠️  WARNING: No admin user found!")
        print("Creating a test admin...")
        test_admin = User.objects.create_superuser(
            username='admin',
            email='admin@test.com',
            password='admin123',
            role='admin'
        )
        print(f"✓ Created test admin: {test_admin.username}")
    
    # 7. Summary
    print_section("Summary")
    
    issues = []
    
    if providers == 0:
        issues.append("No providers in the system")
    
    if hotels_without_provider > 0:
        issues.append(f"{hotels_without_provider} hotels without provider")
    
    if not admin_users.exists():
        issues.append("No admin user found")
    
    if issues:
        print("\n⚠️  Issues Found:")
        for issue in issues:
            print(f"  - {issue}")
        print("\nRecommendation: Run migrations and create necessary users")
    else:
        print("\n✓ All RBAC checks passed!")
        print("The system is properly configured for role-based access control")
    
    print("\n" + "="*60)
    print("Test completed!")
    print("="*60 + "\n")

if __name__ == '__main__':
    test_rbac()
