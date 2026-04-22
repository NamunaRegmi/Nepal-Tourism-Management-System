#!/usr/bin/env python
"""
Seed sample tour packages for Nepal Tourism
"""

import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from tourism.models import User, Destination, Package

def seed_packages():
    print("\n" + "="*70)
    print("  Seeding Tour Packages")
    print("="*70 + "\n")
    
    # Get provider
    provider = User.objects.filter(role='provider').first()
    if not provider:
        print("❌ No provider found! Create a provider first.")
        return
    
    print(f"Using provider: {provider.username} ({provider.email})\n")
    
    # Get destinations
    destinations = {
        'Everest Base Camp': Destination.objects.filter(name__icontains='Everest').first(),
        'Annapurna': Destination.objects.filter(name__icontains='Annapurna').first() or Destination.objects.filter(name__icontains='Pokhara').first(),
        'Manaslu': Destination.objects.filter(name__icontains='Manaslu').first() or Destination.objects.filter(name__icontains='Manang').first(),
        'Kathmandu': Destination.objects.filter(name__icontains='Kathmandu').first(),
        'Pokhara': Destination.objects.filter(name__icontains='Pokhara').first(),
        'Chitwan': Destination.objects.filter(name__icontains='Chitwan').first(),
        'Lumbini': Destination.objects.filter(name__icontains='Lumbini').first(),
    }
    
    # Package data
    packages_data = [
        {
            'name': 'Everest Base Camp Trek',
            'description': 'Experience the ultimate Himalayan adventure with our 15-day Everest Base Camp trek. Stand at the foot of the world\'s highest mountain, witness breathtaking sunrise views from Kala Patthar, and immerse yourself in Sherpa culture.',
            'price': 85000,
            'duration_days': 15,
            'max_people': 12,
            'destination': 'Everest Region',
            'itinerary': 'Day 1: Fly to Lukla, trek to Phakding\nDay 2: Trek to Namche Bazaar\nDay 3: Acclimatization in Namche\nDay 4-8: Trek to EBC via Tengboche, Dingboche\nDay 9-15: Return trek to Lukla',
            'included_services': 'Accommodation, All meals, Experienced guide, Porter service, Flights, Permits, First aid kit',
            'image': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800',
            'destinations': ['Everest Base Camp', 'Kathmandu'],
        },
        {
            'name': 'Annapurna Base Camp Trek',
            'description': 'Journey through diverse landscapes from subtropical forests to alpine meadows on this 12-day trek to Annapurna Base Camp. Experience stunning mountain views, natural hot springs, and traditional Gurung villages.',
            'price': 65000,
            'duration_days': 12,
            'max_people': 15,
            'destination': 'Annapurna Region',
            'itinerary': 'Day 1: Drive to Nayapul, trek to Tikhedhunga\nDay 2-6: Trek to ABC via Ghorepani, Tadapani, Chhomrong\nDay 7-12: Return trek via Jhinu hot springs',
            'included_services': 'Tea house accommodation, All meals, Trekking guide, Porter, Permits, Transportation',
            'image': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
            'destinations': ['Annapurna', 'Pokhara', 'Kathmandu'],
        },
        {
            'name': 'Manaslu Circuit Trek',
            'description': 'Explore the remote and pristine Manaslu region on this 15-day circuit trek. Cross the challenging Larkya La Pass at 5,160m, discover ancient Buddhist monasteries, and enjoy spectacular views of Manaslu, the eighth highest mountain.',
            'price': 72000,
            'duration_days': 15,
            'max_people': 10,
            'destination': 'Manaslu Region',
            'itinerary': 'Day 1-7: Trek from Soti Khola to Samdo\nDay 8: Acclimatization day\nDay 9: Cross Larkya La Pass\nDay 10-15: Descend to Dharapani and drive to Kathmandu',
            'included_services': 'Camping/Lodge accommodation, All meals, Guide and porter, Restricted area permit, Transportation',
            'image': 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800',
            'destinations': ['Manaslu', 'Kathmandu'],
        },
        {
            'name': 'Kathmandu Valley Cultural Tour',
            'description': 'Discover the rich cultural heritage of Kathmandu Valley with visits to seven UNESCO World Heritage Sites. Explore ancient temples, royal palaces, and vibrant markets in this 5-day immersive cultural experience.',
            'price': 25000,
            'duration_days': 5,
            'max_people': 20,
            'destination': 'Kathmandu Valley',
            'itinerary': 'Day 1: Kathmandu Durbar Square, Swayambhunath\nDay 2: Patan and Bhaktapur\nDay 3: Pashupatinath, Boudhanath\nDay 4: Nagarkot sunrise, Changu Narayan\nDay 5: Shopping and departure',
            'included_services': 'Hotel accommodation, Breakfast, Cultural guide, Entrance fees, Private vehicle',
            'image': 'https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=800',
            'destinations': ['Kathmandu'],
        },
        {
            'name': 'Pokhara Adventure Package',
            'description': 'Experience the adventure capital of Nepal with paragliding, zip-lining, and boating on Phewa Lake. Enjoy stunning views of the Annapurna range and explore caves, waterfalls, and temples in this 4-day action-packed tour.',
            'price': 32000,
            'duration_days': 4,
            'max_people': 15,
            'destination': 'Pokhara',
            'itinerary': 'Day 1: Arrival, Phewa Lake boating\nDay 2: Paragliding, World Peace Pagoda\nDay 3: Sarangkot sunrise, zip-lining, caves\nDay 4: Davis Falls, departure',
            'included_services': 'Hotel accommodation, Breakfast, Adventure activities, Guide, Transportation',
            'image': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800',
            'destinations': ['Pokhara'],
        },
        {
            'name': 'Chitwan Jungle Safari',
            'description': 'Embark on an exciting wildlife adventure in Chitwan National Park. Spot one-horned rhinos, Bengal tigers, and exotic birds on elephant-back safaris, jungle walks, and canoe rides in this 3-day jungle experience.',
            'price': 18000,
            'duration_days': 3,
            'max_people': 20,
            'destination': 'Chitwan National Park',
            'itinerary': 'Day 1: Drive to Chitwan, village tour, sunset view\nDay 2: Jungle safari, canoe ride, elephant breeding center\nDay 3: Bird watching, Tharu cultural show, departure',
            'included_services': 'Resort accommodation, All meals, Safari activities, Naturalist guide, Park fees',
            'image': 'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=800',
            'destinations': ['Chitwan'],
        },
        {
            'name': 'Lumbini Pilgrimage Tour',
            'description': 'Visit the birthplace of Lord Buddha on this spiritual 3-day journey. Explore the sacred Maya Devi Temple, Ashoka Pillar, and international monasteries representing different Buddhist traditions from around the world.',
            'price': 15000,
            'duration_days': 3,
            'max_people': 25,
            'destination': 'Lumbini',
            'itinerary': 'Day 1: Fly to Bhairahawa, visit Maya Devi Temple\nDay 2: Explore monasteries, Ashoka Pillar, meditation\nDay 3: Tilaurakot, Kudan, return',
            'included_services': 'Hotel accommodation, Meals, Spiritual guide, Entrance fees, Transportation',
            'image': 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800',
            'destinations': ['Lumbini'],
        },
        {
            'name': 'Nepal Highlights Tour',
            'description': 'Experience the best of Nepal in 10 days! Combine cultural exploration in Kathmandu, adventure activities in Pokhara, and wildlife safari in Chitwan. Perfect for first-time visitors wanting a comprehensive Nepal experience.',
            'price': 55000,
            'duration_days': 10,
            'max_people': 15,
            'destination': 'Kathmandu, Pokhara, Chitwan',
            'itinerary': 'Day 1-3: Kathmandu sightseeing\nDay 4-6: Pokhara adventure\nDay 7-9: Chitwan safari\nDay 10: Return to Kathmandu',
            'included_services': 'All accommodation, Most meals, Guides, Activities, Domestic flights, Ground transportation',
            'image': 'https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=800',
            'destinations': ['Kathmandu', 'Pokhara', 'Chitwan'],
        },
        {
            'name': 'Annapurna Panorama Trek',
            'description': 'A shorter 7-day trek perfect for those with limited time. Enjoy spectacular mountain views, visit traditional villages, and experience the famous Poon Hill sunrise without the challenges of high-altitude trekking.',
            'price': 38000,
            'duration_days': 7,
            'max_people': 15,
            'destination': 'Annapurna Region',
            'itinerary': 'Day 1: Drive to Nayapul, trek to Tikhedhunga\nDay 2-3: Trek to Ghorepani\nDay 4: Poon Hill sunrise, trek to Tadapani\nDay 5-7: Return via Ghandruk',
            'included_services': 'Tea house accommodation, All meals, Guide, Porter, Permits, Transportation',
            'image': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
            'destinations': ['Annapurna', 'Pokhara'],
        },
        {
            'name': 'Upper Mustang Trek',
            'description': 'Explore the forbidden kingdom of Upper Mustang on this 12-day trek through a landscape resembling Tibet. Discover ancient cave dwellings, Buddhist monasteries, and the walled city of Lo Manthang in this unique cultural trek.',
            'price': 95000,
            'duration_days': 12,
            'max_people': 10,
            'destination': 'Upper Mustang',
            'itinerary': 'Day 1-2: Fly to Jomsom, trek to Kagbeni\nDay 3-6: Trek to Lo Manthang\nDay 7-8: Explore Lo Manthang\nDay 9-12: Return trek to Jomsom and fly out',
            'included_services': 'Lodge accommodation, All meals, Guide and porter, Special permits, Flights, Horse rental',
            'image': 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800',
            'destinations': ['Pokhara', 'Kathmandu'],
        },
    ]
    
    created_count = 0
    updated_count = 0
    
    for pkg_data in packages_data:
        # Get destination objects
        dest_names = pkg_data.pop('destinations')
        dest_objects = []
        for dest_name in dest_names:
            dest = destinations.get(dest_name)
            if dest:
                dest_objects.append(dest)
        
        if not dest_objects:
            print(f"⚠️  Skipping '{pkg_data['name']}' - no valid destinations found")
            continue
        
        # Check if package already exists
        existing = Package.objects.filter(name=pkg_data['name'], provider=provider).first()
        
        if existing:
            # Update existing package
            for key, value in pkg_data.items():
                setattr(existing, key, value)
            existing.is_active = True
            existing.save()
            existing.destinations.set(dest_objects)
            print(f"✓ Updated: {pkg_data['name']}")
            updated_count += 1
        else:
            # Create new package
            package = Package.objects.create(
                provider=provider,
                **pkg_data
            )
            package.destinations.set(dest_objects)
            print(f"✓ Created: {pkg_data['name']}")
            created_count += 1
    
    print("\n" + "="*70)
    print(f"Summary:")
    print(f"  Created: {created_count} packages")
    print(f"  Updated: {updated_count} packages")
    print(f"  Total: {Package.objects.filter(provider=provider, is_active=True).count()} active packages")
    print("="*70 + "\n")

if __name__ == '__main__':
    seed_packages()
