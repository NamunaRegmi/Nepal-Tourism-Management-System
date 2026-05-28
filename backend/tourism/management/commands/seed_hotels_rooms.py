from decimal import Decimal

from django.core.management.base import BaseCommand

from tourism.models import Destination, Hotel, Room, User


HOTEL_TYPES = [
    {
        'suffix': 'Heritage Hotel',
        'description': 'A comfortable stay close to the main attractions, with warm hospitality and easy local access.',
        'rating': Decimal('4.4'),
        'price_offset': 0,
        'amenities': ['WiFi', 'Restaurant', 'Airport pickup', 'Hot shower'],
    },
    {
        'suffix': 'View Resort',
        'description': 'A scenic property for relaxed travellers, offering peaceful rooms and guided local experiences.',
        'rating': Decimal('4.6'),
        'price_offset': 1800,
        'amenities': ['WiFi', 'Parking', 'Restaurant', 'Travel desk'],
    },
]

ROOM_TYPES = [
    ('Standard', 2, 0),
    ('Deluxe', 3, 1200),
    ('Suite', 4, 2600),
]


class Command(BaseCommand):
    help = 'Seeds active hotels and rooms for every destination.'

    def handle(self, *args, **options):
        provider, created = User.objects.get_or_create(
            username='provider',
            defaults={
                'email': 'provider@example.com',
                'role': 'provider',
                'first_name': 'Demo',
                'last_name': 'Provider',
            },
        )
        if created:
            provider.set_password('password123')
            provider.save(update_fields=['password'])
        elif provider.role != 'provider':
            provider.role = 'provider'
            provider.save(update_fields=['role'])

        hotels_created = 0
        hotels_updated = 0
        rooms_created = 0

        destinations = Destination.objects.filter(is_active=True).order_by('name')
        for index, destination in enumerate(destinations):
            base_price = Decimal(3200 + (index % 7) * 650)
            for hotel_type in HOTEL_TYPES:
                hotel_name = f'{destination.name} {hotel_type["suffix"]}'
                hotel, created = Hotel.objects.update_or_create(
                    name=hotel_name,
                    destination=destination,
                    defaults={
                        'provider': provider,
                        'description': f'{hotel_type["description"]} Ideal for exploring {destination.name}.',
                        'image': destination.image_url or destination.image or '',
                        'rating': hotel_type['rating'],
                        'price_per_night': base_price + Decimal(hotel_type['price_offset']),
                        'currency': 'NPR',
                        'amenities': hotel_type['amenities'],
                        'contact_number': '+977-9800000000',
                        'email': 'provider@example.com',
                        'address': f'Near {destination.name} Center',
                        'total_rooms': 18,
                        'is_active': True,
                    },
                )

                if created:
                    hotels_created += 1
                else:
                    hotels_updated += 1

                for room_type, capacity, offset in ROOM_TYPES:
                    _, room_created = Room.objects.update_or_create(
                        hotel=hotel,
                        room_type=room_type,
                        defaults={
                            'price': hotel.price_per_night + Decimal(offset),
                            'capacity': capacity,
                            'description': f'{room_type} room at {hotel.name} with essential comforts.',
                            'image': hotel.image,
                            'is_available': True,
                        },
                    )
                    if room_created:
                        rooms_created += 1

        self.stdout.write(self.style.SUCCESS(
            f'Done. Hotels created: {hotels_created}, updated: {hotels_updated}, rooms created: {rooms_created}.'
        ))
