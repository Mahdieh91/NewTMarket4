from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("negotiations", "0001_initial"),
        ("products", "0003_alter_supplyimage_options_supply_supply_type_and_more"),
        migrations.swappable_dependency(
            settings.AUTH_USER_MODEL
        ),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],

            state_operations=[
                # =====================================================
                # Negotiation
                # =====================================================

                migrations.RemoveField(
                    model_name="negotiation",
                    name="product",
                ),

                migrations.AddField(
                    model_name="negotiation",
                    name="supply",
                    field=models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="negotiations",
                        to="products.supply",
                    ),
                ),

                migrations.AddField(
                    model_name="negotiation",
                    name="context_meta",
                    field=models.JSONField(
                        default=dict,
                    ),
                ),

                migrations.AddField(
                    model_name="negotiation",
                    name="context_title",
                    field=models.CharField(
                        max_length=255,
                        null=True,
                        blank=True,
                    ),
                ),

                migrations.AddField(
                    model_name="negotiation",
                    name="expired_at",
                    field=models.DateTimeField(
                        null=True,
                        blank=True,
                    ),
                ),

                migrations.AddField(
                    model_name="negotiation",
                    name="is_active",
                    field=models.BooleanField(
                        default=True,
                    ),
                ),

                # =====================================================
                # Message
                # =====================================================

                migrations.AlterModelTable(
                    name="message",
                    table="negotiations_negotiationmessage",
                ),

                migrations.AlterModelOptions(
                    name="message",
                    options={
                        "ordering": [
                            "timestamp",
                            "id",
                        ],
                    },
                ),

                migrations.AddField(
                    model_name="message",
                    name="file",
                    field=models.FileField(
                        upload_to="negotiation_files/%Y/%m/",
                        null=True,
                        blank=True,
                    ),
                ),

                migrations.AddField(
                    model_name="message",
                    name="file_name",
                    field=models.CharField(
                        max_length=255,
                        null=True,
                        blank=True,
                    ),
                ),

                migrations.AddField(
                    model_name="message",
                    name="read_at",
                    field=models.DateTimeField(
                        null=True,
                        blank=True,
                    ),
                ),

                migrations.AddField(
                    model_name="message",
                    name="parent",
                    field=models.ForeignKey(
                        to="negotiations.message",
                        on_delete=django.db.models.deletion.SET_NULL,
                        null=True,
                        blank=True,
                        related_name="replies",
                    ),
                ),

                migrations.AlterField(
                    model_name="message",
                    name="sender",
                    field=models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="negotiation_messages",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),

                migrations.AlterField(
                    model_name="message",
                    name="text",
                    field=models.TextField(
                        blank=True,
                        default="",
                    ),
                ),
            ],
        ),
    ]