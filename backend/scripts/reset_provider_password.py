#!/usr/bin/env python
"""
Quick script to reset provider password
"""

import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from tourism.models import User

def reset_password():
    print("\n" + "="*50)
    print("  Reset Provider Password")
    print("="*50 + "\n")
    
    # List all providers
    providers = User.objects.filter(role='provider')
    
    if not providers.exists():
        print("No providers found in the system!")
        return
    
    print("Available providers:")
    for i, provider in enumerate(providers, 1):
        hotel_count = provider.hotels.count()
        print(f"{i}. {provider.username} ({provider.email}) - {hotel_count} hotels")
    
    print("\n" + "="*50)
    choice = input("Enter number to reset password (or 'q' to quit): ").strip()
    
    if choice.lower() == 'q':
        print("Cancelled.")
        return
    
    try:
        index = int(choice) - 1
        provider = list(providers)[index]
    except (ValueError, IndexError):
        print("Invalid choice!")
        return
    
    new_password = input(f"\nEnter new password for {provider.email}: ").strip()
    
    if len(new_password) < 6:
        print("Password must be at least 6 characters!")
        return
    
    provider.set_password(new_password)
    provider.save()
    
    print(f"\n✓ Password reset successfully for {provider.email}")
    print(f"\nYou can now login with:")
    print(f"  Email: {provider.email}")
    print(f"  Password: {new_password}")
    print(f"\nThis provider has {provider.hotels.count()} hotels.")
    print("\n" + "="*50 + "\n")

if __name__ == '__main__':
    reset_password()
