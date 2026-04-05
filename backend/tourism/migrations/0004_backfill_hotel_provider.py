from django.db import migrations


def assign_orphan_hotels_to_first_provider(apps, schema_editor):
    User = apps.get_model('tourism', 'User')
    Hotel = apps.get_model('tourism', 'Hotel')
    orphans = Hotel.objects.filter(provider__isnull=True)
    if not orphans.exists():
        return
    providers = list(User.objects.filter(role='provider').order_by('id'))
    if not providers:
        return
    first = providers[0]
    orphans.update(provider_id=first.id)


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('tourism', '0003_booking_payment_method_booking_payment_status'),
    ]

    operations = [
        migrations.RunPython(assign_orphan_hotels_to_first_provider, noop_reverse),
    ]
