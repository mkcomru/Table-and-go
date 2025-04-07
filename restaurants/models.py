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


class District(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name='Название района')

    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = 'Район'
        verbose_name_plural = 'Районы'


class Establishment(models.Model):
    ESTABLISHMENT_TYPE = [
        ('bar', 'Бар'),
        ('restaurant', 'Ресторан'),
    ]
    establishment_type = models.CharField(
        max_length=20,
        choices=ESTABLISHMENT_TYPE,
        default='restaurant',
        verbose_name="Тип заведения"
    )
    name = models.CharField(max_length=100, unique=True, verbose_name="Название заведения")
    description = models.TextField(blank=True, null=True, verbose_name="Описание заведения")
    email = models.EmailField(unique=True, blank=True, null=True, verbose_name="Email")
    website_url = models.URLField(blank=True, null=True, verbose_name="Сайт ресторана")
    cuisines = models.ManyToManyField(Cuisine, related_name="restaurants", verbose_name="Типы кухни")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")

    def __str__(self):
        return self.name

    def get_branches_count(self):
        return self.branches.count()

    def get_main_branch(self):
        main_branch = self.branches.filter(is_main=True).first()
        if not main_branch:
            main_branch = self.branches.first()
        return main_branch
    
    def get_all_branches(self):
        return self.branches.order_by('-is_main', 'name')
    
    def has_multiple_branches(self):
        return self.get_branches_count() > 1

    class Meta:
        verbose_name = "Заведение"
        verbose_name_plural = "Заведения"
        ordering = ['-created_at']


class Branch(models.Model):
    establishment = models.ForeignKey(Establishment, on_delete=models.CASCADE,
                                        related_name='branches', verbose_name="Заведение")
    name = models.CharField(max_length=100, blank=True, null=True, verbose_name="Название филиала")
    is_main = models.BooleanField(default=False, verbose_name="Основной филиал")
    address = models.CharField(max_length=256, verbose_name="Адрес филиала")
    district = models.ForeignKey(District, on_delete=models.CASCADE,
                                    related_name='branches', verbose_name="Район")
    phone = models.CharField(max_length=10, verbose_name="Номер телефона")
    average_check = models.DecimalField(max_digits=10, decimal_places=2, default=0,
                                        verbose_name="Средний чек")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")
    
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

    def get_main_image(self):
        main_image = self.images.filter(is_main=True).first()
        if main_image:
            return main_image.image.url
        any_image = self.images.first()
        if any_image:
            return any_image.image.url
        return '/static/images/default-restaurant.jpg'
    
    def average_rating(self):
        from django.db.models import Avg
        avg = self.reviews.filter(is_approved=True).aggregate(Avg('rating'))
        return avg['rating__avg'] or 0
    
    def add_administrator(self, user):
        from restaurants.models import EstablishmentAdmin
        return EstablishmentAdmin.objects.get_or_create(user=user, establishment=self.establishment, defaults={'is_active': True})
    
    def remove_administrator(self, user):
        from restaurants.models import EstablishmentAdmin
        EstablishmentAdmin.objects.filter(user=user, establishment=self.establishment).delete()

    def get_administrators(self):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        return User.objects.filter(restaurant_admin_roles__establishment=self.establishment, 
                                    restaurant_admin_roles__is_active=True)

    def __str__(self):
        if self.name:
            return f"{self.establishment.name} - {self.name}"
        return f"{self.establishment.name} ({self.address})"

    def save(self, *args, **kwargs):
        if self.is_main:
            Branch.objects.filter(
                establishment=self.establishment, 
                is_main=True
            ).exclude(pk=self.pk).update(is_main=False)
        
        if not self.pk and not Branch.objects.filter(establishment=self.establishment).exists():
            self.is_main = True
            
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Филиал"
        verbose_name_plural = "Филиалы"
        ordering = ['establishment', '-is_main', 'name']


class Table(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, 
                                related_name='tables', verbose_name="Ресторан", null=True, blank=True)
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
        unique_together = ['branch', 'number']
        ordering = ['branch', 'number']

    def __str__(self):
        return f"Номер столика: {self.number} ({self.branch.establishment.name} - {self.branch.name})"
    
    def is_available_for_booking(self, datetime_start, datetime_end):
        if self.status != 'available':
            return False

        from bookings.models import Booking
        conflicting_bookings = Booking.objects.filter(
            table=self,
            status__in=['pending', 'confirmed'],
            booking_datetime__lt=datetime_end,
            booking_datetime__gte=datetime_start
        ).exists()
        
        return not conflicting_bookings


class EstablishmentAdmin(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                related_name='restaurant_admin_roles', verbose_name="Пользователь")

    establishment = models.ForeignKey(Establishment, on_delete=models.CASCADE,
                                    related_name='administrators', verbose_name="Заведение", null=True, blank=True)
    is_active = models.BooleanField(default=True, verbose_name="Активен")
    date_added = models.DateTimeField(auto_now_add=True, verbose_name="Дата добавления")

    class Meta():
        unique_together = ('user', 'establishment')
        verbose_name = 'Администратор ресторана'
        verbose_name_plural = 'Администраторы ресторанов'

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name} - {self.establishment.name}"


class AdminInvitation(models.Model):
    establishment = models.ForeignKey(Establishment, on_delete=models.CASCADE, 
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
        return f"Приглашение для {self.email} в заведение {self.establishment.name}"


class WorkingHours(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE,
                                related_name='working_hours', verbose_name='Ресторан', null=True, blank=True)
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
        unique_together = ['branch', 'day_of_week']
        ordering = ['branch', 'day_of_week']

    def __str__(self):
        if self.is_closed:
            return f"{self.branch.establishment.name} - {self.branch.name} - {self.get_day_of_week_display()}: Выходной"
        return f"{self.branch.establishment.name} - {self.branch.name} - {self.get_day_of_week_display()}: {self.opening_time.strftime('%H:%M')} - {self.closing_time.strftime('%H:%M')}"
    
    def is_open_at(self, time):
        if self.is_closed or not self.opening_time or not self.closing_time:
            return False
        return self.opening_time <= time <= self.closing_time


class Menu(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE,
                                related_name="menu", verbose_name="Филиал", null=True, blank=True)
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
        return f"{self.name} - {self.price} руб. ({self.branch.establishment.name} - {self.branch.name})"


class BranchImage(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE,
                                related_name='images', verbose_name="Филиал", null=True, blank=True)
    image = models.ImageField(upload_to='branch_images', verbose_name="Фото филиала")
    caption = models.CharField(max_length=150, blank=True, null=True, verbose_name="Описание фото")
    is_main = models.BooleanField(default=False, verbose_name="Главное изображение")
    order = models.PositiveIntegerField(default=0, verbose_name="Порядок отображения")

    class Meta:
        verbose_name = "Фото филиала"
        verbose_name_plural = "Фото филиалов"
        ordering = ['-is_main', 'order']

    def __str__(self):
        return f"Фото {self.branch.establishment.name} - {self.branch.name}" + (f": {self.caption}" if self.caption else "")
    
    def save(self, *args, **kwargs):
        if self.is_main:
            BranchImage.objects.filter(
                branch=self.branch, 
                is_main=True
            ).exclude(pk=self.pk).update(is_main=False)
        super().save(*args, **kwargs)












