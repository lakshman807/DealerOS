from django.db import models
from django.contrib.auth.models import User


# ==========================================
# 1. LOCATION MODEL
# ==========================================

class Location(models.Model):

    location_id = models.CharField(
        max_length=50,
        primary_key=True
    )

    org_id = models.CharField(
        max_length=50,
        db_index=True
    )

    name = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    def __str__(self):
        return f"{self.location_id} - {self.org_id}"

    class Meta:
        ordering = ["location_id"]


# ==========================================
# 2. SYSTEM A RECORD MODEL
# ==========================================

class SystemRecord(models.Model):

    record_id = models.CharField(
        max_length=100,
        primary_key=True
    )

    location = models.ForeignKey(
        Location,
        on_delete=models.PROTECT,
        related_name="system_a_records"
    )

    event_date = models.DateField(
        null=True,
        blank=True
    )

    category_code = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    actor_id = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    base_value = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True
    )

    adjustment = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True
    )

    total_value = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True
    )

    state = models.CharField(
        max_length=50,
        blank=True,
        null=True
    )

    def __str__(self):
        return self.record_id

    class Meta:
        ordering = ["record_id"]


# ==========================================
# 3. SYSTEM B ENTRY MODEL
# ==========================================

class SystemEntry(models.Model):

    entry_id = models.CharField(
        max_length=100,
        primary_key=True
    )

    record_ref_raw = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    record_ref = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        db_index=True
    )

    location = models.ForeignKey(
        Location,
        on_delete=models.PROTECT,
        related_name="system_b_entries"
    )

    recorded_on = models.DateField(
        null=True,
        blank=True
    )

    value_raw = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    value = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True
    )

    label = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    def __str__(self):
        return self.entry_id

    class Meta:
        ordering = ["entry_id"]


# ==========================================
# 4. USER ORGANIZATION MODEL
# ==========================================

class UserOrganization(models.Model):

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="organization"
    )

    org_id = models.CharField(
        max_length=50,
        db_index=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.user.username} - {self.org_id}"

    class Meta:
        ordering = ["org_id"]
        verbose_name = "User Organization"
        verbose_name_plural = "User Organizations"