
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

        # Categories are shared by all users, so names must be unique
        # across the whole platform.
        categories = Category.objects.filter(name__iexact=name)

        if self.instance:
            categories = categories.exclude(id=self.instance.id)

        if categories.exists():
            raise serializers.ValidationError(
                "A category with this name already exists."
            )

        return name
