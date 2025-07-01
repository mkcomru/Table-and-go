from django.contrib.auth.models import AbstractUser, UserManager
from django.db import models
from establishments.models import Branch
import uuid


class CustomUserManager(UserManager):
    def create_superuser(self, email=None, phone=None, password=None, **extra_fields):
        if not email:
            raise ValueError('Email обязателен')
        
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if not extra_fields.get('username'):
            username = email.split('@')[0] + str(uuid.uuid4())[:8]
            extra_fields['username'] = username

        return self.create_user(email=email, password=password, phone=phone, **extra_fields)


class User(AbstractUser):
    first_name = models.CharField(max_length=100, blank=False, null=False, verbose_name="Имя")
    last_name = models.CharField(max_length=100, blank=False, null=False, verbose_name="Фамилия")
    email = models.EmailField(unique=True, blank=False, null=False, verbose_name="Email")
    phone = models.CharField(max_length=10, unique=True, blank=False, null=False, verbose_name="Номер телефона")
    photo = models.ImageField(upload_to='users/photos/', blank=True, null=True, verbose_name="Фото профиля")

    is_system_admin = models.BooleanField(default=False, verbose_name="Администратор системы")
    administrated_branches = models.ForeignKey(Branch, on_delete=models.CASCADE,
                                                blank=True, null=True, verbose_name="Филиал")
    
    email_notifications = models.BooleanField(default=True, verbose_name="Уведомления по email")
    sms_notifications = models.BooleanField(default=True, verbose_name="SMS уведомления")
    promo_notifications = models.BooleanField(default=False, verbose_name="Рекламные уведомления")
    last_password_change = models.DateTimeField(blank=True, null=True, verbose_name="Дата последнего изменения пароля")
    
    USERNAME_FIELD = 'email'  
    REQUIRED_FIELDS = ['phone', 'first_name', 'last_name']  

    objects = CustomUserManager()
    
    def save(self, *args, **kwargs):
        if not self.username:
            base = self.email.split('@')[0]
            random_string = str(uuid.uuid4())[:8]
            self.username = f"{base}_{random_string}"
        super().save(*args, **kwargs)

    def is_branch_admin(self, branch_id):
        return self.is_staff and self.administrated_branches == branch_id

    def is_admin_of_branch(self, branch):
        from establishments.models import BranchAdmin
        return BranchAdmin.objects.filter(user=self, branch=branch, is_active=True).exists()
    
    def get_administered_branches(self):
        from establishments.models import Branch, BranchAdmin
        branch_ids = BranchAdmin.objects.filter(user=self, is_active=True).values_list('branch_id', flat=True)
        return Branch.objects.filter(id__in=branch_ids)
    
    def get_booking(self):
        from bookings.models import Booking
        return Booking.objects.filter(user=self).order_by('-booking_datetime')
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"
    
    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"


