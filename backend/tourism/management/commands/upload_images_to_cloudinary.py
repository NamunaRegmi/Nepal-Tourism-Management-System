import os
from django.core.management.base import BaseCommand
from django.core.files import File
from tourism.models import Destination, Hotel, Room, Package, TourGuideProfile


MODELS = [
    ('Destination', Destination),
    ('Hotel', Hotel),
    ('Room', Room),
    ('Package', Package),
    ('TourGuideProfile', TourGuideProfile),
]


class Command(BaseCommand):
    help = 'Re-uploads existing local image_file fields to Cloudinary'

    def handle(self, *args, **options):
        total_success = 0
        total_failed = 0

        for model_name, Model in MODELS:
            self.stdout.write(f'\n--- {model_name} ---')
            records = Model.objects.exclude(image_file='').exclude(image_file__isnull=True)
            self.stdout.write(f'Found {records.count()} records with image_file')

            for record in records:
                local_path = record.image_file.path if hasattr(record.image_file, 'path') else None

                if not local_path or not os.path.exists(local_path):
                    self.stdout.write(self.style.WARNING(
                        f'  [{model_name} #{record.pk}] Local file not found: {record.image_file.name}'
                    ))
                    total_failed += 1
                    continue

                try:
                    with open(local_path, 'rb') as f:
                        filename = os.path.basename(local_path)
                        record.image_file.save(filename, File(f), save=True)
                    self.stdout.write(self.style.SUCCESS(
                        f'  [{model_name} #{record.pk}] Uploaded: {filename}'
                    ))
                    total_success += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(
                        f'  [{model_name} #{record.pk}] Failed: {e}'
                    ))
                    total_failed += 1

        self.stdout.write(f'\nDone. Uploaded: {total_success}  |  Failed/Skipped: {total_failed}')
