
from rest_framework import serializers
from .models import Expense


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = [
            "id",
            "user",
            "title",
            "category",
            "amount",
            "date",
            "payment_method",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "created_at",
            "updated_at",
        ]

    def validate_title(self, value):
        title = value.strip()

        if not title:
            raise serializers.ValidationError("Title cannot be empty.")

        return title

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Amount must be greater than zero."
            )
        return value

    def validate_category(self, value):
        """
        Accept either a category name or a category id and always store the
        category's exact name. Only categories created by an admin can be used.
        """
        from .models import Category

        text = str(value).strip()

        if not text:
            raise serializers.ValidationError("Category is required.")

        category = Category.objects.filter(name__iexact=text).first()

        if category is None and text.isdigit():
            category = Category.objects.filter(id=int(text)).first()

        if category is None:
            raise serializers.ValidationError(
                "Please choose an existing category."
            )

        return category.name


from rest_framework import serializers
from .models import Budget


class BudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Budget
        fields = [
            "id",
            "amount",
            "month",
            "year",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Budget amount must be greater than zero."
            )
        return value

    def validate_month(self, value):
        if value < 1 or value > 12:
            raise serializers.ValidationError(
                "Month must be between 1 and 12."
            )
        return value
