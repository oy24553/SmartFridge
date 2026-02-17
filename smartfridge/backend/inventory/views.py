from typing import Any

from django.db import transaction
from django.db import models as dj_models
from django.db.models import Q, F, Sum
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ai.shelf_life import estimate_expiry_date
from .models import InventoryItem, ConsumptionEvent, ShoppingTask, CookHistory
from .serializers import (
    InventoryItemSerializer,
    AdjustSerializer,
    BulkCreateItemSerializer,
    QuickAddRequestSerializer,
    ConsumptionEventSerializer,
    ShoppingTaskSerializer,
    CookHistorySerializer,
    CookRequestSerializer,
)
from drf_spectacular.utils import extend_schema
from drf_spectacular.types import OpenApiTypes


class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj: InventoryItem) -> bool:
        return obj.owner_id == request.user.id


class InventoryItemViewSet(viewsets.ModelViewSet):
    serializer_class = InventoryItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        qs = InventoryItem.objects.filter(owner=self.request.user)

        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(category__icontains=q) | Q(location__icontains=q))

        for field in ["category", "location", "container", "unit"]:
            value = self.request.query_params.get(field)
            if value:
                qs = qs.filter(**{field: value})

        expired = self.request.query_params.get("expired")
        if expired in {"1", "true", "True"}:
            from datetime import date
            qs = qs.filter(expiry_date__lt=date.today())

        # Near-expiry filter via days_to parameter (<= N days)
        days_to = self.request.query_params.get("days_to")
        if days_to and days_to.isdigit():
            from datetime import date, timedelta

            target = date.today() + timedelta(days=int(days_to))
            qs = qs.filter(expiry_date__lte=target)

        return qs.order_by("name")

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=["post"], url_path="adjust")
    def adjust(self, request, pk=None):
        item = self.get_object()
        serializer = AdjustSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        delta = serializer.validated_data["delta"]
        note = serializer.validated_data.get("note", "")
        action_name = serializer.validated_data.get("action", "adjust")

        with transaction.atomic():
            # Ensure not below zero
            new_q = item.quantity + delta
            if new_q < 0:
                return Response({"detail": "Quantity cannot be negative"}, status=status.HTTP_400_BAD_REQUEST)
            item.quantity = new_q
            item.save(update_fields=["quantity", "updated_at"])
            ev = ConsumptionEvent.objects.create(
                owner=request.user,
                item=item,
                action=action_name,
                delta=delta,
                note=note,
            )
        return Response({"quantity": str(item.quantity), "event_id": ev.id})

    @action(detail=False, methods=["post"], url_path="bulk")
    def bulk_create(self, request):
        serializer = BulkCreateItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        items_data = serializer.validated_data["items"]
        created = []
        for d in items_data:
            d["owner"] = request.user.id
            item_ser = InventoryItemSerializer(data=d)
            item_ser.is_valid(raise_exception=True)
            item = item_ser.save(owner=request.user)
            created.append(InventoryItemSerializer(item).data)
        return Response(created, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"], url_path="quick-add")
    def quick_add(self, request):
        """One-click add common items: merge by name and increment quantity."""
        serializer = QuickAddRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        items = serializer.validated_data["items"]

        results = []
        with transaction.atomic():
            for row in items:
                name = (row.get("name") or "").strip()
                if not name:
                    continue
                qty = row.get("quantity") or 1
                unit = (row.get("unit") or "").strip()

                # merge by case-insensitive name; if duplicates exist, pick the most recently updated
                existing = (
                    InventoryItem.objects.filter(owner=request.user, name__iexact=name)
                    .order_by("-updated_at", "id")
                    .first()
                )
                if existing is None:
                    existing = InventoryItem.objects.create(
                        owner=request.user,
                        name=name,
                        quantity=0,
                        unit=unit or "pcs",
                        category=row.get("category") or "",
                        location=row.get("location") or "",
                        container=row.get("container") or "",
                        expiry_type=row.get("expiry_type") or "best_before",
                        expiry_date=row.get("expiry_date"),
                    )
                else:
                    # Optionally fill missing metadata (do not overwrite unless empty)
                    changed = False
                    for k in ["category", "location", "container", "expiry_type", "expiry_date"]:
                        v = row.get(k)
                        if v in [None, ""]:
                            continue
                        if getattr(existing, k, None) in ["", None]:
                            setattr(existing, k, v)
                            changed = True
                    if unit and (existing.unit or "") == "":
                        existing.unit = unit
                        changed = True
                    if changed:
                        existing.save()

                existing.quantity = F("quantity") + qty
                existing.save(update_fields=["quantity", "updated_at"])
                existing.refresh_from_db()
                ConsumptionEvent.objects.create(
                    owner=request.user,
                    item=existing,
                    action="add",
                    delta=qty,
                    note="quick-add",
                )
                results.append(InventoryItemSerializer(existing).data)

        return Response({"results": results}, status=status.HTTP_200_OK)


@extend_schema(responses={200: OpenApiTypes.OBJECT}, description="Dashboard summary: low stock, near expiry, priority")
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def summary(request):
    from datetime import date, timedelta

    use_by_days = 2
    best_before_days = 5
    today = date.today()
    target_use_by = today + timedelta(days=use_by_days)
    target_best_before = today + timedelta(days=best_before_days)

    qs = InventoryItem.objects.filter(owner=request.user)
    low_stock = qs.filter(quantity__lte=F("min_stock"))
    near_expiry = (
        qs.filter(expiry_date__isnull=False)
        .filter(
            Q(expiry_type="use_by", expiry_date__lte=target_use_by)
            | Q(expiry_type="best_before", expiry_date__lte=target_best_before)
        )
        .order_by("expiry_date")
    )
    # priority list: combine near-expiry and days_to_empty (based on recent consumption)
    window_days = int(request.query_params.get("window_days", 14))
    from django.utils import timezone
    since = timezone.now() - timedelta(days=window_days)
    ev = (
        ConsumptionEvent.objects.filter(owner=request.user, created_at__gte=since, delta__lt=0)
        .values("item_id")
        .annotate(total=Sum("delta"))
    )
    consumption_map = {e["item_id"]: float(-e["total"]) / max(window_days, 1) for e in ev}

    priority = []
    for item in qs:
        rate = consumption_map.get(item.id, 0.0)
        days_to_empty = None
        if rate and rate > 0:
            try:
                days_to_empty = float(item.quantity) / rate
            except Exception:
                days_to_empty = None
        # days to expiry
        dte = None
        if item.expiry_date:
            dte = (item.expiry_date - today).days
        # priority score: smaller is more urgent
        candidates = [v for v in [dte, days_to_empty] if v is not None]
        if not candidates:
            continue
        score = min(candidates)
        reason = "expiry" if (dte is not None and dte == score) else "empty"
        priority.append({
            "id": item.id,
            "name": item.name,
            "quantity": float(item.quantity),
            "unit": item.unit,
            "days_to_expiry": dte,
            "days_to_empty": round(days_to_empty, 2) if days_to_empty is not None else None,
            "reason": reason,
            "score": round(score, 2) if isinstance(score, float) else score,
        })
    priority.sort(key=lambda x: (x["score"] if x["score"] is not None else 1e9))
    priority = priority[:10]

    return Response({
        "low_stock": InventoryItemSerializer(low_stock, many=True).data,
        "near_expiry": InventoryItemSerializer(near_expiry, many=True).data,
        "priority": priority,
        "expiry_thresholds": {
            "use_by_days": use_by_days,
            "best_before_days": best_before_days,
        },
        "window_days": window_days,
    })


@extend_schema(request=CookRequestSerializer, responses={200: CookHistorySerializer})
@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def cook(request):
    data = request.data or {}
    title = str(data.get("title") or "Cooked")
    items = data.get("items") or []
    results = []

    def to_float(v):
        try:
            return float(v)
        except Exception:
            import re
            m = re.search(r"(-?\d+(?:\.\d+)?)", str(v))
            return float(m.group(1)) if m else 0.0

    with transaction.atomic():
        for it in items:
            name = str(it.get("name") or "").strip()
            if not name:
                continue
            qty = to_float(it.get("quantity") or 0)
            unit = it.get("unit") or ""
            matched = InventoryItem.objects.filter(owner=request.user, name__iexact=name).first()
            used = 0.0
            if matched and qty > 0:
                matched.refresh_from_db()
                current = float(matched.quantity)
                used = min(qty, current)
                matched.quantity = F("quantity") - used
                matched.save(update_fields=["quantity"])
                ConsumptionEvent.objects.create(owner=request.user, item=matched, action="consume", delta=-used, note=f"cook: {title}")
                matched.refresh_from_db()
            results.append({"name": name, "quantity": qty, "unit": unit, "item_id": matched.id if matched else None, "used": used})

        # lazy import to avoid circular
        from .models import CookHistory  # noqa: WPS433
        history = CookHistory.objects.create(owner=request.user, title=title, items=results)

    consumed_count = sum(1 for r in results if r.get("used", 0) > 0)
    return Response({"ok": True, "history_id": history.id, "consumed_count": consumed_count, "results": results})


class CookHistoryViewSet(viewsets.ModelViewSet):
    serializer_class = CookHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CookHistory.objects.filter(owner=self.request.user).order_by("-created_at")

    def create(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)


class ShoppingTaskViewSet(viewsets.ModelViewSet):
    serializer_class = ShoppingTaskSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        qs = ShoppingTask.objects.filter(owner=self.request.user)
        status_q = self.request.query_params.get("status")
        if status_q:
            qs = qs.filter(status=status_q)
        source_q = self.request.query_params.get("source")
        if source_q:
            qs = qs.filter(source=source_q)
        return qs.order_by("status", "-created_at")

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=False, methods=["post"], url_path="generate")
    def generate_from_low_stock(self, request):
        created = []
        low = InventoryItem.objects.filter(owner=request.user, quantity__lte=F("min_stock"))
        for it in low:
            exists = ShoppingTask.objects.filter(owner=request.user, status="pending", item=it).exists()
            if exists:
                continue
            task = ShoppingTask.objects.create(
                owner=request.user,
                item=it,
                name=it.name,
                quantity=max(it.min_stock - it.quantity, 1),
                unit=it.unit,
                source="low_stock",
            )
            created.append(task)
        return Response(ShoppingTaskSerializer(created, many=True).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="purchase")
    def purchase(self, request, pk=None):
        task = self.get_object()
        qty = request.data.get("quantity")
        try:
            qty = float(qty) if qty is not None else float(task.quantity)
        except Exception:
            qty = float(task.quantity)
        expiry_date = request.data.get("expiry_date")

        with transaction.atomic():
            # If linked item, add to its quantity; otherwise create/merge item by name
            if task.item:
                item = task.item
            else:
                item, _ = InventoryItem.objects.get_or_create(
                    owner=request.user, name=task.name,
                    defaults={"unit": task.unit, "quantity": 0}
                )
            item.quantity = F("quantity") + qty
            update_fields = ["quantity"]
            # optional expiry update if provided
            if not expiry_date:
                expiry_date = estimate_expiry_date(task.name)
            try:
                from datetime import date as _date
                item.expiry_date = _date.fromisoformat(str(expiry_date))
                update_fields.append("expiry_date")
            except Exception:
                pass
            item.save(update_fields=update_fields)
            item.refresh_from_db()
            ConsumptionEvent.objects.create(
                owner=request.user, item=item, action="add", delta=qty, note=f"purchase task #{task.id}"
            )

            task.status = "done"
            task.save(update_fields=["status"])

        return Response({"ok": True, "item_id": item.id, "quantity": str(item.quantity)})

    @action(detail=False, methods=["post"], url_path="purchase-batch")
    def purchase_batch(self, request):
        items = request.data.get("items", [])
        if not isinstance(items, list):
            return Response({"detail": "items must be an array"}, status=status.HTTP_400_BAD_REQUEST)
        results = []
        for row in items:
            pk = row.get("id")
            if not pk:
                continue
            try:
                task = ShoppingTask.objects.get(id=pk, owner=request.user)
            except ShoppingTask.DoesNotExist:
                continue
            qty = row.get("quantity")
            expiry_date = row.get("expiry_date")
            try:
                qty = float(qty) if qty is not None else float(task.quantity)
            except Exception:
                qty = float(task.quantity)

            with transaction.atomic():
                if task.item:
                    item = task.item
                else:
                    item, _ = InventoryItem.objects.get_or_create(
                        owner=request.user, name=task.name,
                        defaults={"unit": task.unit, "quantity": 0}
                    )
                item.quantity = F("quantity") + qty
                update_fields = ["quantity"]
                if not expiry_date:
                    expiry_date = estimate_expiry_date(task.name)
                try:
                    from datetime import date as _date
                    item.expiry_date = _date.fromisoformat(str(expiry_date))
                    update_fields.append("expiry_date")
                except Exception:
                    pass
                item.save(update_fields=update_fields)
                item.refresh_from_db()
                ConsumptionEvent.objects.create(
                    owner=request.user, item=item, action="add", delta=qty, note=f"purchase task #{task.id} (batch)"
                )
                task.status = "done"
                task.save(update_fields=["status"])
                results.append({"task": task.id, "item": item.id, "quantity": float(item.quantity)})

        return Response({"results": results})


    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        qs = self.get_queryset()
        by_source = qs.values("source").annotate(count=dj_models.Count("id"))
        return Response({"by_source": list(by_source), "total": qs.count()})


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def cook(request):
    data = request.data or {}
    title = str(data.get("title") or "Cooked")
    items = data.get("items") or []
    results = []

    def to_float(v):
        try:
            return float(v)
        except Exception:
            import re
            m = re.search(r"(-?\d+(?:\.\d+)?)", str(v))
            return float(m.group(1)) if m else 0.0

    with transaction.atomic():
        for it in items:
            name = str(it.get("name") or "").strip()
            if not name:
                continue
            qty = to_float(it.get("quantity") or 0)
            unit = it.get("unit") or ""
            matched = InventoryItem.objects.filter(owner=request.user, name__iexact=name).first()
            used = 0.0
            if matched and qty > 0:
                matched.refresh_from_db()
                current = float(matched.quantity)
                used = min(qty, current)
                matched.quantity = F("quantity") - used
                matched.save(update_fields=["quantity"])
                ConsumptionEvent.objects.create(owner=request.user, item=matched, action="consume", delta=-used, note=f"cook: {title}")
                matched.refresh_from_db()
            results.append({"name": name, "quantity": qty, "unit": unit, "item_id": matched.id if matched else None, "used": used})

        from .models import CookHistory  # ensure no circular
        history = CookHistory.objects.create(owner=request.user, title=title, items=results)

    consumed_count = sum(1 for r in results if r.get("used", 0) > 0)
    return Response({"ok": True, "history_id": history.id, "consumed_count": consumed_count, "results": results})


class CookHistoryViewSet(viewsets.ModelViewSet):
    serializer_class = CookHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CookHistory.objects.filter(owner=self.request.user).order_by("-created_at")

    def create(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)
