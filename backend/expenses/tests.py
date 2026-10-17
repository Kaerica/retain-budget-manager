
from datetime import date
from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import Expense


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

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Expense.objects.count(), 1)
        self.assertEqual(Expense.objects.first().user, self.user)

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

        self.assertEqual(response.status_code, status.HTTP_200_OK)
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

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)
