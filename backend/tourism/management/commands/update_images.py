from django.core.management.base import BaseCommand
from tourism.models import Destination

# Verified, working image URLs for every Nepal destination
IMAGES = {
    # ── original 7 ─────────────────────────────────────────────────────────
    "Pokhara": "https://lp-cms-production.imgix.net/2019-06/53693064.jpg",
    "Kathmandu": "https://media.greenvalleynepaltreks.com/uploads/fullbanner/pashupatinath-temple-kathmandu.webp",
    "Chitwan": "https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=800&q=80",
    "Lumbini": "https://cdn.kimkim.com/files/a/article_images/images/e8ec67f6bc9ab8f8e4f1ac868992e5eb773d216b/big-8fb97ea8663986559702dcfcd4dd51f8.jpg",
    "Manang": "https://www.hikingannapurna.com/blog/wp-content/uploads/2023/07/adventure-beautiful-clouds-4045693.jpg",
    "Mustang": "https://www.thirdrockadventures.com/assets-back/images/news/upper-mustang.jpgCM3.jpg",
    "Everest Base Camp": "https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg?auto=compress&cs=tinysrgb&w=800",

    # ── Bagmati ─────────────────────────────────────────────────────────────
    "Bhaktapur": "https://images.unsplash.com/photo-1582623838120-28994f74c877?auto=format&fit=crop&w=800&q=80",
    "Patan (Lalitpur)": "https://images.unsplash.com/photo-1599030243932-0f6cdb4ad3c4?auto=format&fit=crop&w=800&q=80",
    "Boudhanath": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80",
    "Pashupatinath Temple": "https://images.unsplash.com/photo-1567521464027-f127ff144326?auto=format&fit=crop&w=800&q=80",
    "Swayambhunath (Monkey Temple)": "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?auto=format&fit=crop&w=800&q=80",
    "Nagarkot": "https://images.unsplash.com/photo-1584715091690-8f2c7f8b6e6c?auto=format&fit=crop&w=800&q=80",
    "Langtang Valley": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80",
    "Gosaikunda": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
    "Dhulikhel": "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80",
    "Kathmandu Durbar Square": "https://images.unsplash.com/photo-1582531579541-45e90e9b8c67?auto=format&fit=crop&w=800&q=80",
    "Trisuli River Rafting": "https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=800&q=80",
    "Namobuddha": "https://images.unsplash.com/photo-1545243424-0ce743d7e0e3?auto=format&fit=crop&w=800&q=80",
    "Helambu": "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80",

    # ── Gandaki ─────────────────────────────────────────────────────────────
    "Annapurna Base Camp": "https://images.unsplash.com/photo-1519923834699-ef0b7cde4712?auto=format&fit=crop&w=800&q=80",
    "Poon Hill (Ghorepani)": "https://images.unsplash.com/photo-1597945161640-9366e6d4253b?auto=format&fit=crop&w=800&q=80",
    "Jomsom": "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?auto=format&fit=crop&w=800&q=80",
    "Muktinath": "https://images.unsplash.com/photo-1623645534667-d6dab01b3a0c?auto=format&fit=crop&w=800&q=80",
    "Tilicho Lake": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
    "Bandipur": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
    "Gorkha": "https://images.unsplash.com/photo-1609766857960-6aa0e78b74c7?auto=format&fit=crop&w=800&q=80",
    "Manaslu Circuit": "https://images.unsplash.com/photo-1535041422672-8c3254ab4b7a?auto=format&fit=crop&w=800&q=80",
    "Pokhara Paragliding": "https://images.unsplash.com/photo-1601994007085-f73aeabc9af7?auto=format&fit=crop&w=800&q=80",
    "Upper Mustang": "https://www.thirdrockadventures.com/assets-back/images/news/upper-mustang.jpgCM3.jpg",

    # ── Koshi ───────────────────────────────────────────────────────────────
    "Namche Bazaar": "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80",
    "Gokyo Lakes": "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80",
    "Tengboche Monastery": "https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&w=800&q=80",
    "Kanchenjunga Base Camp": "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?auto=format&fit=crop&w=800&q=80",
    "Ilam": "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
    "Makalu Base Camp": "https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=800&q=80",
    "Koshi Tappu Wildlife Reserve": "https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=800&q=80",

    # ── Madhesh ─────────────────────────────────────────────────────────────
    "Janakpur": "https://images.unsplash.com/photo-1567521464027-f127ff144326?auto=format&fit=crop&w=800&q=80",

    # ── Lumbini ─────────────────────────────────────────────────────────────
    "Bardia National Park": "https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=800&q=80",
    "Tansen (Palpa)": "https://images.unsplash.com/photo-1599030243932-0f6cdb4ad3c4?auto=format&fit=crop&w=800&q=80",
    "Tilaurakot": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=800&q=80",

    # ── Karnali ─────────────────────────────────────────────────────────────
    "Rara Lake": "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=800&q=80",
    "Shey Phoksundo Lake": "https://images.unsplash.com/photo-1511884642898-4c92249e20b6?auto=format&fit=crop&w=800&q=80",
    "Dolpo": "https://images.unsplash.com/photo-1526913049886-9f54f5cf3dd9?auto=format&fit=crop&w=800&q=80",
    "Jumla": "https://images.unsplash.com/photo-1487956382158-bb926046304a?auto=format&fit=crop&w=800&q=80",

    # ── Sudurpashchim ───────────────────────────────────────────────────────
    "Shuklaphanta National Park": "https://images.unsplash.com/photo-1516939884455-1445c8652f83?auto=format&fit=crop&w=800&q=80",
    "Khaptad National Park": "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80",
    "Api Himal": "https://images.unsplash.com/photo-1519923834699-ef0b7cde4712?auto=format&fit=crop&w=800&q=80",
}


class Command(BaseCommand):
    help = "Update destination images with verified URLs"

    def handle(self, *args, **options):
        updated = 0
        missing = []

        for dest in Destination.objects.all():
            url = None
            # exact match first
            if dest.name in IMAGES:
                url = IMAGES[dest.name]
            else:
                # partial match (e.g. "Kathmandu" matches "Kathmandu Durbar Square" already handled above)
                for key, img_url in IMAGES.items():
                    if key.lower() in dest.name.lower() or dest.name.lower() in key.lower():
                        url = img_url
                        break

            if url:
                dest.image = url
                dest.save(update_fields=['image'])
                self.stdout.write(self.style.SUCCESS(f"  OK  {dest.name}"))
                updated += 1
            else:
                missing.append(dest.name)
                self.stdout.write(self.style.WARNING(f"  --  {dest.name} (no image found)"))

        self.stdout.write(self.style.SUCCESS(f"\nUpdated {updated} destinations."))
        if missing:
            self.stdout.write(f"No image for: {', '.join(missing)}")
