from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from billing.views import ClaimViewSet, PatientViewSet, dashboard, health, login, logout, me

router = DefaultRouter()
router.register("patients", PatientViewSet, basename="patient")
router.register("claims", ClaimViewSet, basename="claim")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health),
    path("api/auth/login/", login),
    path("api/auth/logout/", logout),
    path("api/auth/me/", me),
    path("api/dashboard/", dashboard),
    path("api/", include(router.urls)),
]
