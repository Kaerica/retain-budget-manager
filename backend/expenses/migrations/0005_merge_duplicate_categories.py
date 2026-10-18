from django.db import migrations

DEFAULT_CATEGORY_NAME = "Uncategorized"


def merge_duplicates_and_add_default(apps, schema_editor):
    """
    Before categories were global, two users could each own a category with
    the same name. Keep the oldest one of each name so the new unique
    constraint can be added, and make sure "Uncategorized" exists.
    Expenses store the category name, so they are not affected.
    """
    Category = apps.get_model("expenses", "Category")

    seen = {}
    for category in Category.objects.order_by("created_at", "id"):
        key = category.name.strip().lower()
        if key in seen:
            category.delete()
        else:
            seen[key] = category

    if DEFAULT_CATEGORY_NAME.lower() not in seen:
        Category.objects.create(name=DEFAULT_CATEGORY_NAME)


class Migration(migrations.Migration):

    dependencies = [
        ("expenses", "0004_category_shared_by_all_users"),
    ]

    operations = [
        migrations.RunPython(
            merge_duplicates_and_add_default,
            migrations.RunPython.noop,
        ),
    ]
