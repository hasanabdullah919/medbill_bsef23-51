from datetime import date

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from billing.models import Claim, Patient
from billing.services import validate_claim


class Command(BaseCommand):
    help = "Create synthetic D1 demonstration accounts and records."

    def handle(self, *args, **options):
        User = get_user_model()
        admin, _ = User.objects.get_or_create(username="admin", defaults={"is_staff": True, "is_superuser": True})
        admin.is_staff = True
        admin.is_superuser = True
        admin.set_password("MedBillD1!")
        admin.save()
        biller, _ = User.objects.get_or_create(username="biller")
        biller.set_password("MedBillD1!")
        biller.save()

        patient, _ = Patient.objects.get_or_create(
            member_id="SYN-10001",
            defaults={
                "first_name": "Amina",
                "last_name": "Khan",
                "date_of_birth": date(1992, 4, 18),
                "phone": "+1 555 0100",
                "insurer_name": "Demo Health Plan",
                "created_by": biller,
            },
        )
        if not patient.claims.exists():
            messages = validate_claim(patient, "J06.9", "99213", "125.00")
            Claim.objects.create(
                patient=patient,
                diagnosis_code="J06.9",
                procedure_code="99213",
                amount="125.00",
                service_date=date.today(),
                status=Claim.Status.READY if not messages else Claim.Status.VALIDATION_FAILED,
                validation_messages=messages,
                created_by=biller,
            )
        self.stdout.write(self.style.SUCCESS("Synthetic D1 demo data is ready."))
