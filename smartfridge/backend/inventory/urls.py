from rest_framework.routers import DefaultRouter
from django.urls import path

from .views import InventoryItemViewSet, summary, ShoppingTaskViewSet, cook, CookHistoryViewSet


router = DefaultRouter()
router.register(r"items", InventoryItemViewSet, basename="inventory-item")
router.register(r"shopping", ShoppingTaskViewSet, basename="shopping")
router.register(r"cook-history", CookHistoryViewSet, basename="cook-history")

urlpatterns = [
    path("summary/", summary, name="inventory-summary"),
    path("cook/", cook, name="cook"),
]

urlpatterns += router.urls
