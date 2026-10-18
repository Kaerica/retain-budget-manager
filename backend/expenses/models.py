
from django.conf import settings
from django.db import models


class Expense(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="expenses",
    )
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    payment_method = models.CharField(
        max_length=50,
        blank=True,
        default="",
    )
    description = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-created_at"]

    def __str__(self):
        return f"{self.title} - {self.amount}"


class Budget(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="budgets",
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    month = models.PositiveSmallIntegerField()
    year = models.PositiveSmallIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-year", "-month"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "month", "year"],
                name="unique_user_monthly_budget",
            )
        ]

    def __str__(self):
        return f"{self.user} - {self.month}/{self.year}: {self.amount}"


# Name of the fallback category. Expenses are moved here when an admin
# deletes the category they belonged to.
DEFAULT_CATEGORY_NAME = "Uncategorized"


class Category(models.Model):
    """
    Expense categories are shared by every user and managed by admins.
    `user` records which admin created the category (it may be empty for
    categories created by the system, e.g. "Uncategorized").
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="expense_categories",
    )
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["name"],
                name="unique_category_name",
            )
        ]

    @classmethod
    def get_default(cls):
        category, _ = cls.objects.get_or_create(name=DEFAULT_CATEGORY_NAME)
        return category

    def __str__(self):
        return self.name
