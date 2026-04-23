#!/usr/bin/env python
"""
Test script to verify admin login and check if admin user exists
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from tourism.models import User
from django.contrib.auth.hashers import make_password

def test_admin_user():
    print("=" * 60)
    print("ADMIN USER VERIFICATION")
    print("=" * 60)
    
    # Check if admin user exists
    admin_users = User.objects.filter(role='admin')
    
    if admin_users.exists():
        print(f"\n✓ Found {admin_users.count()} admin user(s):")
        for admin in admin_users:
            print(f"  - Username: {admin.username}")
            print(f"    Email: {admin.email}")
            print(f"    ID: {admin.id}")
            print(f"    Active: {admin.is_active}")
            print(f"    Staff: {admin.is_staff}")
            print(f"    Superuser: {admin.is_superuser}")
    else:
        print("\n✗ No admin users found!")
        print("\nCreating admin user...")
        
        # Create admin user
        admin = User.objects.create(
            username='admin',
            email='admin@example.com',
            role='admin',
            is_staff=True,
            is_superuser=True,
            is_active=True,
            first_name='Admin',
            last_name='User'
        )
        admin.set_password('admin123')
        admin.save()
        
        print(f"✓ Admin user created successfully!")
        print(f"  Username: admin")
        print(f"  Email: admin@example.com")
        print(f"  Password: admin123")
    
    print("\n" + "=" * 60)
    print("ALL USERS IN DATABASE")
    print("=" * 60)
    
    all_users = User.objects.all()
    for user in all_users:
        print(f"\n- {user.username} ({user.email})")
        print(f"  Role: {user.role}")
        print(f"  Active: {user.is_active}")
        print(f"  ID: {user.id}")
    
    print("\n" + "=" * 60)
    print("VERIFICATION COMPLETE")
    print("=" * 60)

if __name__ == '__main__':
    test_admin_user()
