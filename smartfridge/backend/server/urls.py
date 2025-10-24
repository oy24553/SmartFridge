from django.contrib import admin
from django.urls import include, path
from core.views import health  # lightweight root health endpoint for uptime monitors
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

urlpatterns = [
    path("admin/", admin.site.urls),

    # Lightweight root-level health endpoint (supports GET/HEAD)
    path("healthz/", health, name="healthz"),

    # API schema and docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),

    # Auth (JWT)
    path("api/auth/jwt/create/", TokenObtainPairView.as_view(), name="jwt-create"),
    path("api/auth/jwt/refresh/", TokenRefreshView.as_view(), name="jwt-refresh"),
    path("api/auth/jwt/verify/", TokenVerifyView.as_view(), name="jwt-verify"),
    path("api/auth/", include("accounts.urls")),

    # Core endpoints
    path("api/v1/", include("core.urls")),
    path("api/v1/inventory/", include("inventory.urls")),
    path("api/v1/ai/", include("aiapi.urls")),
]
