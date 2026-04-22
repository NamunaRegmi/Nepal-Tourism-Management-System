#!/usr/bin/env python
"""
Show which hotels belong to which provider
"""

import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from tourism.models import User, Hotel

def show_hotels():
    print("\n" + "="*70)
    print("  Provider Hotels Overview")
    print("="*70 + "\n")
    
    providers = User.objects.filter(role='provider')
    
    if not providers.exists():
        print("No providers found!")
        return
    
    for provider in providers:
        hotels = Hotel.objects.filter(provider=provider)
        print(f"Provider: {provider.username} ({provider.email})")
        print(f"ID: {provider.id}")
        print(f"Total Hotels: {hotels.count()}")
        print("-" * 70)
        
        if hotels.exists():
            for hotel in hotels:
                dest_name = hotel.destination.name if hotel.destination else "Unknown"
                print(f"  • {hotel.name}")
                print(f"    Location: {dest_name}")
                print(f"    Price: Rs. {hotel.price_per_night}/night")
                print(f"    Rooms: {hotel.total_rooms}")
                print(f"    Active: {'Yes' if hotel.is_active else 'No'}")
                print()
        else:
            print("  (No hotels)\n")
        
        print("="*70 + "\n")
    
    # Summary
    total_hotels = Hotel.objects.count()
    total_providers = providers.count()
    print(f"Summary:")
    print(f"  Total Providers: {total_providers}")
    print(f"  Total Hotels: {total_hotels}")
    print(f"  Average Hotels per Provider: {total_hotels / total_providers if total_providers > 0 else 0:.1f}")
    print("\n" + "="*70 + "\n")

if __name__ == '__main__':
    show_hotels()
