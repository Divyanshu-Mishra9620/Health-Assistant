import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        (
            "health_app",
            "0005_alter_chatlog_options_rename_prompt_chatlog_message_and_more",
        ),
    ]

    operations = [
        migrations.AddField(
            model_name="chatlog",
            name="session_id",
            field=models.CharField(
                blank=True, db_index=True, max_length=100, null=True
            ),
        ),
        migrations.CreateModel(
            name="ConversationMemory",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("session_id", models.CharField(db_index=True, max_length=100)),
                (
                    "role",
                    models.CharField(
                        choices=[("user", "User"), ("assistant", "Assistant")],
                        max_length=20,
                    ),
                ),
                ("content", models.TextField()),
                ("timestamp", models.DateTimeField(auto_now_add=True)),
                ("vectorized", models.BooleanField(default=False)),
                (
                    "chat_log",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="health_app.chatlog",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["timestamp"],
                "indexes": [
                    models.Index(
                        fields=["user", "session_id"],
                        name="health_app__user_id_c22f6f_idx",
                    ),
                    models.Index(
                        fields=["user", "timestamp"],
                        name="health_app__user_id_2a9eaf_idx",
                    ),
                ],
            },
        ),
    ]
