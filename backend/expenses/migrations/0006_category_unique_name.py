from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("expenses", "0005_merge_duplicate_categories"),
    ]

    operations = [
        migrations.AddConstraint(
            model_name="category",
            constraint=models.UniqueConstraint(
                fields=("name",),
                name="unique_category_name",
            ),
        ),
    ]
