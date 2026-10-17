
from rest_framework import serializers

from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_name(self, value):
        name = value.strip()

        if not name:
            raise serializers.ValidationError(
                "Category name cannot be empty."
            )

        user = self.context["request"].user

        categories = Category.objects.filter(
            user=user,
            name__iexact=name,
        )

        if self.instance:
            categories = categories.exclude(id=self.instance.id)

        if categories.exists():
            raise serializers.ValidationError(
                "You already have a category with this name."
            )

        return name
