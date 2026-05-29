import os
import threading
import time

from django.apps import AppConfig


def _refresh_loop():
    """
    Background thread: warms the Django in-memory cache on startup,
    then refreshes every 90 s so the 120 s TTL never expires for users.
    """
    time.sleep(4)  # wait for Django ORM to finish initialising

    while True:
        try:
            from django.core.cache import cache
            from django.db import models as _m
            from tourism.models import Destination, Hotel, Package, TourGuideProfile
            from tourism.serializers import (
                DestinationSerializer, HotelListSerializer,
                PackageSerializer, TourGuideProfileSerializer,
            )

            # Destinations
            destinations = Destination.objects.filter(is_active=True).annotate(
                hotels_count=_m.Count(
                    'hotels',
                    filter=_m.Q(hotels__is_active=True),
                    distinct=True,
                )
            )
            cache.set('destinations_list', DestinationSerializer(destinations, many=True).data, 120)

            # Hotels — all + per property_type
            hotels_qs = Hotel.objects.filter(is_active=True).select_related('destination', 'provider')
            cache.set('all_hotels_', HotelListSerializer(hotels_qs, many=True).data, 120)
            for pt in ['hotel', 'villa', 'resort', 'homestay']:
                cache.set(f'all_hotels_{pt}', HotelListSerializer(hotels_qs.filter(property_type=pt), many=True).data, 120)

            # Packages
            pkg_qs = Package.objects.filter(is_active=True).select_related('provider').prefetch_related('destinations')
            cache.set('packages_list_', PackageSerializer(pkg_qs, many=True).data, 120)

            # Guides
            guide_qs = TourGuideProfile.objects.filter(is_active=True).select_related('user').prefetch_related('destinations')
            cache.set('guides_list_', TourGuideProfileSerializer(guide_qs, many=True).data, 120)

            print('[cache-warmer] all caches refreshed')

        except Exception as exc:
            print(f'[cache-warmer] refresh failed: {exc}')

        time.sleep(90)  # refresh before 120 s TTL expires


class TourismConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'tourism'

    def ready(self):
        # Django dev server runs ready() twice (reloader + main process).
        # RUN_MAIN=true is set only in the actual main process.
        if os.environ.get('RUN_MAIN') == 'true':
            t = threading.Thread(target=_refresh_loop, daemon=True, name='cache-warmer')
            t.start()
