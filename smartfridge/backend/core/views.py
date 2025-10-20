from django.utils.timezone import now
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from drf_spectacular.types import OpenApiTypes


@extend_schema(responses={200: OpenApiTypes.OBJECT}, description="Health check")
@api_view(["GET"]) 
@permission_classes([AllowAny])
def health(request):
    return Response({
        "status": "ok",
        "time": now(),
        "service": "smartpantry-backend",
    })
