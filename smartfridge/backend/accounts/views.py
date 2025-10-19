from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .serializers import RegisterSerializer
from drf_spectacular.utils import extend_schema
from drf_spectacular.types import OpenApiTypes


@extend_schema(
    request=RegisterSerializer,
    responses={201: OpenApiTypes.OBJECT},
    description="注册用户并返回 access/refresh JWT。"
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
