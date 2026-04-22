# Generated migration for enhanced package fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tourism', '0009_make_hotel_provider_required'),
    ]

    operations = [
        migrations.AddField(
            model_name='package',
            name='max_people',
            field=models.IntegerField(default=10, help_text='Maximum number of people allowed'),
        ),
        migrations.AddField(
            model_name='package',
            name='destination',
            field=models.CharField(blank=True, max_length=200, help_text='Primary destination name'),
        ),
        migrations.AddField(
            model_name='package',
            name='itinerary',
            field=models.TextField(blank=True, help_text='Day-by-day itinerary'),
        ),
        migrations.AddField(
            model_name='package',
            name='included_services',
            field=models.TextField(blank=True, help_text='Services included in the package'),
        ),
        migrations.AddField(
            model_name='package',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AlterField(
            model_name='package',
            name='destinations',
            field=models.ManyToManyField(blank=True, related_name='packages', to='tourism.destination'),
        ),
    ]
