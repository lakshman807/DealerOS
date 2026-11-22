from django.contrib import admin

from reconcile.models import (
    Location,
    SystemRecord,
    SystemEntry,
    UserOrganization
)


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ("location_id", "org_id", "name")
    list_filter = ("org_id",)
    search_fields = ("location_id", "name")


@admin.register(SystemRecord)
class SystemRecordAdmin(admin.ModelAdmin):
    list_display = (
        "record_id",
        "location",
        "event_date",
        "total_value",
        "state"
    )

    search_fields = ("record_id",)


@admin.register(SystemEntry)
class SystemEntryAdmin(admin.ModelAdmin):
    list_display = (
        "entry_id",
        "record_ref",
        "location",
        "recorded_on",
        "value"
    )

    search_fields = ("entry_id", "record_ref")


@admin.register(UserOrganization)
class UserOrganizationAdmin(admin.ModelAdmin):
    list_display = ("user", "org_id", "created_at")
    list_filter = ("org_id",)
    search_fields = ("user__username", "org_id")