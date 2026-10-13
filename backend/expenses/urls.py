
from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import ExpenseViewSet, SignupView, SigninView

router = DefaultRouter()
router.register("expenses", ExpenseViewSet, basename="expense")

urlpatterns = [
    path("signup/", SignupView.as_view(), name="signup"),
    path("signin/", SigninView.as_view(), name="signin"),
]

urlpatterns += router.urls
