
from datetime import date
from decimal import Decimal, InvalidOperation

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Count, Q, Sum
from django.utils import timezone

from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Expense, Budget, Category, DEFAULT_CATEGORY_NAME
from .pagination import ExpensePagination
from .permissions import IsAdminRole, get_user_role
from .serializers import ExpenseSerializer, BudgetSerializer
from .auth_serializers import SignupSerializer
from .category_serializers import CategorySerializer


class SignupView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = SignupSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        token, _ = Token.objects.get_or_create(user=user)

        return Response(
            {
                "message": "Account created successfully.",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "name": user.first_name,
                    "email": user.email,
                    "role": get_user_role(user),
                },
                "token": token.key,
            },
            status=status.HTTP_201_CREATED,
        )


class SigninView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        password = request.data.get("password", "")

        if not email or not password:
            return Response(
                {"detail": "Email and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        account = User.objects.filter(email__iexact=email).first()

        if account is None:
            return Response(
                {"detail": "Invalid email or password."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(
            request,
            username=account.username,
            password=password,
        )

        if user is None:
            return Response(
                {"detail": "Invalid email or password."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        token, _ = Token.objects.get_or_create(user=user)

        return Response(
            {
                "message": "Sign in successful.",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "name": user.first_name,
                    "email": user.email,
                    "role": get_user_role(user),
                },
                "token": token.key,
            },
            status=status.HTTP_200_OK,
        )


def parse_decimal(value):
    try:
        return Decimal(value)
    except (InvalidOperation, TypeError, ValueError):
        return None


def parse_date(value):
    try:
        return date.fromisoformat(value)
    except (TypeError, ValueError):
        return None


class ExpenseViewSet(viewsets.ModelViewSet):
    """
    CRUD for the signed-in user's own expenses.

    Optional query parameters for GET /api/expenses/:
      search          text found in the title, category, payment method or notes
      category        exact category name
      payment_method  exact payment method
      date_from       YYYY-MM-DD (inclusive)
      date_to         YYYY-MM-DD (inclusive)
      min_amount      minimum amount
      max_amount      maximum amount
      ordering        date, -date, amount or -amount (default -date)
      page, page_size enable pagination (response becomes {count, next, previous, results})
    """

    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = ExpensePagination

    ORDERING_OPTIONS = {"date", "-date", "amount", "-amount"}

    def get_queryset(self):
        queryset = Expense.objects.filter(user=self.request.user)

        if self.action != "list":
            return queryset

        params = self.request.query_params

        search = params.get("search", "").strip()
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(category__icontains=search)
                | Q(payment_method__icontains=search)
                | Q(description__icontains=search)
            )

        category = params.get("category", "").strip()
        if category and category.lower() != "all":
            queryset = queryset.filter(category__iexact=category)

        payment_method = params.get("payment_method", "").strip()
        if payment_method and payment_method.lower() != "all":
            queryset = queryset.filter(payment_method__iexact=payment_method)

        date_from = parse_date(params.get("date_from"))
        if date_from:
            queryset = queryset.filter(date__gte=date_from)

        date_to = parse_date(params.get("date_to"))
        if date_to:
            queryset = queryset.filter(date__lte=date_to)

        min_amount = parse_decimal(params.get("min_amount"))
        if min_amount is not None:
            queryset = queryset.filter(amount__gte=min_amount)

        max_amount = parse_decimal(params.get("max_amount"))
        if max_amount is not None:
            queryset = queryset.filter(amount__lte=max_amount)

        ordering = params.get("ordering", "-date")
        if ordering not in self.ORDERING_OPTIONS:
            ordering = "-date"

        return queryset.order_by(ordering, "-created_at")

    def paginate_queryset(self, queryset):
        # Only paginate when the client asks for a page.
        if "page" not in self.request.query_params:
            return None
        return super().paginate_queryset(queryset)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["get"])
    def summary(self, request):
        """
        Dashboard summary for one month.
        GET /api/expenses/summary/?month=10&year=2026 (defaults to this month)
        """
        today = timezone.localdate()

        try:
            month = int(request.query_params.get("month", today.month))
            year = int(request.query_params.get("year", today.year))
        except ValueError:
            return Response(
                {"detail": "Month and year must be numbers."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if month < 1 or month > 12:
            return Response(
                {"detail": "Month must be between 1 and 12."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_expenses = Expense.objects.filter(user=request.user)
        month_expenses = user_expenses.filter(
            date__month=month,
            date__year=year,
        )

        total_spent = month_expenses.aggregate(total=Sum("amount"))["total"] or Decimal("0")

        budget = Budget.objects.filter(
            user=request.user,
            month=month,
            year=year,
        ).first()
        budget_amount = budget.amount if budget else None

        if budget_amount is None:
            budget_status = "no_budget"
            remaining = None
        else:
            remaining = budget_amount - total_spent
            if total_spent > budget_amount:
                budget_status = "over"
            elif total_spent >= budget_amount * Decimal("0.8"):
                budget_status = "approaching"
            else:
                budget_status = "within"

        highest = month_expenses.order_by("-amount", "-date").first()

        by_category = (
            month_expenses.values("category")
            .annotate(total=Sum("amount"), count=Count("id"))
            .order_by("-total")
        )

        recent = user_expenses.order_by("-date", "-created_at")[:5]

        return Response(
            {
                "month": month,
                "year": year,
                "total_spent": total_spent,
                "budget": budget_amount,
                "remaining_budget": remaining,
                "budget_status": budget_status,
                "highest_expense": (
                    ExpenseSerializer(highest).data if highest else None
                ),
                "spending_by_category": list(by_category),
                "recent_expenses": ExpenseSerializer(recent, many=True).data,
            }
        )


class CategoryViewSet(viewsets.ModelViewSet):
    """
    Categories are shared by all users.
    Any signed-in user can list them; only admins can create, update or delete.
    Deleting a category moves its expenses to "Uncategorized".
    """

    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Category.objects.all()

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminRole()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def update(self, request, *args, **kwargs):
        category = self.get_object()

        if category.name == DEFAULT_CATEGORY_NAME:
            return Response(
                {"detail": f'The "{DEFAULT_CATEGORY_NAME}" category cannot be renamed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return super().update(request, *args, **kwargs)

    def perform_update(self, serializer):
        old_name = serializer.instance.name

        with transaction.atomic():
            category = serializer.save()

            # Expenses store the category name, so keep them in sync.
            if category.name != old_name:
                Expense.objects.filter(category=old_name).update(
                    category=category.name
                )

    def destroy(self, request, *args, **kwargs):
        category = self.get_object()

        if category.name == DEFAULT_CATEGORY_NAME:
            return Response(
                {"detail": f'The "{DEFAULT_CATEGORY_NAME}" category cannot be deleted.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            default_category = Category.get_default()
            moved = Expense.objects.filter(
                category__iexact=category.name
            ).update(category=default_category.name)
            category.delete()

        # Let the admin know how many expenses were moved.
        return Response(
            status=status.HTTP_204_NO_CONTENT,
            headers={"X-Moved-Expenses": str(moved)},
        )


class BudgetView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        budgets = Budget.objects.filter(user=request.user)
        serializer = BudgetSerializer(budgets, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = BudgetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        budget, created = Budget.objects.update_or_create(
            user=request.user,
            month=serializer.validated_data["month"],
            year=serializer.validated_data["year"],
            defaults={
                "amount": serializer.validated_data["amount"],
            },
        )

        result = BudgetSerializer(budget)

        return Response(
            result.data,
            status=(
                status.HTTP_201_CREATED
                if created
                else status.HTTP_200_OK
            ),
        )


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        return Response(
            {
                "id": user.id,
                "username": user.username,
                "name": user.first_name or user.username,
                "email": user.email,
                "role": get_user_role(user),
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request):
        user = request.user

        name = request.data.get("name")
        email = request.data.get("email")

        if not isinstance(name, str) or not isinstance(email, str):
            return Response(
                {"detail": "Name and email are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        name = name.strip()
        email = email.strip().lower()

        if not name or not email:
            return Response(
                {"detail": "Name and email cannot be empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(email__iexact=email).exclude(
            id=user.id
        ).exists():
            return Response(
                {"detail": "This email is already in use."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.first_name = name
        user.email = email
        user.save(update_fields=["first_name", "email"])

        return Response(
            {
                "message": "Profile updated successfully.",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "name": user.first_name,
                    "email": user.email,
                    "role": get_user_role(user),
                },
            },
            status=status.HTTP_200_OK,
        )


class AdminInsightsView(APIView):
    """
    Platform-wide statistics for the admin dashboard.
    GET /api/admin/insights/  (admin only)
    """

    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        today = timezone.localdate()
        expenses = Expense.objects.all()

        totals = expenses.aggregate(
            total_value=Sum("amount"),
            total_count=Count("id"),
        )

        month_expenses = expenses.filter(
            date__year=today.year,
            date__month=today.month,
        )

        # Usage and spending per category, including categories with no expenses.
        usage = {
            row["category"]: row
            for row in expenses.values("category").annotate(
                count=Count("id"),
                total=Sum("amount"),
            )
        }

        category_stats = []
        for category in Category.objects.all():
            row = usage.pop(category.name, None)
            category_stats.append(
                {
                    "category": category.name,
                    "count": row["count"] if row else 0,
                    "total": row["total"] if row else Decimal("0"),
                }
            )

        # Expenses whose category name no longer matches a category.
        for name, row in usage.items():
            category_stats.append(
                {
                    "category": name,
                    "count": row["count"],
                    "total": row["total"],
                }
            )

        by_spending = sorted(category_stats, key=lambda c: c["total"], reverse=True)
        most_used = sorted(category_stats, key=lambda c: (-c["count"], c["category"]))
        least_used = sorted(category_stats, key=lambda c: (c["count"], c["category"]))

        recent_expenses = [
            {
                "id": expense.id,
                "title": expense.title,
                "amount": expense.amount,
                "category": expense.category,
                "date": expense.date,
                "payment_method": expense.payment_method,
                "created_at": expense.created_at,
                "user": expense.user.first_name or expense.user.username,
                "user_email": expense.user.email,
            }
            for expense in expenses.select_related("user").order_by("-created_at")[:5]
        ]

        recent_users = [
            {
                "id": user.id,
                "name": user.first_name or user.username,
                "email": user.email,
                "role": get_user_role(user),
                "date_joined": user.date_joined,
                "expense_count": user.expense_count,
            }
            for user in User.objects.annotate(
                expense_count=Count("expenses")
            ).order_by("-date_joined")[:5]
        ]

        return Response(
            {
                "total_users": User.objects.count(),
                "total_expenses": totals["total_count"] or 0,
                "total_expense_value": totals["total_value"] or Decimal("0"),
                "expenses_this_month": month_expenses.count(),
                "expense_value_this_month": (
                    month_expenses.aggregate(total=Sum("amount"))["total"]
                    or Decimal("0")
                ),
                "spending_per_category": by_spending,
                "top_categories": most_used[:5],
                "bottom_categories": least_used[:5],
                "recent_expenses": recent_expenses,
                "recent_users": recent_users,
            }
        )
