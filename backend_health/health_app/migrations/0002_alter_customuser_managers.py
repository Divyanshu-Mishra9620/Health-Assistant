from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("health_app", "0001_initial"),
    ]

    operations = [
        migrations.AlterModelManagers(
            name="customuser",
            managers=[],
        ),
    ]
