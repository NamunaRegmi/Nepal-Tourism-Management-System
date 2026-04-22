# Generated migration to make hotel provider field required

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('tourism', '0008_assign_hotels_to_providers'),
    ]

    operations = [
        migrations.AlterField(
            model_name='hotel',
            name='provider',
            field=models.ForeignKey(
                limit_choices_to={'role': 'provider'},
                on_delete=django.db.models.deletion.CASCADE,
                related_name='hotels',
                to=settings.AUTH_USER_MODEL
            ),
        ),
    ]
