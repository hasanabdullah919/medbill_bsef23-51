from rest_framework import serializers

from .models import Claim, Patient
from .services import validate_claim


class PatientSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = Patient
        fields = ["id", "first_name", "last_name", "full_name", "date_of_birth", "phone", "insurer_name", "member_id", "created_at"]
        read_only_fields = ["created_at"]


class ClaimSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)

    class Meta:
        model = Claim
        fields = ["id", "patient", "patient_name", "diagnosis_code", "procedure_code", "amount", "service_date", "status", "validation_messages", "created_at"]
        read_only_fields = ["status", "validation_messages", "created_at"]

    def create(self, validated_data):
        messages = validate_claim(
            validated_data["patient"],
            validated_data["diagnosis_code"],
            validated_data["procedure_code"],
            validated_data["amount"],
        )
        validated_data["diagnosis_code"] = validated_data["diagnosis_code"].upper()
        validated_data["procedure_code"] = validated_data["procedure_code"].upper()
        validated_data["validation_messages"] = messages
        validated_data["status"] = Claim.Status.VALIDATION_FAILED if messages else Claim.Status.READY
        return super().create(validated_data)
