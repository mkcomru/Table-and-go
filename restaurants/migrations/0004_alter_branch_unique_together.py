# Generated by Django 5.1.7 on 2025-04-07 13:36

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('restaurants', '0003_alter_establishment_email'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='branch',
            unique_together=set(),
        ),
    ]
