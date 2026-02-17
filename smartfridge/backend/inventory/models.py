from django.conf import settings
from django.db import models


class InventoryItem(models.Model):
    EXPIRY_TYPE = (
        ("use_by", "Use by"),
        ("best_before", "Best before"),
    )

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="inventory_items",
    )
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100, blank=True, default="")
    location = models.CharField(max_length=100, blank=True, default="")  # 位置/层/容器
    container = models.CharField(max_length=100, blank=True, default="")

    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    unit = models.CharField(max_length=20, default="pcs")  # g/ml/pcs
    min_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    barcode = models.CharField(max_length=64, blank=True, default="")
    brand = models.CharField(max_length=100, blank=True, default="")
    tags = models.CharField(max_length=255, blank=True, default="")  # comma separated

    expiry_type = models.CharField(max_length=20, choices=EXPIRY_TYPE, default="best_before")
    expiry_date = models.DateField(null=True, blank=True)

    notes = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name", "-updated_at"]

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.name} ({self.quantity}{self.unit})"


class ConsumptionEvent(models.Model):
    ACTIONS = (
        ("consume", "Consume"),
        ("add", "Add"),
        ("adjust", "Adjust"),
    )
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="consumption_events")
    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name="events")
    action = models.CharField(max_length=10, choices=ACTIONS, default="adjust")
    delta = models.DecimalField(max_digits=10, decimal_places=2)
    note = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class ShoppingTask(models.Model):
    STATUS = (
        ("pending", "Pending"),
        ("done", "Done"),
    )
    SOURCE = (
        ("manual", "Manual"),
        ("low_stock", "Low Stock"),
        ("plan", "Plan"),
    )

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="shopping_tasks")
    item = models.ForeignKey(InventoryItem, on_delete=models.SET_NULL, null=True, blank=True, related_name="shopping_tasks")
    name = models.CharField(max_length=200)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit = models.CharField(max_length=20, default="pcs")
    status = models.CharField(max_length=10, choices=STATUS, default="pending")
    source = models.CharField(max_length=20, choices=SOURCE, default="manual")
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["status", "-created_at"]


class CookHistory(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cook_histories")
    title = models.CharField(max_length=200)
    items = models.JSONField(default=list)  # [{name, quantity, unit, item_id?, used?}]
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
