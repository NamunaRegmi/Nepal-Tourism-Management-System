#!/usr/bin/env python
"""
Test login functionality
"""

import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from tourism.models import User

def test_login():
    print("\n" + "="*70)
    print("  Testing Login Credentials")
    print("="*70 + "\n")
    
    # Check if provider exists
    try:
        provider = User.objects.get(email='provider@example.com')
        print(f"✓ Provider found: {provider.username}")
        print(f"  Email: {provider.email}")
        print(f"  Role: {provider.role}")
        print(f"  Active: {provider.is_active}")
        print()
        
        # Test password
        test_password = 'provider123'
        if provider.check_password(test_password):
            print(f"✓ Password '{test_password}' is CORRECT")
        else:
            print(f"✗ Password '{test_password}' is INCORRECT")
            print("  Resetting password...")
            provider.set_password(test_password)
            provider.save()
            print(f"✓ Password reset to '{test_password}'")
        
    except User.DoesNotExist:
        print("✗ Provider not found!")
        print("  Creating provider account...")
        provider = User.objects.create_user(
            username='provider',
            email='provider@example.com',
            password='provider123',
            role='provider',
            first_name='Service',
            last_name='Provider'
        )
        print(f"✓ Provider created: {provider.email}")
    
    print("\n" + "="*70)
    print("Login Credentials:")
    print("  Email: provider@example.com")
    print("  Password: provider123")
    print("="*70 + "\n")

if __name__ == '__main__':
    test_login()
