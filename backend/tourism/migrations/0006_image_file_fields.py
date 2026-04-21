from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tourism', '0005_tour_guide_feature'),
    ]

    operations = [
        migrations.AddField(
            model_name='destination',
            name='image_file',
            field=models.ImageField(blank=True, help_text='Uploaded image file', null=True, upload_to='destinations/'),
        ),
        migrations.AddField(
            model_name='hotel',
            name='image_file',
            field=models.ImageField(blank=True, help_text='Uploaded image file', null=True, upload_to='hotels/'),
        ),
        migrations.AddField(
            model_name='package',
            name='image_file',
            field=models.ImageField(blank=True, null=True, upload_to='packages/'),
        ),
        migrations.AddField(
            model_name='room',
            name='image_file',
            field=models.ImageField(blank=True, null=True, upload_to='rooms/'),
        ),
        migrations.AddField(
            model_name='tourguideprofile',
            name='image_file',
            field=models.ImageField(blank=True, null=True, upload_to='guides/'),
        ),
    ]
