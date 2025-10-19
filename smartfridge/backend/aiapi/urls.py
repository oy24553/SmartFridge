from django.urls import path
from .views import menu, parse_items, parse_items_import, suggest_shopping_view, assistant

urlpatterns = [
    path("menu/", menu, name="ai-menu"),
    path("parse-items/", parse_items, name="ai-parse-items"),
    path("parse-items-import/", parse_items_import, name="ai-parse-items-import"),
    path("suggest-shopping/", suggest_shopping_view, name="ai-suggest-shopping"),
    path("assistant/", assistant, name="ai-assistant"),
]
