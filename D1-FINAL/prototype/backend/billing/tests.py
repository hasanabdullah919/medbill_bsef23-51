from datetime import date

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from .models import Claim, Patient


class MedBillApiTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="biller", password="test-pass")
        response = self.client.post("/api/auth/login/", {"username": "biller", "password": "test-pass"}, format="json")
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {response.data['token']}")
        self.patient = Patient.objects.create(
            first_name="Test",
            last_name="Patient",
            date_of_birth=date(1990, 1, 1),
            insurer_name="Synthetic Payer",
            member_id="MEM-1",
            created_by=self.user,
        )

    def test_health_is_public(self):
        self.client.credentials()
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, 200)

    def test_valid_claim_becomes_ready(self):
        response = self.client.post("/api/claims/", {
            "patient": self.patient.id,
            "diagnosis_code": "J06.9",
            "procedure_code": "99213",
            "amount": "125.00",
            "service_date": "2026-10-12",
        }, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], Claim.Status.READY)
        self.assertEqual(response.data["validation_messages"], [])

    def test_invalid_claim_is_saved_for_correction(self):
        response = self.client.post("/api/claims/", {
            "patient": self.patient.id,
            "diagnosis_code": "bad",
            "procedure_code": "12",
            "amount": "0.00",
            "service_date": "2026-10-12",
        }, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], Claim.Status.VALIDATION_FAILED)
        self.assertEqual(len(response.data["validation_messages"]), 3)

    def test_dashboard_reconciles_claim_count(self):
        response = self.client.get("/api/dashboard/")
        self.assertEqual(response.data["patients"], 1)
        self.assertEqual(response.data["claims"], 0)
