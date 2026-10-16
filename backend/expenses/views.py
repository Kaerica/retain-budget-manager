
from django.contrib.auth import authenticate
from django.contrib.auth.models import User

from rest_framework import generics, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Expense, Budget
from .serializers import ExpenseSerializer, BudgetSerializer
from .auth_serializers import SignupSerializer


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
                },
                "token": token.key,
            },
            status=status.HTTP_200_OK,
        )


class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Expense.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


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
                },
            },
            status=status.HTTP_200_OK,
        )
