from django.contrib import admin

from .models import Claim, Patient

admin.site.register(Patient)
admin.site.register(Claim)
