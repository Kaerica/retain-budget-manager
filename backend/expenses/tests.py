
from datetime import date
from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import Expense, Budget


class ExpenseAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="TestPassword123!",
        )

        self.token = Token.objects.create(user=self.user)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Token {self.token.key}"
        )

        self.expense_data = {
            "title": "Groceries",
            "category": "Food",
            "amount": "15000.00",
            "date": date.today().isoformat(),
            "payment_method": "Cash",
            "description": "Weekly groceries",
        }

    def test_authenticated_user_can_create_expense(self):
        response = self.client.post(
            "/api/expenses/",
            self.expense_data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )
        self.assertEqual(Expense.objects.count(), 1)
        self.assertEqual(
            Expense.objects.first().user,
            self.user,
        )

    def test_authenticated_user_can_list_expenses(self):
        Expense.objects.create(
            user=self.user,
            title="Transport",
            category="Travel",
            amount=Decimal("3000.00"),
            date=date.today(),
            payment_method="Cash",
        )

        response = self.client.get("/api/expenses/")

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(len(response.data), 1)

    def test_unauthenticated_user_cannot_list_expenses(self):
        self.client.credentials()

        response = self.client.get("/api/expenses/")

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_user_cannot_see_another_users_expenses(self):
        other_user = User.objects.create_user(
            username="otheruser",
            email="other@example.com",
            password="OtherPassword123!",
        )

        Expense.objects.create(
            user=other_user,
            title="Private expense",
            category="Personal",
            amount=Decimal("5000.00"),
            date=date.today(),
        )

        response = self.client.get("/api/expenses/")

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(len(response.data), 0)


class AuthenticationAndBudgetTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="budgetuser",
            email="budget@example.com",
            password="BudgetPassword123!",
        )

        self.token = Token.objects.create(user=self.user)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Token {self.token.key}"
        )

    def test_signup_creates_account(self):
        response = self.client.post(
            "/api/signup/",
            {
                "name": "New User",
                "email": "new@example.com",
                "password": "StrongPass123!Secure",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )

        self.assertTrue(
            User.objects.filter(
                email="new@example.com"
            ).exists()
        )

        self.assertIn("token", response.data)
        self.assertIn("user", response.data)

    def test_signin_returns_token(self):
        self.client.credentials()

        response = self.client.post(
            "/api/signin/",
            {
                "email": "budget@example.com",
                "password": "BudgetPassword123!",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            response.data,
        )

        self.assertIn("token", response.data)

    def test_signin_rejects_wrong_password(self):
        self.client.credentials()

        response = self.client.post(
            "/api/signin/",
            {
                "email": "budget@example.com",
                "password": "WrongPassword!",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_authenticated_user_can_create_budget(self):
        response = self.client.post(
            "/api/budgets/",
            {
                "amount": "300000.00",
                "month": 10,
                "year": 2026,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )

        self.assertTrue(
            Budget.objects.filter(
                user=self.user,
                month=10,
                year=2026,
                amount=Decimal("300000.00"),
            ).exists()
        )

    def test_budget_endpoint_requires_authentication(self):
        self.client.credentials()

        response = self.client.get("/api/budgets/")

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )


class ProfileAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="profile@example.com",
            email="profile@example.com",
            first_name="Profile User",
            password="ProfilePassword123!",
        )

        self.token = Token.objects.create(user=self.user)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Token {self.token.key}"
        )

    def test_authenticated_user_can_view_profile(self):
        response = self.client.get("/api/profile/")

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            response.data,
        )
        self.assertEqual(response.data["email"], "profile@example.com")
        self.assertEqual(response.data["name"], "Profile User")

    def test_authenticated_user_can_update_profile(self):
        response = self.client.patch(
            "/api/profile/",
            {
                "name": "Updated User",
                "email": "updated@example.com",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            response.data,
        )

        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "Updated User")
        self.assertEqual(self.user.email, "updated@example.com")

    def test_profile_requires_authentication(self):
        self.client.credentials()

        response = self.client.get("/api/profile/")

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_profile_rejects_duplicate_email(self):
        User.objects.create_user(
            username="existing@example.com",
            email="existing@example.com",
            password="ExistingPassword123!",
        )

        response = self.client.patch(
            "/api/profile/",
            {
                "name": "Profile User",
                "email": "existing@example.com",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
