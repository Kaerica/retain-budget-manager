
from django.contrib import admin
from .models import Expense


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "user",
        "category",
        "amount",
        "date",
    )
    list_filter = ("category", "date")
    search_fields = ("title", "user__username", "category")
    ordering = ("-date",)
