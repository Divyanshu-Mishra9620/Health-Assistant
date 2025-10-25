from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("health_app", "0003_alter_customuser_options_and_more"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="customuser",
            name="username",
        ),
    ]
