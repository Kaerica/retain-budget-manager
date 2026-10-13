
from django.contrib.auth import authenticate
from django.contrib.auth.models import User

from rest_framework import generics, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Expense
from .serializers import ExpenseSerializer
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
