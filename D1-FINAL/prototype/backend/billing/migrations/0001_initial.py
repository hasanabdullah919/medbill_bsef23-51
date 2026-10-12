import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations = [
        migrations.CreateModel(
            name="Patient",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("first_name", models.CharField(max_length=80)),
                ("last_name", models.CharField(max_length=80)),
                ("date_of_birth", models.DateField()),
                ("phone", models.CharField(blank=True, max_length=30)),
                ("insurer_name", models.CharField(max_length=120)),
                ("member_id", models.CharField(max_length=80)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("created_by", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="Claim",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("diagnosis_code", models.CharField(max_length=12)),
                ("procedure_code", models.CharField(max_length=12)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=10)),
                ("service_date", models.DateField()),
                ("status", models.CharField(choices=[("draft", "Draft"), ("validation_failed", "Validation failed"), ("ready", "Ready")], default="draft", max_length=24)),
                ("validation_messages", models.JSONField(blank=True, default=list)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("created_by", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to=settings.AUTH_USER_MODEL)),
                ("patient", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="claims", to="billing.patient")),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
