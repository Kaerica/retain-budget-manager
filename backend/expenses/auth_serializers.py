
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers


class SignupSerializer(serializers.ModelSerializer):
    name = serializers.CharField(write_only=True, max_length=150)
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = ["id", "name", "email", "password"]
        read_only_fields = ["id"]

    def validate_email(self, value):
        email = value.strip().lower()

        if not email:
            raise serializers.ValidationError("Email is required.")

        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        return email

    def create(self, validated_data):
        name = validated_data.pop("name").strip()
        password = validated_data.pop("password")
        email = validated_data["email"]

        user = User(
            username=email,
            first_name=name,
            **validated_data,
        )
        user.set_password(password)
        user.save()

        return user
