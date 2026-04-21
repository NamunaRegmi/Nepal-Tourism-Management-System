import os
import django
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from tourism.models import User, Destination, Hotel, Room, Package, TourGuideProfile

def create_users():
    print("Creating users...")
    provider, _ = User.objects.get_or_create(username='provider', email='provider@example.com', role='provider')
    if _:
        provider.set_password('password123')
        provider.save()
    
    admin, _ = User.objects.get_or_create(username='admin', email='admin@example.com', role='admin', is_staff=True, is_superuser=True)
    if _:
        admin.set_password('password123')
        admin.save()

    guide_specs = [
        {
            "username": "regmibipul2015",
            "email": "regmibipul2015@gmail.com",
            "first_name": "Bipul",
            "last_name": "Regmi",
        },
        {
            "username": "pasang.guide",
            "email": "pasang.guide@example.com",
            "first_name": "Pasang",
            "last_name": "Sherpa",
        },
        {
            "username": "sita.guide",
            "email": "sita.guide@example.com",
            "first_name": "Sita",
            "last_name": "Gurung",
        },
    ]

    guides = []
    for spec in guide_specs:
        guide, created = User.objects.get_or_create(
            username=spec["username"],
            defaults={
                "email": spec["email"],
                "role": "guide",
                "first_name": spec["first_name"],
                "last_name": spec["last_name"],
            },
        )
        changed = False
        if guide.role != 'guide':
            guide.role = 'guide'
            changed = True
        if spec["email"] and guide.email != spec["email"]:
            guide.email = spec["email"]
            changed = True
        if spec["first_name"] and guide.first_name != spec["first_name"]:
            guide.first_name = spec["first_name"]
            changed = True
        if spec["last_name"] and guide.last_name != spec["last_name"]:
            guide.last_name = spec["last_name"]
            changed = True
        if created:
            guide.set_password('password123')
            changed = True
        if changed:
            guide.save()
        guides.append(guide)
        
    return provider, guides

def create_destinations(provider):
    print("Creating destinations...")
    destinations_data = [
        {
            "name": "Pokhara",
            "description": "Pokhara is a city on Phewa Lake, in central Nepal. It's known as a gateway to the Annapurna Circuit, a popular trail in the Himalayas. Highlights include boating on Phewa Lake, visiting the World Peace Pagoda, and paragliding from Sarangkot.",
            "province": "Gandaki",
            "best_time_to_visit": "September to November",
            "image": "https://lp-cms-production.imgix.net/2019-06/53693064.jpg",
            "latitude": 28.2096,
            "longitude": 83.9856,
            "highlights": ["Phewa Lake Boating", "World Peace Pagoda", "Sarangkot Sunrise", "Paragliding", "Mahendra Cave"]
        },
        {
            "name": "Kathmandu",
            "description": "Kathmandu, Nepal's capital, is set in a valley surrounded by the Himalayan mountains. It's known for its historic sites and ancient temples like Pashupatinath and Boudhanath Stupa.",
            "province": "Bagmati",
            "best_time_to_visit": "October to December",
            "image": "https://media.greenvalleynepaltreks.com/uploads/fullbanner/pashupatinath-temple-kathmandu.webp",
            "latitude": 27.7172,
            "longitude": 85.3240,
            "highlights": ["Pashupatinath Temple", "Boudhanath Stupa", "Swayambhunath", "Durbar Square", "Thamel Nightlife"]
        },
        {
            "name": "Chitwan",
            "description": "Chitwan National Park is a preserved area in the Terai Lowlands of south-central Nepal, known for its biodiversity including one-horned rhinos and Bengal tigers.",
            "province": "Bagmati", 
            "best_time_to_visit": "October to March",
            "image": "https://wallpaperbat.com/img/33765-shafir-image-night-kathmandu.jpg",
            "latitude": 27.5341,
            "longitude": 84.4525,
            "highlights": ["Jungle Safari", "Canoe Ride", "Elephant Breeding Center", "Tharu Cultural Dance", "Bird Watching"]
        },
        {
            "name": "Lumbini",
            "description": "Lumbini is a Buddhist pilgrimage site in the Rupandehi District of Nepal. It is the birthplace of Siddhartha Gautama, who became Buddha.",
            "province": "Lumbini",
            "best_time_to_visit": "October to November",
            "image": "https://images.pexels.com/photos/14367176/pexels-photo-14367176.jpeg?auto=compress&cs=tinysrgb&h=627&fit=crop&w=1200",
            "latitude": 27.4776,
            "longitude": 83.2736,
            "highlights": ["Maya Devi Temple", "World Peace Pagoda", "Monastic Zone", "Eternal Peace Flame", "Lumbini Garden"]
        },
        {
            "name": "Manang",
            "description": "Manang is a mountain town on the Annapurna Circuit trail. It offers stunning views of the surrounding peaks and is a gateway for high-altitude trekking toward Thorong La Pass.",
            "province": "Gandaki",
            "best_time_to_visit": "April to June, September to November",
            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Manang_Village_Annapurna_Circuit.jpg/1280px-Manang_Village_Annapurna_Circuit.jpg",
            "latitude": 28.6657,
            "longitude": 84.0223,
            "highlights": ["Thorong La Pass", "Gangapurna Lake", "Ice Lake Trek", "Ancient Monasteries", "High Altitude Views"]
        },
        {
            "name": "Mustang",
            "description": "Mustang is a remote region in northern Nepal. It's famous for its dramatic desert-like landscapes, canyons, and ancient Tibetan culture in Lo Manthang.",
            "province": "Gandaki",
            "best_time_to_visit": "March to May, September to November",
            "image": "https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?w=800",
            "latitude": 28.9985,
            "longitude": 83.8473,
            "highlights": ["Lo Manthang", "Muktinath Temple", "Kali Gandaki Gorge", "Sky Caves", "Ancient Tibetan Culture"]
        },
        {
            "name": "Everest Base Camp",
            "description": "Everest Base Camp is the ultimate trekking destination offering breathtaking views of Mount Everest. The journey through the Khumbu valley is an experience of a lifetime.",
            "province": "Koshi",
            "best_time_to_visit": "March to May, September to November",
            "image": "https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg?auto=compress&cs=tinysrgb&w=800",
            "latitude": 28.0044,
            "longitude": 86.8528,
            "highlights": ["Kala Patthar View", "Khumbu Glacier", "Namche Bazaar", "Tengboche Monastery", "Everest View"]
        }
    ]

    created_destinations = []
    for data in destinations_data:
        dest, created = Destination.objects.update_or_create(
            name=data["name"],
            defaults=data
        )
        if created:
            print(f"Created destination: {dest.name}")
        else:
            print(f"Updated destination: {dest.name}")
        created_destinations.append(dest)
    return created_destinations

def create_hotels(destinations, provider):
    print("Creating hotels...")
    hotel_data = {
        "Kathmandu": [
            {"name": "Hotel Yak & Yeti", "price": 12000, "rating": 4.8, "desc": "Kathmandu's most iconic 5-star hotel situated in the heart of the city."},
            {"name": "Kathmandu Guest House", "price": 5500, "rating": 4.3, "desc": "Historic and charming hotel in the lively Thamel district."},
            {"name": "The Malla Hotel", "price": 8500, "rating": 4.5, "desc": "Elegant hotel with beautiful gardens near the royal palace."},
        ],
        "Pokhara": [
            {"name": "Hotel Barahi", "price": 9000, "rating": 4.7, "desc": "Lakeside luxury with stunning views of Phewa Lake and the Annapurna range."},
            {"name": "Temple Tree Resort", "price": 11000, "rating": 4.6, "desc": "Peaceful lakeside resort with lush gardens and premium suites."},
            {"name": "Waterfront Resort", "price": 7500, "rating": 4.4, "desc": "Boutique resort directly on the Phewa Lake waterfront."},
        ],
        "Chitwan": [
            {"name": "Green Park Chitwan", "price": 6000, "rating": 4.3, "desc": "Comfortable stay near the national park entrance with jungle views."},
            {"name": "Jungle Villa Resort", "price": 8000, "rating": 4.6, "desc": "Premium resort blending into the jungle for an authentic safari experience."},
        ],
        "Lumbini": [
            {"name": "Hotel Pawan Palace", "price": 4500, "rating": 4.0, "desc": "Comfortable hotel located near the sacred Lumbini garden."},
            {"name": "Buddha Maya Garden Hotel", "price": 7000, "rating": 4.5, "desc": "Serene hotel inspired by Buddhist architecture, steps from Maya Devi Temple."},
        ],
        "Manang": [
            {"name": "Gangapurna Hotel", "price": 3500, "rating": 4.1, "desc": "Cozy mountain lodge with views of Gangapurna peak on the Annapurna Circuit."},
        ],
        "Mustang": [
            {"name": "Hotel Mustang Holiday", "price": 5000, "rating": 4.2, "desc": "Traditional stone lodge in Lo Manthang with authentic Tibetan décor."},
        ],
        "Everest Base Camp": [
            {"name": "Everest View Lodge", "price": 4000, "rating": 4.3, "desc": "High-altitude teahouse with breathtaking views of Mount Everest."},
        ],
    }

    images = [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ]

    created_hotels = []
    for dest in destinations:
        hotels = hotel_data.get(dest.name, [])
        for h in hotels:
            hotel, created = Hotel.objects.get_or_create(
                name=h["name"],
                destination=dest,
                defaults={
                    "description": h["desc"],
                    "address": f"Near {dest.name} Center",
                    "price_per_night": h["price"],
                    "image": random.choice(images),
                    "provider": provider,
                    "rating": h["rating"],
                    "amenities": ["WiFi", "Parking", "Restaurant", "AC"]
                }
            )
            if created:
                print(f"Created hotel: {hotel.name}")
            created_hotels.append(hotel)
    return created_hotels

def create_rooms(hotels):
    print("Creating rooms...")
    room_types = ["Standard", "Deluxe", "Suite"]
    
    for hotel in hotels:
        for r_type in room_types:
            Room.objects.get_or_create(
                hotel=hotel,
                room_type=r_type,
                defaults={
                    "price": hotel.price_per_night + (50 if r_type == "Deluxe" else 100 if r_type == "Suite" else 0),
                    "capacity": 2 if r_type == "Standard" else 3 if r_type == "Deluxe" else 4,
                    # quantity removed
                    "description": f"{r_type} room with all basic amenities."
                }
            )
    print("Rooms created.")

def create_packages(provider):
    print("Creating packages...")
    packages_data = [
        {
            "name": "Annapurna Base Camp Trek",
            "description": "10 days trek to the base of Mt. Annapurna.",
            "price": 1200.00,
            "duration_days": 10,
            "image": "https://images.unsplash.com/photo-1533130061792-649d45df8dd5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
        },
        {
            "name": "Chitwan Jungle Safari",
            "description": "3 days filled with wildlife adventures.",
            "price": 300.00,
            "duration_days": 3,
            "image": "https://images.unsplash.com/photo-1589492477829-5e65395b66cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
        }
    ]
    
    for data in packages_data:
        package, created = Package.objects.get_or_create(
            name=data["name"],
            defaults={
                "description": data["description"],
                "price": data["price"],
                "duration_days": data["duration_days"],
                "image": data["image"],
                "provider": provider
            }
        )
        if created:
            print(f"Created package: {package.name}")

def create_guide_profiles(guides, destinations):
    print("Creating guide profiles...")

    destination_map = {destination.name: destination for destination in destinations}
    guide_profiles = [
        {
            "username": "regmibipul2015",
            "headline": "Kathmandu heritage and cultural walking guide",
            "bio": "Cultural guide focused on Kathmandu Valley heritage, temples, food streets, and day hikes around the valley.",
            "languages": ["English", "Nepali", "Hindi"],
            "years_experience": 4,
            "daily_rate": 5500,
            "certifications": "Licensed cultural guide. First-aid trained.",
            "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80",
            "destinations": ["Kathmandu", "Pokhara", "Lumbini"],
        },
        {
            "username": "pasang.guide",
            "headline": "Everest and high-altitude trekking specialist",
            "bio": "Mountain guide for Everest region treks, acclimatization routes, teahouse planning, and high-altitude safety.",
            "languages": ["English", "Nepali", "Sherpa"],
            "years_experience": 9,
            "daily_rate": 9500,
            "certifications": "NMA trekking guide. Wilderness first responder.",
            "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80",
            "destinations": ["Everest Base Camp", "Manang", "Mustang"],
        },
        {
            "username": "sita.guide",
            "headline": "Wildlife, village stays, and family-friendly Nepal tours",
            "bio": "Guides slow travel experiences including Chitwan safaris, Pokhara day tours, and village-based itineraries.",
            "languages": ["English", "Nepali"],
            "years_experience": 6,
            "daily_rate": 6200,
            "certifications": "Nature interpretation training. Community tourism facilitator.",
            "image": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80",
            "destinations": ["Chitwan", "Pokhara", "Lumbini"],
        },
    ]

    guide_map = {guide.username: guide for guide in guides}
    for spec in guide_profiles:
        user = guide_map.get(spec["username"])
        if not user:
            continue

        profile, _ = TourGuideProfile.objects.update_or_create(
            user=user,
            defaults={
                "headline": spec["headline"],
                "bio": spec["bio"],
                "languages": spec["languages"],
                "years_experience": spec["years_experience"],
                "daily_rate": spec["daily_rate"],
                "certifications": spec["certifications"],
                "image": spec["image"],
                "is_active": True,
            },
        )
        profile.destinations.set(
            [destination_map[name] for name in spec["destinations"] if name in destination_map]
        )
        print(f"Upserted guide profile: {user.username}")

if __name__ == '__main__':
    provider, guides = create_users()
    destinations = create_destinations(provider)
    hotels = create_hotels(destinations, provider)
    create_rooms(hotels)
    create_packages(provider)
    create_guide_profiles(guides, destinations)
    print("Seed data created successfully!")
