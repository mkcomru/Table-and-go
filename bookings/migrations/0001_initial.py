# Generated by Django 5.1.6 on 2025-04-06 16:08

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('restaurants', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Booking',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('booking_datetime', models.DateTimeField(verbose_name='Дата и время бронирования')),
                ('duration', models.IntegerField(default=2, verbose_name='Продолжительность (часы)')),
                ('guests_count', models.IntegerField(verbose_name='Количество гостей')),
                ('status', models.CharField(choices=[('pending', 'Ожидает подтверждения'), ('confirmed', 'Подтверждено'), ('cancelled', 'Отменено'), ('completed', 'Завершено')], default='pending', max_length=30)),
                ('special_requests', models.TextField(blank=True, null=True, verbose_name='Особые пожелания')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('branch', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='bookings', to='restaurants.branch', verbose_name='Филиал')),
                ('table', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='bookings', to='restaurants.table', verbose_name='Столик')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='bookings', to=settings.AUTH_USER_MODEL, verbose_name='Пользователь')),
            ],
            options={
                'verbose_name': 'Бронирование',
                'verbose_name_plural': 'Бронирования',
                'ordering': ['-booking_datetime'],
                'indexes': [models.Index(fields=['status'], name='bookings_bo_status_233e96_idx'), models.Index(fields=['booking_datetime'], name='bookings_bo_booking_157bda_idx'), models.Index(fields=['branch', 'booking_datetime'], name='bookings_bo_branch__a85f46_idx')],
            },
        ),
    ]
