
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Budget, Category, Expense

User = get_user_model()


class ExpenseAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="erica",
            email="erica@example.com",
            password="TestPassword123!",
        )
        self.client.force_authenticate(user=self.user)

    def test_authenticated_user_can_create_expense(self):
        category = Category.objects.create(
            user=self.user,
            name="Food",
        )

        data = {
            "title": "Lunch",
            "amount": "5000.00",
            "category": category.id,
            "date": "2026-10-01",
            "payment_method": "Cash",
            "description": "Lunch at a restaurant",
        }

        response = self.client.post(
            "/api/expenses/",
            data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )
        self.assertEqual(
            Expense.objects.filter(user=self.user).count(),
            1,
        )

    def test_authenticated_user_can_list_expenses(self):
        category = Category.objects.create(
            user=self.user,
            name="Transport",
        )

        Expense.objects.create(
            user=self.user,
            title="Bus fare",
            amount="1000.00",
            category=category,
            date="2026-10-01",
            payment_method="Cash",
            description="Daily transport",
        )

        response = self.client.get("/api/expenses/")

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            response.data,
        )

    def test_unauthenticated_user_cannot_list_expenses(self):
        self.client.force_authenticate(user=None)

        response = self.client.get("/api/expenses/")

        self.assertIn(
            response.status_code,
            [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN,
            ],
        )

    def test_user_cannot_see_another_users_expenses(self):
        other_user = User.objects.create_user(
            username="other",
            email="other@example.com",
            password="TestPassword123!",
        )

        other_category = Category.objects.create(
            user=other_user,
            name="Other Food",
        )

        Expense.objects.create(
            user=other_user,
            title="Other person's lunch",
            amount="7000.00",
            category=other_category,
            date="2026-10-01",
            payment_method="Cash",
            description="Private expense",
        )

        response = self.client.get("/api/expenses/")

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            response.data,
        )

        results = response.data
        if isinstance(results, dict) and "results" in results:
            results = results["results"]

        self.assertEqual(len(results), 0)


class AuthenticationAndBudgetTests(APITestCase):
    def test_signup_creates_account(self):
        data = {
            "name": "New User",
            "email": "newuser@example.com",
            "password": "StrongPassword123!",
        }

        response = self.client.post(
            "/api/signup/",
            data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )
        self.assertTrue(
            User.objects.filter(email="newuser@example.com").exists()
        )

    def test_signin_returns_token(self):
        User.objects.create_user(
            username="signinuser",
            email="signin@example.com",
            password="StrongPassword123!",
        )

        response = self.client.post(
            "/api/signin/",
            {
                "email": "signin@example.com",
                "password": "StrongPassword123!",
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
        User.objects.create_user(
            username="signinuser",
            email="signin@example.com",
            password="StrongPassword123!",
        )

        response = self.client.post(
            "/api/signin/",
            {
                "email": "signin@example.com",
                "password": "WrongPassword123!",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_authenticated_user_can_create_budget(self):
        user = User.objects.create_user(
            username="budgetuser",
            email="budget@example.com",
            password="TestPassword123!",
        )
        self.client.force_authenticate(user=user)

        data = {
            "amount": "300000.00",
            "month": 10,
            "year": 2026,
        }

        response = self.client.post(
            "/api/budgets/",
            data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )
        self.assertEqual(
            Budget.objects.filter(user=user).count(),
            1,
        )

    def test_budget_endpoint_requires_authentication(self):
        response = self.client.get("/api/budgets/")

        self.assertIn(
            response.status_code,
            [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN,
            ],
        )


class ProfileAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="profileuser",
            email="profile@example.com",
            password="TestPassword123!",
        )
        self.client.force_authenticate(user=self.user)

    def test_authenticated_user_can_view_profile(self):
        response = self.client.get("/api/profile/")

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            response.data,
        )

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
        self.assertEqual(self.user.email, "updated@example.com")

    def test_profile_requires_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.get("/api/profile/")

        self.assertIn(
            response.status_code,
            [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN,
            ],
        )

    def test_profile_rejects_duplicate_email(self):
        User.objects.create_user(
            username="anotheruser",
            email="another@example.com",
            password="TestPassword123!",
        )

        response = self.client.patch(
            "/api/profile/",
            {"email": "another@example.com"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )


class CategoryAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="categoryuser",
            email="category@example.com",
            password="TestPassword123!",
        )
        self.client.force_authenticate(user=self.user)

    def test_authenticated_user_can_create_category(self):
        response = self.client.post(
            "/api/categories/",
            {"name": "Food"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )
        self.assertTrue(
            Category.objects.filter(
                user=self.user,
                name="Food",
            ).exists()
        )

    def test_authenticated_user_can_list_categories(self):
        Category.objects.create(
            user=self.user,
            name="Food",
        )

        response = self.client.get("/api/categories/")

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            response.data,
        )

    def test_user_cannot_see_another_users_categories(self):
        other_user = User.objects.create_user(
            username="othercategoryuser",
            email="othercategory@example.com",
            password="TestPassword123!",
        )

        Category.objects.create(
            user=other_user,
            name="Private Category",
        )

        response = self.client.get("/api/categories/")

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            response.data,
        )

        results = response.data
        if isinstance(results, dict) and "results" in results:
            results = results["results"]

        self.assertEqual(len(results), 0)

    def test_category_endpoint_requires_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.get("/api/categories/")

        self.assertIn(
            response.status_code,
            [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN,
            ],
        )

    def test_duplicate_category_name_is_rejected(self):
        Category.objects.create(
            user=self.user,
            name="Food",
        )

        response = self.client.post(
            "/api/categories/",
            {"name": "Food"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_authenticated_user_can_update_category(self):
        category = Category.objects.create(
            user=self.user,
            name="Food",
        )

        response = self.client.patch(
            f"/api/categories/{category.id}/",
            {"name": "Groceries"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            response.data,
        )

        category.refresh_from_db()
        self.assertEqual(category.name, "Groceries")

    def test_authenticated_user_can_delete_category(self):
        category = Category.objects.create(
            user=self.user,
            name="Food",
        )

        response = self.client.delete(
            f"/api/categories/{category.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.assertFalse(
            Category.objects.filter(id=category.id).exists()
        )
