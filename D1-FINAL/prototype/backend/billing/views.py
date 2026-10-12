from django.contrib.auth import authenticate
from django.db.models import DecimalField, Sum, Value
from django.db.models.functions import Coalesce
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Claim, Patient
from .serializers import ClaimSerializer, PatientSerializer


def role_for(user):
    return "admin" if user.is_staff else "biller"


@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    return Response({"status": "ok", "service": "MedBill API", "version": "d1"})


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    user = authenticate(username=request.data.get("username", ""), password=request.data.get("password", ""))
    if not user:
        return Response({"detail": "Invalid username or password."}, status=status.HTTP_400_BAD_REQUEST)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "user": {"username": user.username, "role": role_for(user)}})


@api_view(["POST"])
def logout(request):
    request.auth.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
def me(request):
    return Response({"username": request.user.username, "role": role_for(request.user)})


@api_view(["GET"])
def dashboard(request):
    money = DecimalField(max_digits=12, decimal_places=2)
    totals = Claim.objects.aggregate(billed=Coalesce(Sum("amount"), Value(0), output_field=money))
    return Response({
        "patients": Patient.objects.count(),
        "claims": Claim.objects.count(),
        "ready": Claim.objects.filter(status=Claim.Status.READY).count(),
        "needs_attention": Claim.objects.filter(status=Claim.Status.VALIDATION_FAILED).count(),
        "billed": str(totals["billed"]),
    })


class PatientViewSet(viewsets.ModelViewSet):
    serializer_class = PatientSerializer
    queryset = Patient.objects.all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ClaimViewSet(viewsets.ModelViewSet):
    serializer_class = ClaimSerializer
    queryset = Claim.objects.select_related("patient").all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
