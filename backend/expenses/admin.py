
from django.contrib import admin

from .models import Expense, Budget


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "user",
        "category",
        "amount",
        "date",
        "payment_method",
    )
    list_filter = (
        "category",
        "date",
        "payment_method",
    )
    search_fields = (
        "title",
        "user__username",
        "user__email",
        "category",
        "description",
    )
    ordering = ("-date",)
    date_hierarchy = "date"
    list_per_page = 25


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "amount",
        "month",
        "year",
        "updated_at",
    )
    list_filter = ("year", "month")
    search_fields = (
        "user__username",
        "user__email",
    )
    ordering = ("-year", "-month")
    list_per_page = 25
