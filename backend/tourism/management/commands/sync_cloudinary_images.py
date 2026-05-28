import os
import tempfile
import time
from urllib.parse import urlparse

import cloudinary.uploader
import requests as http_requests
from django.conf import settings
from django.core.management.base import BaseCommand

from tourism.models import Destination, Hotel, Package, Room, TourGuideProfile

DOWNLOAD_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (compatible; NepalTourismBot/1.0; educational project)',
    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
}
DOWNLOAD_TIMEOUT = 20
REQUEST_DELAY = 1.5  # seconds between Wikipedia downloads to avoid rate limiting


MODELS = [
    ('destinations', Destination),
    ('hotels', Hotel),
    ('rooms', Room),
    ('packages', Package),
    ('guides', TourGuideProfile),
]

FRONTEND_ASSETS_DIR = settings.BASE_DIR.parent / 'frontend' / 'public' / 'assets'
LOCAL_FALLBACK_IMAGES = {
    'Bhaktapur': 'bhaktapur.jpg',
    'Patan (Lalitpur)': 'patan_new.jpg',
    'Nagarkot': 'nagarkot_new.jpg',
    'Kathmandu Durbar Square': 'kathmandu.jpg',
    'Pokhara Paragliding': 'pokhara.jpg',
    'Tansen (Palpa)': 'bandipur.jpg',
    'Gorkha': 'bandipur.jpg',
    'Manaslu Circuit': 'manang.png',
    'Muktinath': 'manang.png',
    'Dolpo': 'rara.jpg',
    'Namobuddha': 'kathmandu.jpg',
}


class Command(BaseCommand):
    help = 'Uploads existing image URLs/files to Cloudinary and stores Cloudinary URLs in the image field.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Re-upload records even when image already points to Cloudinary.',
        )

    def handle(self, *args, **options):
        force = options['force']
        total_uploaded = 0
        total_skipped = 0
        total_failed = 0

        for folder, Model in MODELS:
            self.stdout.write(f'\n--- {Model.__name__} ---')
            records = Model.objects.all()

            for record in records:
                source = self.get_source(record, force)
                if not source:
                    total_skipped += 1
                    self.stdout.write(f'  SKIP #{record.pk}: no usable image source')
                    continue

                try:
                    result = self.upload_source(source, folder)
                    secure_url = result.get('secure_url')
                    if not secure_url:
                        raise ValueError('Cloudinary did not return a secure_url')

                    record.image = secure_url
                    if getattr(record, 'image_file', None):
                        record.image_file = None
                    record.save(update_fields=['image', 'image_file'] if hasattr(record, 'image_file') else ['image'])

                    total_uploaded += 1
                    self.stdout.write(self.style.SUCCESS(f'  OK   #{record.pk}: {secure_url}'))
                except Exception as exc:
                    fallback_source = self.get_local_fallback(record)
                    if not fallback_source:
                        total_failed += 1
                        self.stdout.write(self.style.ERROR(f'  FAIL #{record.pk}: {exc}'))
                        continue

                    try:
                        result = self.upload_source(fallback_source, folder)
                        secure_url = result.get('secure_url')
                        if not secure_url:
                            raise ValueError('Cloudinary did not return a secure_url')

                        record.image = secure_url
                        if getattr(record, 'image_file', None):
                            record.image_file = None
                        record.save(update_fields=['image', 'image_file'] if hasattr(record, 'image_file') else ['image'])

                        total_uploaded += 1
                        self.stdout.write(self.style.SUCCESS(f'  OK   #{record.pk}: {secure_url}'))
                    except Exception as fallback_exc:
                        total_failed += 1
                        self.stdout.write(
                            self.style.ERROR(
                                f'  FAIL #{record.pk}: {exc}; fallback failed: {fallback_exc}'
                            )
                        )

        self.stdout.write(
            self.style.SUCCESS(
                f'\nDone. Uploaded: {total_uploaded} | Skipped: {total_skipped} | Failed: {total_failed}'
            )
        )

    def get_source(self, record, force):
        image_url = (getattr(record, 'image', '') or '').strip()
        if image_url and (force or not self.is_cloudinary_url(image_url)):
            return image_url

        image_file = getattr(record, 'image_file', None)
        if image_file:
            try:
                file_url = image_file.url
                if file_url and (force or not self.is_cloudinary_url(file_url)):
                    return file_url
            except Exception:
                pass

            try:
                file_path = image_file.path
                if file_path and os.path.exists(file_path):
                    return file_path
            except Exception:
                pass

        return None

    def is_cloudinary_url(self, url):
        host = urlparse(url).netloc.lower()
        return 'cloudinary.com' in host or 'res.cloudinary.com' in host

    def upload_source(self, source, folder):
        # If source is a remote URL, download it locally first so we control
        # the request headers (avoids Wikipedia/CDN rate-limiting Cloudinary)
        if source.startswith('http://') or source.startswith('https://'):
            resp = http_requests.get(source, headers=DOWNLOAD_HEADERS, timeout=DOWNLOAD_TIMEOUT)
            resp.raise_for_status()

            ext = os.path.splitext(urlparse(source).path)[-1] or '.jpg'
            with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
                tmp.write(resp.content)
                tmp_path = tmp.name

            try:
                result = cloudinary.uploader.upload(
                    tmp_path,
                    folder=f'nepal-tourism/{folder}',
                    overwrite=True,
                    resource_type='image',
                )
            finally:
                os.unlink(tmp_path)

            time.sleep(REQUEST_DELAY)
            return result

        return cloudinary.uploader.upload(
            source,
            folder=f'nepal-tourism/{folder}',
            overwrite=True,
            resource_type='image',
        )

    def get_local_fallback(self, record):
        filename = LOCAL_FALLBACK_IMAGES.get(getattr(record, 'name', ''))
        if not filename:
            return None

        path = FRONTEND_ASSETS_DIR / filename
        if path.exists():
            return str(path)

        return None
