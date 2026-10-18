
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
    """
    Categories are shared by all users and managed by admins only.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            username="categoryuser",
            email="category@example.com",
            password="TestPassword123!",
        )
        self.admin = User.objects.create_user(
            username="categoryadmin",
            email="categoryadmin@example.com",
            password="TestPassword123!",
            is_staff=True,
        )
        self.client.force_authenticate(user=self.admin)

    def test_admin_can_create_category(self):
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
        self.assertTrue(Category.objects.filter(name="Food").exists())

    def test_normal_user_cannot_create_category(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            "/api/categories/",
            {"name": "Food"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_normal_user_can_list_shared_categories(self):
        Category.objects.create(user=self.admin, name="Food")
        self.client.force_authenticate(user=self.user)

        response = self.client.get("/api/categories/")

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            response.data,
        )
        names = [category["name"] for category in response.data]
        self.assertIn("Food", names)
        self.assertIn("Uncategorized", names)

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
        Category.objects.create(user=self.admin, name="Food")

        response = self.client.post(
            "/api/categories/",
            {"name": "food"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_admin_can_update_category_and_expenses_follow(self):
        category = Category.objects.create(user=self.admin, name="Food")
        Expense.objects.create(
            user=self.user,
            title="Lunch",
            amount="5000.00",
            category="Food",
            date="2026-10-01",
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
        self.assertEqual(
            Expense.objects.get(title="Lunch").category,
            "Groceries",
        )

    def test_normal_user_cannot_delete_category(self):
        category = Category.objects.create(user=self.admin, name="Food")
        self.client.force_authenticate(user=self.user)

        response = self.client.delete(f"/api/categories/{category.id}/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Category.objects.filter(id=category.id).exists())

    def test_deleting_category_moves_expenses_to_uncategorized(self):
        category = Category.objects.create(user=self.admin, name="Food")
        Expense.objects.create(
            user=self.user,
            title="Lunch",
            amount="5000.00",
            category="Food",
            date="2026-10-01",
        )

        response = self.client.delete(f"/api/categories/{category.id}/")

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )
        self.assertFalse(Category.objects.filter(id=category.id).exists())
        self.assertEqual(
            Expense.objects.get(title="Lunch").category,
            "Uncategorized",
        )

    def test_uncategorized_cannot_be_deleted(self):
        default = Category.objects.get(name="Uncategorized")

        response = self.client.delete(f"/api/categories/{default.id}/")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class RoleAndAdminInsightsTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="normal@example.com",
            email="normal@example.com",
            password="TestPassword123!",
        )
        self.admin = User.objects.create_user(
            username="admin@example.com",
            email="admin@example.com",
            password="TestPassword123!",
            is_staff=True,
        )
        Expense.objects.create(
            user=self.user,
            title="Lunch",
            amount="5000.00",
            category="Uncategorized",
            date="2026-10-01",
        )

    def test_signin_returns_role(self):
        response = self.client.post(
            "/api/signin/",
            {"email": "admin@example.com", "password": "TestPassword123!"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["role"], "admin")

    def test_signup_always_creates_normal_user(self):
        response = self.client.post(
            "/api/signup/",
            {
                "name": "Sneaky",
                "email": "sneaky@example.com",
                "password": "StrongPassword123!",
                "role": "admin",
                "is_staff": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["user"]["role"], "user")
        self.assertFalse(User.objects.get(email="sneaky@example.com").is_staff)

    def test_admin_can_view_insights(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get("/api/admin/insights/")

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["total_users"], 2)
        self.assertEqual(response.data["total_expenses"], 1)
        self.assertIn("top_categories", response.data)
        self.assertIn("bottom_categories", response.data)
        self.assertIn("recent_users", response.data)

    def test_normal_user_cannot_view_insights(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get("/api/admin/insights/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ExpenseFilterAndSummaryTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="filter@example.com",
            email="filter@example.com",
            password="TestPassword123!",
        )
        self.client.force_authenticate(user=self.user)

        Category.objects.create(name="Food")
        Category.objects.create(name="Transport")

        Expense.objects.create(
            user=self.user, title="Lunch", amount="5000.00",
            category="Food", date="2026-10-01", payment_method="Cash",
        )
        Expense.objects.create(
            user=self.user, title="Bus", amount="1000.00",
            category="Transport", date="2026-10-05", payment_method="Mobile Money",
        )
        Expense.objects.create(
            user=self.user, title="Dinner", amount="12000.00",
            category="Food", date="2026-09-20", payment_method="Card",
        )

    def get_results(self, url):
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        return response.data

    def test_filter_by_category(self):
        results = self.get_results("/api/expenses/?category=Food")
        self.assertEqual(len(results), 2)

    def test_filter_by_payment_method(self):
        results = self.get_results("/api/expenses/?payment_method=Cash")
        self.assertEqual(len(results), 1)

    def test_filter_by_date_and_amount(self):
        results = self.get_results(
            "/api/expenses/?date_from=2026-10-01&date_to=2026-10-31&min_amount=2000"
        )
        self.assertEqual([e["title"] for e in results], ["Lunch"])

    def test_sort_by_amount(self):
        results = self.get_results("/api/expenses/?ordering=-amount")
        self.assertEqual(results[0]["title"], "Dinner")

    def test_pagination_when_page_is_requested(self):
        data = self.get_results("/api/expenses/?page=1&page_size=2")
        self.assertEqual(data["count"], 3)
        self.assertEqual(len(data["results"]), 2)

    def test_monthly_summary(self):
        Budget.objects.create(user=self.user, amount="6500.00", month=10, year=2026)

        data = self.get_results("/api/expenses/summary/?month=10&year=2026")

        self.assertEqual(float(data["total_spent"]), 6000.0)
        self.assertEqual(float(data["remaining_budget"]), 500.0)
        self.assertEqual(data["budget_status"], "approaching")
        self.assertEqual(data["highest_expense"]["title"], "Lunch")

    def test_unknown_category_is_rejected(self):
        response = self.client.post(
            "/api/expenses/",
            {
                "title": "Mystery",
                "amount": "100.00",
                "category": "Does not exist",
                "date": "2026-10-01",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
