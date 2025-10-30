from django.urls import path
from .views import register, demo_token

urlpatterns = [
    path("register/", register, name="register"),
    path("demo-token/", demo_token, name="demo-token"),
]
