"""
Fixes destination image URLs using the Wikimedia Special:FilePath redirect
format, which is reliable regardless of hash path changes.
Run: python manage.py fix_destination_images
Then: python manage.py sync_cloudinary_images
"""
import time
import tempfile
import os

import cloudinary.uploader
import requests
from django.core.management.base import BaseCommand
from tourism.models import Destination

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (compatible; NepalTourismBot/1.0; educational project)',
}

# Maps destination name → list of Wikimedia Commons filenames to try in order
# Wikipedia article titles to look up via the REST API thumbnail endpoint
WIKIPEDIA_ARTICLES = {
    "Koshi Tappu Wildlife Reserve": "Koshi_Tappu_Wildlife_Reserve",
    "Tilaurakot":                   "Tilaurakot",
    "Trisuli River Rafting":        "Trishuli_River",
    "Helambu":                      "Helambu",
}

IMAGES = {}

FILEPATH_BASE = "https://commons.wikimedia.org/wiki/Special:FilePath/{filename}?width=1280"


class Command(BaseCommand):
    help = "Download destination images from Wikimedia and upload to Cloudinary."

    def _try_upload(self, filenames, folder='nepal-tourism/destinations'):
        """Try each filename in order, return Cloudinary secure_url or None."""
        for filename in filenames:
            url = FILEPATH_BASE.format(filename=filename)
            try:
                resp = requests.get(url, headers=HEADERS, timeout=20, allow_redirects=True)
                resp.raise_for_status()
                ext = os.path.splitext(filename)[-1] or '.jpg'
                with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
                    tmp.write(resp.content)
                    tmp_path = tmp.name
                result = cloudinary.uploader.upload(
                    tmp_path, folder=folder, overwrite=True, resource_type='image',
                )
                os.unlink(tmp_path)
                time.sleep(1)
                return result['secure_url'], filename
            except Exception as exc:
                self.stdout.write(f"    tried {filename}: {exc}")
                time.sleep(0.3)
        return None, None

    def _get_wikipedia_image_url(self, article_title):
        """Use Wikipedia REST API to get the thumbnail URL for an article."""
        api_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{article_title}"
        resp = requests.get(api_url, headers=HEADERS, timeout=20)
        resp.raise_for_status()
        data = resp.json()
        # Returns originalimage or thumbnail URL
        img = data.get('originalimage') or data.get('thumbnail')
        if img:
            return img.get('source')
        return None

    def handle(self, *args, **options):
        uploaded = 0
        failed = 0

        # Handle filenames-based entries
        for name, filenames in IMAGES.items():
            try:
                dest = Destination.objects.get(name=name)
            except Destination.DoesNotExist:
                self.stdout.write(self.style.WARNING(f"  SKIP {name} — not in database"))
                continue

            if 'cloudinary.com' in (dest.image or ''):
                self.stdout.write(f"  SKIP {name} — already on Cloudinary")
                continue

            secure_url, used_file = self._try_upload(filenames)
            if secure_url:
                dest.image = secure_url
                dest.save(update_fields=['image'])
                uploaded += 1
                self.stdout.write(self.style.SUCCESS(f"  OK   {name} ({used_file})"))
            else:
                failed += 1
                self.stdout.write(self.style.ERROR(f"  FAIL {name} — all filenames failed"))

        # Handle Wikipedia API lookup entries
        for name, article in WIKIPEDIA_ARTICLES.items():
            try:
                dest = Destination.objects.get(name=name)
            except Destination.DoesNotExist:
                self.stdout.write(self.style.WARNING(f"  SKIP {name} — not in database"))
                continue

            if 'cloudinary.com' in (dest.image or ''):
                self.stdout.write(f"  SKIP {name} — already on Cloudinary")
                continue

            try:
                img_url = self._get_wikipedia_image_url(article)
                if not img_url:
                    raise ValueError("No image found in Wikipedia API response")

                # Download the image locally then upload to Cloudinary
                resp = requests.get(img_url, headers=HEADERS, timeout=20)
                resp.raise_for_status()
                ext = os.path.splitext(img_url.split('?')[0])[-1] or '.jpg'
                with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
                    tmp.write(resp.content)
                    tmp_path = tmp.name

                result = cloudinary.uploader.upload(
                    tmp_path, folder='nepal-tourism/destinations',
                    overwrite=True, resource_type='image',
                )
                os.unlink(tmp_path)
                dest.image = result['secure_url']
                dest.save(update_fields=['image'])
                uploaded += 1
                self.stdout.write(self.style.SUCCESS(f"  OK   {name} (Wikipedia API)"))
                time.sleep(1)
            except Exception as exc:
                failed += 1
                self.stdout.write(self.style.ERROR(f"  FAIL {name}: {exc}"))

        self.stdout.write(self.style.SUCCESS(
            f"\nDone. Uploaded: {uploaded} | Failed: {failed}"
        ))
