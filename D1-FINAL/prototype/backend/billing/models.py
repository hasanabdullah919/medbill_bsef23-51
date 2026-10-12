from django.conf import settings
from django.db import models


class Patient(models.Model):
    first_name = models.CharField(max_length=80)
    last_name = models.CharField(max_length=80)
    date_of_birth = models.DateField()
    phone = models.CharField(max_length=30, blank=True)
    insurer_name = models.CharField(max_length=120)
    member_id = models.CharField(max_length=80)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class Claim(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        VALIDATION_FAILED = "validation_failed", "Validation failed"
        READY = "ready", "Ready"

    patient = models.ForeignKey(Patient, on_delete=models.PROTECT, related_name="claims")
    diagnosis_code = models.CharField(max_length=12)
    procedure_code = models.CharField(max_length=12)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    service_date = models.DateField()
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.DRAFT)
    validation_messages = models.JSONField(default=list, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
