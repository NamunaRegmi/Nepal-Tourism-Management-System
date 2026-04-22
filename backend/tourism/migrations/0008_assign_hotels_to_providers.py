# Generated migration to assign existing hotels to providers

from django.db import migrations


def assign_hotels_to_providers(apps, schema_editor):
    """
    Assign all hotels without a provider to the first available provider.
    If no provider exists, create a default one.
    """
    User = apps.get_model('tourism', 'User')
    Hotel = apps.get_model('tourism', 'Hotel')
    
    # Get all hotels without a provider
    hotels_without_provider = Hotel.objects.filter(provider__isnull=True)
    
    if hotels_without_provider.exists():
        # Try to get an existing provider
        provider = User.objects.filter(role='provider').first()
        
        # If no provider exists, create a default one
        if not provider:
            provider = User.objects.create_user(
                username='default_provider',
                email='provider@example.com',
                password='changeme123',
                role='provider',
                first_name='Default',
                last_name='Provider'
            )
        
        # Assign all hotels without provider to this provider
        hotels_without_provider.update(provider=provider)


def reverse_assignment(apps, schema_editor):
    """
    Reverse operation - set provider to null for all hotels
    """
    Hotel = apps.get_model('tourism', 'Hotel')
    Hotel.objects.all().update(provider=None)


class Migration(migrations.Migration):

    dependencies = [
        ('tourism', '0007_alter_destination_image_alter_hotel_image'),
    ]

    operations = [
        migrations.RunPython(assign_hotels_to_providers, reverse_assignment),
    ]
