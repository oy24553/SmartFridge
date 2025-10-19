from datetime import date

from rest_framework import serializers

from .models import InventoryItem, ConsumptionEvent, ShoppingTask, CookHistory


class InventoryItemSerializer(serializers.ModelSerializer):
    days_to_expiry = serializers.SerializerMethodField()
    is_low_stock = serializers.SerializerMethodField()

    class Meta:
        model = InventoryItem
        read_only_fields = ("id", "owner", "created_at", "updated_at", "days_to_expiry", "is_low_stock")
        fields = (
            "id",
            "name",
            "category",
            "location",
            "container",
            "quantity",
            "unit",
            "min_stock",
            "barcode",
            "brand",
            "tags",
            "expiry_date",
            "notes",
            "days_to_expiry",
            "is_low_stock",
            "created_at",
            "updated_at",
        )

    def get_days_to_expiry(self, obj: InventoryItem):
        if not obj.expiry_date:
            return None
        return (obj.expiry_date - date.today()).days

    def get_is_low_stock(self, obj: InventoryItem):
        try:
            return obj.quantity <= obj.min_stock
        except Exception:
            return False


class AdjustSerializer(serializers.Serializer):
    delta = serializers.DecimalField(max_digits=10, decimal_places=2)
    note = serializers.CharField(required=False, allow_blank=True)
    action = serializers.ChoiceField(choices=["consume", "add", "adjust"], required=False)


class BulkCreateItemSerializer(serializers.Serializer):
    items = InventoryItemSerializer(many=True)


class ConsumptionEventSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="item.name", read_only=True)

    class Meta:
        model = ConsumptionEvent
        fields = ("id", "item", "item_name", "action", "delta", "note", "created_at")
        read_only_fields = ("id", "created_at")


class ShoppingTaskSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="item.name", read_only=True)
    item_category = serializers.CharField(source="item.category", read_only=True)

    class Meta:
        model = ShoppingTask
        fields = (
            "id",
            "item",
            "item_name",
            "item_category",
            "name",
            "quantity",
            "unit",
            "status",
            "source",
            "due_date",
            "created_at",
        )
        read_only_fields = ("id", "created_at")


class CookHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CookHistory
        fields = ("id", "title", "items", "created_at")
        read_only_fields = ("id", "created_at")


class CookItemUseSerializer(serializers.Serializer):
    name = serializers.CharField()
    quantity = serializers.FloatField(required=False, default=0)
    unit = serializers.CharField(required=False, allow_blank=True)


class CookRequestSerializer(serializers.Serializer):
    title = serializers.CharField(required=False, allow_blank=True)
    items = CookItemUseSerializer(many=True)
