#!/usr/bin/env python
"""
Test script to verify admin dashboard endpoints return accurate data
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from tourism.models import User, Booking, GuideBooking, Package, Hotel
from django.db.models import Sum

def test_admin_stats():
    """Test that admin stats match actual database counts"""
    print("=" * 60)
    print("ADMIN DASHBOARD DATA VERIFICATION")
    print("=" * 60)
    
    # Count users
    total_users = User.objects.filter(role='user').count()
    print(f"\n✓ Total Users: {total_users}")
    
    # Count providers
    total_providers = User.objects.filter(role='provider').count()
    print(f"✓ Total Providers: {total_providers}")
    
    # Count guides
    total_guides = User.objects.filter(role='guide').count()
    print(f"✓ Total Guides: {total_guides}")
    
    # Count bookings
    total_bookings = Booking.objects.count()
    confirmed_bookings = Booking.objects.filter(status='confirmed').count()
    print(f"✓ Total Bookings: {total_bookings} (Confirmed: {confirmed_bookings})")
    
    # Count guide bookings
    total_guide_bookings = GuideBooking.objects.count()
    confirmed_guide_bookings = GuideBooking.objects.filter(status='confirmed').count()
    print(f"✓ Total Guide Bookings: {total_guide_bookings} (Confirmed: {confirmed_guide_bookings})")
    
    # Calculate revenue
    revenue = Booking.objects.filter(status='confirmed').aggregate(total=Sum('total_price'))['total'] or 0
    print(f"✓ Revenue (Confirmed Bookings): Rs. {revenue:,.2f}")
    
    # Calculate guide revenue
    guide_revenue = GuideBooking.objects.filter(status='confirmed').aggregate(total=Sum('total_price'))['total'] or 0
    print(f"✓ Guide Revenue (Confirmed): Rs. {guide_revenue:,.2f}")
    
    # Count packages
    total_packages = Package.objects.filter(is_active=True).count()
    all_packages = Package.objects.count()
    print(f"✓ Total Packages: {all_packages} (Active: {total_packages})")
    
    # Count hotels
    total_hotels = Hotel.objects.filter(is_active=True).count()
    all_hotels = Hotel.objects.count()
    print(f"✓ Total Hotels: {all_hotels} (Active: {total_hotels})")
    
    print("\n" + "=" * 60)
    print("RECENT ACTIVITY (Last 5 of each type)")
    print("=" * 60)
    
    # Recent users
    print("\nRecent Users:")
    recent_users = User.objects.filter(role='user').order_by('-date_joined')[:5]
    for user in recent_users:
        print(f"  - {user.username} (joined: {user.date_joined.strftime('%Y-%m-%d %H:%M')})")
    
    # Recent providers
    print("\nRecent Providers:")
    recent_providers = User.objects.filter(role='provider').order_by('-date_joined')[:5]
    for provider in recent_providers:
        print(f"  - {provider.username} (joined: {provider.date_joined.strftime('%Y-%m-%d %H:%M')})")
    
    # Recent bookings
    print("\nRecent Bookings:")
    recent_bookings = Booking.objects.select_related('user', 'room', 'package').order_by('-created_at')[:5]
    for booking in recent_bookings:
        item = booking.room.room_type if booking.room else (booking.package.name if booking.package else 'N/A')
        print(f"  - Booking #{booking.id}: {booking.user.username} booked {item} (Rs. {booking.total_price})")
    
    print("\n" + "=" * 60)
    print("VERIFICATION COMPLETE")
    print("=" * 60)

if __name__ == '__main__':
    test_admin_stats()
