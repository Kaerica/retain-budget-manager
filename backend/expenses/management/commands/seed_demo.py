"""
Seed the database with an admin account, default categories and demo data.

Usage:
    python manage.py seed_demo            # admin + categories + demo user data
    python manage.py seed_demo --no-demo  # admin + categories only

The admin login can be set with environment variables:
    ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME
Running the command again is safe: existing records are not duplicated.
"""

import os
import random
from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.utils import timezone

from expenses.models import Budget, Category, Expense, DEFAULT_CATEGORY_NAME

DEFAULT_CATEGORIES = [
    DEFAULT_CATEGORY_NAME,
    "Food",
    "Transport",
    "Accommodation",
    "Utilities",
    "Subscriptions",
    "Entertainment",
    "Health",
    "Education",
    "Shopping",
]

PAYMENT_METHODS = ["Cash", "Mobile Money", "Card", "Bank Transfer"]

SAMPLE_EXPENSES = {
    "Food": [("Groceries", 8000, 35000), ("Lunch", 3000, 9000), ("Dinner out", 10000, 25000)],
    "Transport": [("Bus fare", 500, 1500), ("Moto ride", 1000, 3000), ("Fuel", 15000, 40000)],
    "Accommodation": [("Rent", 150000, 200000)],
    "Utilities": [("Electricity", 8000, 20000), ("Water bill", 4000, 9000), ("Internet", 20000, 30000)],
    "Subscriptions": [("Netflix", 9000, 12000), ("Spotify", 4000, 6000), ("Phone bundle", 5000, 10000)],
    "Entertainment": [("Cinema", 5000, 10000), ("Concert ticket", 10000, 30000)],
    "Health": [("Pharmacy", 3000, 15000), ("Gym membership", 20000, 30000)],
    "Education": [("Books", 8000, 25000), ("Online course", 15000, 40000)],
    "Shopping": [("Clothes", 15000, 50000), ("Shoes", 20000, 45000)],
}


def month_start(today, months_back):
    year = today.year
    month = today.month - months_back
    while month <= 0:
        month += 12
        year -= 1
    return date(year, month, 1)


class Command(BaseCommand):
    help = "Create the admin account, default categories and demo data."

    def add_arguments(self, parser):
        parser.add_argument(
            "--no-demo",
            action="store_true",
            help="Only create the admin account and categories.",
        )

    def handle(self, *args, **options):
        admin = self.create_admin()

        for name in DEFAULT_CATEGORIES:
            Category.objects.get_or_create(
                name=name,
                defaults={"user": admin},
            )
        self.stdout.write(self.style.SUCCESS("Default categories are ready."))

        if not options["no_demo"]:
            self.create_demo_data()

    def create_admin(self):
        email = os.environ.get("ADMIN_EMAIL", "admin@retain.app").strip().lower()
        password = os.environ.get("ADMIN_PASSWORD", "Admin@12345")
        name = os.environ.get("ADMIN_NAME", "Retain Admin")

        admin = User.objects.filter(email__iexact=email).first()

        if admin is None:
            admin = User.objects.create_superuser(
                username=email,
                email=email,
                password=password,
                first_name=name,
            )
            self.stdout.write(self.style.SUCCESS(f"Admin created: {email}"))
        else:
            if not admin.is_staff:
                admin.is_staff = True
                admin.is_superuser = True
                admin.save(update_fields=["is_staff", "is_superuser"])
            self.stdout.write(f"Admin already exists: {email}")

        return admin

    def create_user(self, name, email, password):
        user = User.objects.filter(email__iexact=email).first()
        if user is None:
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=name,
            )
        return user

    def create_demo_data(self):
        rng = random.Random(42)
        today = timezone.localdate()

        demo = self.create_user("Demo User", "demo@retain.app", "Demo@12345")
        extra_users = [
            self.create_user("Aline Uwase", "aline@retain.app", "Demo@12345"),
            self.create_user("Jean Mugisha", "jean@retain.app", "Demo@12345"),
            self.create_user("Grace Ineza", "grace@retain.app", "Demo@12345"),
        ]

        for user, expense_count in [(demo, 18)] + [(u, 6) for u in extra_users]:
            if Expense.objects.filter(user=user).exists():
                continue

            for months_back in range(4):
                start = month_start(today, months_back)
                Budget.objects.get_or_create(
                    user=user,
                    month=start.month,
                    year=start.year,
                    defaults={"amount": Decimal("400000")},
                )

                days_in_month = (month_start(today, months_back - 1) - start).days
                last_day = today.day if months_back == 0 else days_in_month

                # Rent is paid at the start of every month.
                Expense.objects.create(
                    user=user,
                    title="Rent",
                    category="Accommodation",
                    amount=Decimal("180000"),
                    date=start,
                    payment_method="Bank Transfer",
                    description="Monthly rent",
                )

                for _ in range(expense_count):
                    category = rng.choice(
                        [c for c in SAMPLE_EXPENSES if c != "Accommodation"]
                    )
                    title, low, high = rng.choice(SAMPLE_EXPENSES[category])
                    Expense.objects.create(
                        user=user,
                        title=title,
                        category=category,
                        amount=Decimal(rng.randrange(low, high, 500)),
                        date=start + timedelta(days=rng.randrange(0, max(last_day, 1))),
                        payment_method=rng.choice(PAYMENT_METHODS),
                        description=rng.choice(["", "", "Paid on the way home", "Shared with a friend"]),
                    )

        self.stdout.write(
            self.style.SUCCESS(
                "Demo data is ready. Demo login: demo@retain.app / Demo@12345"
            )
        )
