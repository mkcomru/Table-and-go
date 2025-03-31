from django.db import models
from django.conf import settings
import secrets
from django.utils import timezone


class Cuisine(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name="Название")
    description = models.TextField(blank=True, null=True, verbose_name="Описание")

    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = "Кухня"
        verbose_name_plural = "Кухни"
        ordering = ["name"]


class Restaurant(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name="Название ресторана")
    description = models.TextField(blank=True, null=True, verbose_name="Описание ресторана")
    address = models.CharField(max_length=256, verbose_name="Адрес ресторана")
    phone = models.CharField(max_length=10, verbose_name="Контактный телефон")
    email = models.EmailField(unique=True, blank=False, null=False, verbose_name="Email")

    latitude = models.DecimalField(
        max_digits=9, decimal_places=6,
        blank=True, null=True,
        verbose_name="Широта"
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6,
        blank=True, null=True,
        verbose_name="Долгота"
    )

    website_url = models.URLField(blank=True, null=True, verbose_name="Сайт ресторана")

    cuisines = models.ManyToManyField(Cuisine, related_name="restaurants", verbose_name="Типы кухни")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")

    def add_administrator(self, user):
        from restaurants.models import RestaurantAdmin
        return RestaurantAdmin.objects.get_or_create(user=user, restaurant=self, defaults={'is_active': True})
    
    def remove_administrator(self, user):
        from restaurants.models import RestaurantAdmin
        RestaurantAdmin.objects.filter(user=user, restaurant=self).delete()

    def get_administrator(self):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        return User.objects.filter(restaurant_admin_roles__restaurant=self, 
                                    restaurant_admin_roles__is_active=True)
    
    def get_available_tables(self, capacity=None, datetime=None):
        tables = self.tables.filter(status='available')
        if capacity:
            tables = self.tables.filter(capacity__gte=capacity)
        return tables
    
    def table_count(self):
        return self.tables.count()

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Ресторан"
        verbose_name_plural = "Рестораны"
        ordering = ['-created_at']


class Table(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='tables', verbose_name="Ресторан")
    number = models.IntegerField(verbose_name="Номер столика")
    capacity = models.IntegerField(verbose_name="Вместимость")
    STATUS_CHOICES = [
        ('available', 'Доступен'),
        ('reserved', 'Забронирован'),
        ('maintenance', 'На обслуживании'),
    ]
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='available', verbose_name="Статус")
    location = models.CharField(max_length=100, blank=True, null=True, verbose_name="Расположение")
    
    class Meta:
        verbose_name = "Столик"
        verbose_name_plural = "Столики"
        unique_together = ['restaurant', 'number']
        ordering = ['restaurant', 'number']

    def __str__(self):
        return f"Номер столика: {self.number} ({self.restaurant.name})"
    
    def is_available_for_booking(self, datetime_start, datetime_end):
        if self.status != 'available':
            return False

        return True


class RestaurantAdmin(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                related_name='restaurant_admin_roles', verbose_name="Пользователь")

    restaurant = models.ForeignKey('Restaurant', on_delete=models.CASCADE,
                                    related_name='administrators', verbose_name="Ресторан")
    is_active = models.BooleanField(default=True, verbose_name="Активен")
    date_added = models.DateTimeField(auto_now_add=True, verbose_name="Дата добавления")

    class Meta():
        unique_together = ('user', 'restaurant')
        verbose_name = 'Администратор ресторана'
        verbose_name_plural = 'Администраторы ресторанов'

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name} - {self.restaurant.name}"


class AdminInvitation(models.Model):
    restaurant = models.ForeignKey('Restaurant', on_delete=models.CASCADE, 
                                    related_name='invitations', verbose_name="Ресторан")
    email = models.EmailField(verbose_name="Email приглашаемого")
    phone = models.CharField(max_length=15, blank=True, null=True, verbose_name="Телефон приглашаемого")
    invitation_code = models.CharField(max_length=20, unique=True, verbose_name="Код приглашения")
    is_used = models.BooleanField(default=False, verbose_name="Использовано")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    expires_at = models.DateTimeField(verbose_name="Действительно до")
    
    def save(self, *args, **kwargs):
        if not self.invitation_code:
            self.invitation_code = secrets.token_urlsafe(16)
        if not self.expires_at:
            self.expires_at = timezone.now() + timezone.timedelta(days=7)
        super().save(*args, **kwargs)
    
    def is_valid(self):
        return not self.is_used and timezone.now() < self.expires_at
    
    class Meta:
        verbose_name = 'Приглашение администратора'
        verbose_name_plural = 'Приглашения администраторов'
    
    def __str__(self):
        return f"Приглашение для {self.email} в ресторан {self.restaurant.name}"


