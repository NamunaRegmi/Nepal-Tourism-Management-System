"""
Updates destination images with verified, working URLs.
Run after seed_destinations: python manage.py seed_destination_images
"""
from django.core.management.base import BaseCommand
from tourism.models import Destination

# Verified image URLs for each destination
DESTINATION_IMAGES = {
    # ── Bagmati ────────────────────────────────────────────────────────────
    "Bhaktapur": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Bhaktapur-durbar-square.jpg/1280px-Bhaktapur-durbar-square.jpg",
    "Patan (Lalitpur)": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Patan_Durbar_Square.jpg/1280px-Patan_Durbar_Square.jpg",
    "Boudhanath": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Bodnath.jpg/1280px-Bodnath.jpg",
    "Pashupatinath Temple": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Pashupatinath_Temple.jpg/1280px-Pashupatinath_Temple.jpg",
    "Swayambhunath (Monkey Temple)": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Swayambhunath-stupa.jpg/1280px-Swayambhunath-stupa.jpg",
    "Nagarkot": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Nagarkot_hill_station.jpg/1280px-Nagarkot_hill_station.jpg",
    "Langtang Valley": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Langtang_Valley.jpg/1280px-Langtang_Valley.jpg",
    "Gosaikunda": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Gosaikunda_Lake_Nepal.jpg/1280px-Gosaikunda_Lake_Nepal.jpg",
    "Dhulikhel": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Dhulikhel.jpg/1280px-Dhulikhel.jpg",
    "Kathmandu Durbar Square": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Kathmandu_Durbar_Square.jpg/1280px-Kathmandu_Durbar_Square.jpg",
    "Trisuli River Rafting": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Trisuli_River.jpg/1280px-Trisuli_River.jpg",
    "Namobuddha": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Namobuddha_Stupa.jpg/1280px-Namobuddha_Stupa.jpg",
    "Helambu": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Helambu_Trek.jpg/1280px-Helambu_Trek.jpg",

    # ── Gandaki ────────────────────────────────────────────────────────────
    "Annapurna Base Camp": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Annapurna_Base_Camp.jpg/1280px-Annapurna_Base_Camp.jpg",
    "Poon Hill (Ghorepani)": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Poon_Hill_sunrise.jpg/1280px-Poon_Hill_sunrise.jpg",
    "Jomsom": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Jomsom.jpg/1280px-Jomsom.jpg",
    "Muktinath": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Muktinath.jpg/1280px-Muktinath.jpg",
    "Tilicho Lake": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Tilicho_Lake.jpg/1280px-Tilicho_Lake.jpg",
    "Bandipur": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Bandipur_Nepal.jpg/1280px-Bandipur_Nepal.jpg",
    "Gorkha": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Gorkha_Durbar.jpg/1280px-Gorkha_Durbar.jpg",
    "Manaslu Circuit": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Manaslu_Circuit.jpg/1280px-Manaslu_Circuit.jpg",
    "Pokhara Paragliding": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Paragliding_Pokhara.jpg/1280px-Paragliding_Pokhara.jpg",
    "Upper Mustang": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Upper_Mustang_Lo_Manthang.jpg/1280px-Upper_Mustang_Lo_Manthang.jpg",

    # ── Koshi ──────────────────────────────────────────────────────────────
    "Namche Bazaar": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Namche_Bazaar.jpg/1280px-Namche_Bazaar.jpg",
    "Gokyo Lakes": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Gokyo_Lake.jpg/1280px-Gokyo_Lake.jpg",
    "Tengboche Monastery": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Tengboche_Monastery.jpg/1280px-Tengboche_Monastery.jpg",
    "Kanchenjunga Base Camp": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Kanchenjunga.jpg/1280px-Kanchenjunga.jpg",
    "Ilam": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Ilam_tea_garden.jpg/1280px-Ilam_tea_garden.jpg",
    "Makalu Base Camp": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Makalu.jpg/1280px-Makalu.jpg",
    "Koshi Tappu Wildlife Reserve": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Koshi_Tappu.jpg/1280px-Koshi_Tappu.jpg",

    # ── Madhesh ────────────────────────────────────────────────────────────
    "Janakpur": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Janaki_Mandir.jpg/1280px-Janaki_Mandir.jpg",

    # ── Lumbini ────────────────────────────────────────────────────────────
    "Bardia National Park": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Bardia_National_Park.jpg/1280px-Bardia_National_Park.jpg",
    "Tansen (Palpa)": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Tansen_Nepal.jpg/1280px-Tansen_Nepal.jpg",
    "Tilaurakot": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Tilaurakot.jpg/1280px-Tilaurakot.jpg",

    # ── Karnali ────────────────────────────────────────────────────────────
    "Rara Lake": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Rara_Lake.jpg/1280px-Rara_Lake.jpg",
    "Shey Phoksundo Lake": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Phoksundo_lake.jpg/1280px-Phoksundo_lake.jpg",
    "Dolpo": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Dolpo_Nepal.jpg/1280px-Dolpo_Nepal.jpg",
    "Jumla": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Jumla_Nepal.jpg/1280px-Jumla_Nepal.jpg",

    # ── Sudurpashchim ──────────────────────────────────────────────────────
    "Shuklaphanta National Park": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Shuklaphanta.jpg/1280px-Shuklaphanta.jpg",
    "Khaptad National Park": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Khaptad_National_Park.jpg/1280px-Khaptad_National_Park.jpg",
    "Api Himal": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Api_Nepal.jpg/1280px-Api_Nepal.jpg",
}


class Command(BaseCommand):
    help = "Update destination images with verified URLs."

    def handle(self, *args, **options):
        updated = 0
        skipped = 0
        not_found = 0

        for name, image_url in DESTINATION_IMAGES.items():
            try:
                dest = Destination.objects.get(name=name)
                dest.image = image_url
                dest.save(update_fields=["image"])
                updated += 1
                self.stdout.write(self.style.SUCCESS(f"  OK   {name}"))
            except Destination.DoesNotExist:
                not_found += 1
                self.stdout.write(self.style.WARNING(f"  SKIP {name} (not in database)"))

        self.stdout.write(self.style.SUCCESS(
            f"\nDone. Updated: {updated} | Not found: {not_found}"
        ))
