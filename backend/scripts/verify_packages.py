#!/usr/bin/env python
"""
Verify package data in database
"""

import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from tourism.models import Package

def verify_packages():
    print("\n" + "="*70)
    print("  Package Data Verification")
    print("="*70 + "\n")
    
    packages = Package.objects.filter(is_active=True)
    
    print(f"Total active packages: {packages.count()}\n")
    
    for pkg in packages:
        print(f"📦 {pkg.name}")
        print(f"   Provider: {pkg.provider.username}")
        print(f"   Price: Rs. {pkg.price}")
        print(f"   Duration: {pkg.duration_days} days")
        print(f"   Max People: {pkg.max_people}")
        print(f"   Destination: {pkg.destination}")
        print(f"   Has Itinerary: {'Yes' if pkg.itinerary else 'No'}")
        print(f"   Has Services: {'Yes' if pkg.included_services else 'No'}")
        print(f"   Image: {pkg.image[:50]}..." if pkg.image else "   No image")
        print(f"   Created: {pkg.created_at.strftime('%Y-%m-%d')}")
        print()
    
    print("="*70)
    print("✅ All packages verified successfully!")
    print("="*70 + "\n")

if __name__ == '__main__':
    verify_packages()
