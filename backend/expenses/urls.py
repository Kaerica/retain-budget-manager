
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    SignupView,
    SigninView,
    ExpenseViewSet,
    CategoryViewSet,
    BudgetView,
    ProfileView,
    AdminInsightsView,
)

router = DefaultRouter()
router.register("expenses", ExpenseViewSet, basename="expense")
router.register("categories", CategoryViewSet, basename="category")

urlpatterns = [
    path("", include(router.urls)),
    path("signup/", SignupView.as_view(), name="signup"),
    path("signin/", SigninView.as_view(), name="signin"),
    path("budgets/", BudgetView.as_view(), name="budgets"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path(
        "admin/insights/",
        AdminInsightsView.as_view(),
        name="admin-insights",
    ),
]
