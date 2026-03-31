import os
import django
import sys

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from tourism.models import Hotel, User, Destination

print(f"Total Hotels: {Hotel.objects.count()}")
print(f"Total Destinations: {Destination.objects.count()}")
print(f"Total Users: {User.objects.count()}")
for h in Hotel.objects.all():
    print(f"Hotel: {h.name}, Provider: {h.provider.username if h.provider else 'None'}")
