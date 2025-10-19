from django.contrib import admin

from .models import InventoryItem, ConsumptionEvent, ShoppingTask, CookHistory


@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ("name", "owner", "quantity", "unit", "location", "expiry_date", "updated_at")
    list_filter = ("category", "location", "unit")
    search_fields = ("name", "category", "location", "container")


@admin.register(ConsumptionEvent)
class ConsumptionEventAdmin(admin.ModelAdmin):
    list_display = ("item", "owner", "action", "delta", "created_at")
    list_filter = ("action",)
    search_fields = ("item__name", "note")


@admin.register(ShoppingTask)
class ShoppingTaskAdmin(admin.ModelAdmin):
    list_display = ("name", "owner", "quantity", "unit", "status", "source", "created_at")
    list_filter = ("status", "source")
    search_fields = ("name", "item__name")


@admin.register(CookHistory)
class CookHistoryAdmin(admin.ModelAdmin):
    list_display = ("title", "owner", "created_at")
    search_fields = ("title",)
