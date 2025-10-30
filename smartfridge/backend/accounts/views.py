from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .serializers import RegisterSerializer
from django.contrib.auth.models import User
from django.conf import settings
from drf_spectacular.utils import extend_schema
from drf_spectacular.types import OpenApiTypes


@extend_schema(
    request=RegisterSerializer,
    responses={201: OpenApiTypes.OBJECT},
    description="Register user and return access/refresh JWT."
)
@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    user = serializer.save()

    token_serializer = TokenObtainPairSerializer(data={
        "username": user.username,
        "password": request.data.get("password", ""),
    })
    token_serializer.is_valid(raise_exception=True)
    tokens = token_serializer.validated_data
    return Response({
        "user": {"id": user.id, "username": user.username, "email": user.email},
        "access": tokens["access"],
        "refresh": tokens["refresh"],
    }, status=status.HTTP_201_CREATED)


@extend_schema(
    responses={200: OpenApiTypes.OBJECT},
    description="Create or fetch a demo user and return JWT tokens."
)
@api_view(["POST"])
@permission_classes([AllowAny])
def demo_token(request):
    # Configurable via env; safe defaults for demo
    username = getattr(settings, "DEMO_USERNAME", None) or "demo"
    password = getattr(settings, "DEMO_PASSWORD", None) or "123456"
    email = getattr(settings, "DEMO_EMAIL", None) or "demo@example.com"

    user = User.objects.filter(username=username).first()
    if user is None:
        user = User.objects.create_user(username=username, email=email, password=password)

    # Issue tokens
    token_serializer = TokenObtainPairSerializer(data={
        "username": username,
        "password": password,
    })
    token_serializer.is_valid(raise_exception=True)
    tokens = token_serializer.validated_data
    return Response({
        "user": {"id": user.id, "username": user.username, "email": user.email},
        "access": tokens["access"],
        "refresh": tokens["refresh"],
    })
