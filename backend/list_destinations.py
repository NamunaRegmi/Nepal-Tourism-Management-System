import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from tourism.models import Destination

print('Total destinations:', Destination.objects.count())
for d in Destination.objects.all().order_by('id'):
    print(d.id, d.name, d.image)
