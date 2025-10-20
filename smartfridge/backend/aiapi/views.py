from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from ai.client import generate_menu, parse_items_from_text, suggest_shopping, decide_action
from ai.shelf_life import estimate_expiry_date
from inventory.models import InventoryItem, ConsumptionEvent, ShoppingTask
from .serializers import MenuRequestSerializer, ParseItemsRequestSerializer, SuggestShoppingRequestSerializer, AssistantRequestSerializer
from django.db import transaction
from django.db.models import F
from datetime import date
from drf_spectacular.utils import extend_schema
from drf_spectacular.types import OpenApiTypes


@extend_schema(request=MenuRequestSerializer, responses=OpenApiTypes.OBJECT)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def menu(request):
    ser = MenuRequestSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    days = ser.validated_data["days"]
    meals_per_day = ser.validated_data["meals_per_day"]
    language = ser.validated_data["language"]

    inv = list(
        InventoryItem.objects.filter(owner=request.user).values(
            "name", "quantity", "unit", "expiry_date"
        )
    )
    try:
        data = generate_menu(inv, days=days, meals_per_day=meals_per_day, language=language)
    except Exception as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    return Response(data)


@extend_schema(request=ParseItemsRequestSerializer, responses=OpenApiTypes.OBJECT)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def parse_items(request):
    ser = ParseItemsRequestSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    try:
        data = parse_items_from_text(ser.validated_data["text"]) 
    except Exception as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    return Response(data)


@extend_schema(request=ParseItemsRequestSerializer, responses=OpenApiTypes.OBJECT)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def parse_items_import(request):
    ser = ParseItemsRequestSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    parsed = parse_items_from_text(ser.validated_data["text"]) or {}
    items = parsed.get("items", [])
    results = []
    for it in items:
        name = (it.get("name") or "").strip()
        if not name:
            continue
        qty = it.get("quantity")
        try:
            qty = float(qty) if qty is not None else 1.0
        except Exception:
            qty = 1.0
        unit = it.get("unit") or "pcs"
        expiry = it.get("expiry_date") or None
        if not expiry:
            expiry = estimate_expiry_date(name)

        with transaction.atomic():
            obj = InventoryItem.objects.filter(owner=request.user, name__iexact=name).first()
            if obj is None:
                obj = InventoryItem.objects.create(
                    owner=request.user,
                    name=name,
                    quantity=0,
                    unit=unit,
                )
            # increase quantity and optional expiry overwrite if provided
            obj.quantity = F("quantity") + qty
            update_fields = ["quantity"]
            try:
                obj.expiry_date = date.fromisoformat(str(expiry))
                update_fields.append("expiry_date")
            except Exception:
                pass
            obj.save(update_fields=update_fields)
            obj.refresh_from_db()
            ConsumptionEvent.objects.create(owner=request.user, item=obj, action="add", delta=qty, note="ai import")

        results.append({"id": obj.id, "name": obj.name, "quantity": float(obj.quantity), "unit": obj.unit})

    return Response({"created": results}, status=status.HTTP_201_CREATED)


@extend_schema(request=SuggestShoppingRequestSerializer, responses=OpenApiTypes.OBJECT)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def suggest_shopping_view(request):
    ser = SuggestShoppingRequestSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    days = ser.validated_data["days"]
    language = ser.validated_data["language"]
    create = ser.validated_data["create"]

    inv = list(
        InventoryItem.objects.filter(owner=request.user).values(
            "name", "quantity", "unit", "expiry_date"
        )
    )
    try:
        data = suggest_shopping(inv, days=days, language=language)
    except Exception as e:
        # Fallback to a simple heuristic when AI is not available
        low = InventoryItem.objects.filter(owner=request.user, quantity__lte=F("min_stock")).values("name", "unit")
        data = {"suggestions": [{"name": it["name"], "quantity": 1, "unit": it.get("unit") or "pcs", "reason": "restock due to low stock"} for it in low]}

    suggestions = data.get("suggestions", [])
    created = []
    if create:
        for s in suggestions:
            name = (s.get("name") or "").strip()
            if not name:
                continue
            qty = s.get("quantity") or 1
            try:
                qty = float(qty)
            except Exception:
                qty = 1
            unit = s.get("unit") or "pcs"

            # avoid duplicates pending entries
            exists = ShoppingTask.objects.filter(owner=request.user, status="pending", name__iexact=name).exists()
            if exists:
                continue

            # link to item if exists by name
            item = InventoryItem.objects.filter(owner=request.user, name__iexact=name).first()
            task = ShoppingTask.objects.create(
                owner=request.user,
                item=item,
                name=name,
                quantity=qty,
                unit=unit,
                source="ai",
            )
            created.append(task.id)

    return Response({"suggestions": suggestions, "created": created})


@extend_schema(request=AssistantRequestSerializer, responses=OpenApiTypes.OBJECT)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def assistant(request):
    ser = AssistantRequestSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    message = ser.validated_data["message"]
    language = ser.validated_data["language"]
    execute = ser.validated_data["execute"]

    inv = list(
        InventoryItem.objects.filter(owner=request.user).values(
            "name", "quantity", "unit", "expiry_date"
        )
    )

    decision = {}
    try:
        decision = decide_action(message, inv, language=language)
    except Exception as e:
        decision = {"action": "help", "reason": str(e)}

    result = {"created_shopping": 0, "imported": 0, "details": []}
    if execute:
        action = (decision.get("action") or "").strip()
        items = decision.get("items", []) or []

        if action == "suggest_shopping":
            days = decision.get("days", 3)
            data = suggest_shopping(inv, days=days, language=language)
            suggestions = data.get("suggestions", [])
            for s in suggestions:
                name = (s.get("name") or "").strip()
                if not name:
                    continue
                qty = s.get("quantity") or 1
                unit = s.get("unit") or "pcs"
                exists = ShoppingTask.objects.filter(owner=request.user, status="pending", name__iexact=name).exists()
                if exists:
                    continue
                item = InventoryItem.objects.filter(owner=request.user, name__iexact=name).first()
                ShoppingTask.objects.create(owner=request.user, item=item, name=name, quantity=qty, unit=unit, source="ai")
                result["created_shopping"] += 1
        elif action == "add_shopping":
            for it in items:
                name = (it.get("name") or "").strip()
                if not name:
                    continue
                qty = it.get("quantity") or 1
                unit = it.get("unit") or "pcs"
                exists = ShoppingTask.objects.filter(owner=request.user, status="pending", name__iexact=name).exists()
                if exists:
                    continue
                item = InventoryItem.objects.filter(owner=request.user, name__iexact=name).first()
                ShoppingTask.objects.create(owner=request.user, item=item, name=name, quantity=qty, unit=unit, source="ai")
                result["created_shopping"] += 1
        elif action == "import_inventory":
            for it in items:
                name = (it.get("name") or "").strip()
                if not name:
                    continue
                qty = it.get("quantity") or 1
                unit = it.get("unit") or "pcs"
                expiry = it.get("expiry_date") or estimate_expiry_date(name)
                obj = InventoryItem.objects.filter(owner=request.user, name__iexact=name).first()
                if obj is None:
                    obj = InventoryItem.objects.create(owner=request.user, name=name, unit=unit, quantity=0)
                obj.quantity = F("quantity") + qty
                update_fields = ["quantity"]
                try:
                    obj.expiry_date = date.fromisoformat(str(expiry))
                    update_fields.append("expiry_date")
                except Exception:
                    pass
                obj.save(update_fields=update_fields)
                obj.refresh_from_db()
                ConsumptionEvent.objects.create(owner=request.user, item=obj, action="add", delta=qty, note="assistant import")
                result["imported"] += 1

    return Response({"decision": decision, "result": result})
