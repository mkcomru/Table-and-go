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

    def get_administrators(self):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        return User.objects.filter(restaurant_admin_roles__restaurant=self, 
                                    restaurant_admin_roles__is_active=True)
    
    def get_available_tables(self, capacity=None, datetime=None):
        tables = self.tables.filter(status='available')
        if capacity:
            tables = tables.filter(capacity__gte=capacity)
        return tables
    
    def table_count(self):
        return self.tables.count()
    
    def is_open_at(self, datetime_obj):
        day_of_week = datetime_obj.weekday()
        time_obj = datetime_obj.time()

        try:
            working_hours = self.working_hours.get(day_of_week=day_of_week)
            if working_hours.is_closed:
                return False
            return working_hours.opening_time <= time_obj <= working_hours.closing_time
        except WorkingHours.DoesNotExist:
            return False

    def average_rating(self):
        from django.db.models import Avg
        avg = self.reviews.filter(is_approved=True).aggregate(Avg('rating'))
        return avg['rating__avg'] or 0
    
    def get_main_image(self):
        main_image = self.images.filter(is_main=True).first()
        if main_image:
            return main_image.image.url
        any_image = self.images.first()
        if any_image:
            return any_image.image.url
        return '/static/images/default-restaurant.jpg'

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
        
        # Проверка существующих бронирований
        from bookings.models import Booking
        conflicting_bookings = Booking.objects.filter(
            table=self,
            status__in=['pending', 'confirmed'],
            booking_datetime__lt=datetime_end,
            booking_datetime__gte=datetime_start
        ).exists()
        
        return not conflicting_bookings


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


class WorkingHours(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE,
                                    related_name='working_hours', verbose_name='Ресторан')
    DAYS_OF_WEEK = [
        (0, 'Понедельник'),
        (1, 'Вторник'),
        (2, 'Среда'),
        (3, 'Четверг'),
        (4, 'Пятница'),
        (5, 'Суббота'),
        (6, 'Воскресенье'),
    ]
    day_of_week = models.IntegerField(choices=DAYS_OF_WEEK, verbose_name="День недели")

    opening_time = models.TimeField(null= True, blank=True, verbose_name="Время открытия")
    closing_time = models.TimeField(null= True, blank=True, verbose_name="Время закрытия")
    is_closed = models.BooleanField(default=False, verbose_name="Выходной")

    class Meta:
        verbose_name = "Часы работы"
        verbose_name_plural = "Часы работы"
        unique_together = ['restaurant', 'day_of_week']
        ordering = ['restaurant', 'day_of_week']

    def __str__(self):
        if self.is_closed:
            return f"{self.restaurant.name} - {self.get_day_of_week_display()}: Выходной"
        return f"{self.restaurant.name} - {self.get_day_of_week_display()}: {self.opening_time.strftime('%H:%M')} - {self.closing_time.strftime('%H:%M')}"
    
    def is_open_at(self, time):
        if self.is_closed or not self.opening_time or not self.closing_time:
            return False
        return self.opening_time <= time <= self.closing_time


class Menu(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE,
                                    related_name="menu", verbose_name="Ресторан")
    name = models.CharField(max_length=150, verbose_name="Название блюда")
    description = models.TextField(blank=True, null=True, verbose_name="Описание")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Цена")

    CATEGORY_CHOICES = [
        ('starter', 'Закуска'),
        ('main', 'Основное блюдо'),
        ('dessert', 'Десерт'),
        ('drink', 'Напиток'),
        ('salad', 'Салат'),
    ]
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, verbose_name="Категория")
    image = models.ImageField(upload_to='menu/', blank=True, null=True, verbose_name="Фото блюда")
    is_available = models.BooleanField(default=True, verbose_name="Доступно")
    
    class Meta:
        verbose_name = "Пункты меню"
        verbose_name_plural = "Пункты меню"
        ordering = ['category', 'name']

    def __str__(self):
        return f"{self.name} - {self.price} руб. ({self.restaurant.name})"


class RestaurantImage(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE,
                                    related_name='images', verbose_name="Ресторан")
    image = models.ImageField(upload_to='restaurant_images', verbose_name="Фото ресторана")
    caption = models.CharField(max_length=150, blank=True, null=True, verbose_name="Описание блюда")
    is_main = models.BooleanField(default=False, verbose_name="Главное изображение")
    order = models.PositiveIntegerField(default=0, verbose_name="Порядок отображения")

    class Meta:
        verbose_name = "Фото ресторана"
        verbose_name_plural = "Фото ресторанов"
        ordering = ['-is_main', 'order']

    def __str__(self):
        return f"Фото {self.restaurant.name}" + (f": {self.caption}" if self.caption else "")
    
    def save(self, *args, **kwargs):
        if self.is_main:
            RestaurantImage.objects.filter(
                restaurant=self.restaurant, 
                is_main=True
            ).exclude(pk=self.pk).update(is_main=False)
        super().save(*args, **kwargs)












