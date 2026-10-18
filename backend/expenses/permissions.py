from rest_framework.permissions import BasePermission


def get_user_role(user):
    """Admins are Django staff/superusers. Everyone else is a normal user."""
    if user and user.is_authenticated and (user.is_staff or user.is_superuser):
        return "admin"
    return "user"


class IsAdminRole(BasePermission):
    """Allows access only to users with the admin role."""

    message = "You must be an admin to perform this action."

    def has_permission(self, request, view):
        return get_user_role(request.user) == "admin"
